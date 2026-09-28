import { logger } from '../utils/logger.js';
import { fetchDiff } from '../github/fetchDiff.js';
import { postReview } from '../github/postReview.js';
import { DiffParser } from '../review/DiffParser.js';
import { ReviewEngine } from '../review/ReviewEngine.js';
import { CommentFormatter } from '../review/CommentFormatter.js';
import { BugRiskStrategy } from '../review/strategies/BugRiskStrategy.js';
import { StyleStrategy } from '../review/strategies/StyleStrategy.js';
import { TestCoverageStrategy } from '../review/strategies/TestCoverageStrategy.js';
import {
  createReview,
  markReviewing,
  completeReview,
  failReview,
} from '../db/reviews.js';

const HANDLED_ACTIONS = new Set(['opened', 'synchronize', 'reopened']);

const parser = new DiffParser();
const formatter = new CommentFormatter();
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
    action: payload.action,
    headSha: pull_request.head.sha,
  });

  // Persist a review row immediately, so the dashboard can show "reviewing..."
  const reviewId = createReview({
    repo: repository.full_name,
    prNumber: pull_request.number,
    prTitle: pull_request.title,
    prAuthor: pull_request.user.login,
    headSha: pull_request.head.sha,
  });
  logger.info(`  → created review row #${reviewId}`);

  try {
    const diff = await fetchDiff({ owner, repo, prNumber: pull_request.number });

    logger.info('  → fetched diff', {
      fileCount: diff.files.length,
      truncated: diff.truncated,
    });

    const rawDiff = diff.rawDiff || diff.files
      .filter((f) => f.patch)
      .map((f) => `+++ b/${f.path}\n${f.patch}`)
      .join('\n');

    const parsed = parser.parse(rawDiff);
    const diffText = parser.toAddedLinesText(parsed);
    const validLines = parser.validLineKeys(parsed);

    markReviewing(reviewId);

    const findings = await engine.run(diffText, {
      owner,
      repo,
      prNumber: pull_request.number,
    });

    logger.info(`  → review complete: ${findings.length} findings`);

    const githubReview = await postReview({
      owner,
      repo,
      prNumber: pull_request.number,
      findings,
      validLines,
      formatter,
    });

    completeReview(reviewId, findings, githubReview?.id ?? null);
    logger.info(`  → saved review #${reviewId} to database`);
  } catch (err) {
    logger.error('Pipeline failed', err.message);
    failReview(reviewId, err.message);
  }
}