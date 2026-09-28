import { octokit } from './client.js';
import { logger } from '../utils/logger.js';

const MAX_INLINE = 50; // GitHub's practical cap per review call

/**
 * Post a PR review with inline comments.
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.prNumber
 * @param {Array} params.findings
 * @param {Set<string>} params.validLines - set of "file:line" strings present in the diff
 * @param {object} params.formatter - CommentFormatter instance
 */
export async function postReview({ owner, repo, prNumber, findings, validLines, formatter }) {
  const inlineable = [];
  const summaryOnly = [];

  for (const f of findings) {
    const key = `${f.file}:${f.line}`;
    if (validLines.has(key) && inlineable.length < MAX_INLINE) {
      inlineable.push(f);
    } else {
      summaryOnly.push(f);
    }
  }

  const body = formatter.formatSummary(findings, { owner, repo, prNumber });

  const comments = inlineable.map((f) => ({
    path: f.file,
    line: f.line,
    side: 'RIGHT',
    body: formatter.formatInlineComment(f),
  }));

  try {
    const { data } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      body,
      event: 'COMMENT',
      comments,
    });

    logger.info(`  → posted PR review #${data.id}`, {
      inlineComments: comments.length,
      summaryOnly: summaryOnly.length,
    });

    return data;
  } catch (err) {
    logger.error('Failed to post review', err.message);

    // Fallback: post a single issue comment if createReview fails
    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: body + '\n\n_(Inline comments unavailable — fell back to summary.)_',
      });
      logger.info('  → fell back to issue comment');
    } catch (fallbackErr) {
      logger.error('Fallback comment also failed', fallbackErr.message);
    }

    throw err;
  }
}