import { logger } from '../utils/logger.js';
import { fetchDiff } from '../github/fetchDiff.js';

const HANDLED_ACTIONS = new Set(['opened', 'synchronize', 'reopened']);

export async function handleWebhook(event, payload, deliveryId) {
  logger.info(`event=${event} action=${payload.action} delivery=${deliveryId}`);

  if (event !== 'pull_request') {
    logger.info(`  → ignoring (not a pull_request event)`);
    return;
  }

  if (!HANDLED_ACTIONS.has(payload.action)) {
    logger.info(`  → ignoring (action "${payload.action}" not in handled set)`);
    return;
  }

  const { repository, pull_request } = payload;
  const [owner, repo] = repository.full_name.split('/');

  logger.info('  → PR event accepted', {
    repo: repository.full_name,
    pr: pull_request.number,
    title: pull_request.title,
    author: pull_request.user.login,
    action: payload.action,
    headSha: pull_request.head.sha,
  });

  try {
    const diff = await fetchDiff({
      owner,
      repo,
      prNumber: pull_request.number,
    });

    logger.info(`  → fetched diff`, {
      fileCount: diff.files.length,
      truncated: diff.truncated,
      totalAdditions: diff.files.reduce((s, f) => s + f.additions, 0),
      totalDeletions: diff.files.reduce((s, f) => s + f.deletions, 0),
    });

    for (const f of diff.files) {
      logger.info(`     • ${f.status.padEnd(9)} ${f.path}  +${f.additions} -${f.deletions}${f.patch ? '' : '  (no patch)'}`);
    }

    // Phase 3 will plug in here:
    //   const findings = await reviewEngine.run(...)
  } catch (err) {
    logger.error('Failed to fetch diff', err.message);
  }
}