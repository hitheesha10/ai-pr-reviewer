import { logger } from '../utils/logger.js';
import { fetchDiff } from '../github/fetchDiff.js';
import { DiffParser } from '../review/DiffParser.js';
import { ReviewEngine } from '../review/ReviewEngine.js';
import { BugRiskStrategy } from '../review/strategies/BugRiskStrategy.js';
import { StyleStrategy } from '../review/strategies/StyleStrategy.js';
import { TestCoverageStrategy } from '../review/strategies/TestCoverageStrategy.js';

const HANDLED_ACTIONS = new Set(['opened', 'synchronize', 'reopened']);

const parser = new DiffParser();
const engine = new ReviewEngine([
  new BugRiskStrategy(),
  new StyleStrategy(),
  new TestCoverageStrategy(),
]);

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

    logger.info('  → fetched diff', {
      fileCount: diff.files.length,
      truncated: diff.truncated,
      totalAdditions: diff.files.reduce((s, f) => s + f.additions, 0),
      totalDeletions: diff.files.reduce((s, f) => s + f.deletions, 0),
    });

    for (const f of diff.files) {
      logger.info(
        `     • ${f.status.padEnd(9)} ${f.path}  +${f.additions} -${f.deletions}${f.patch ? '' : '  (no patch)'}`
      );
    }

    const rawDiff = diff.rawDiff || diff.files
      .filter((f) => f.patch)
      .map((f) => `+++ b/${f.path}\n${f.patch}`)
      .join('\n');

    const parsed = parser.parse(rawDiff);
    const diffText = parser.toAddedLinesText(parsed);

    const findings = await engine.run(diffText, {
      owner,
      repo,
      prNumber: pull_request.number,
    });

    logger.info(`  → review complete: ${findings.length} findings`);
    for (const f of findings) {
      logger.info(`     [${f.severity}] ${f.type} ${f.file}:${f.line} — ${f.message}`);
    }

    // Phase 4 plugs in here:
    //   await postReview({ owner, repo, prNumber: pull_request.number, findings });
  } catch (err) {
    logger.error('Pipeline failed', err.message);
  }
}