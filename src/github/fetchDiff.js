import { octokit } from './client.js';
import { logger } from '../utils/logger.js';

/**
 * Fetch PR file list + patches.
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.prNumber
 * @returns {Promise<{ files: Array, truncated: boolean, rawDiff: string | null }>}
 */
export async function fetchDiff({ owner, repo, prNumber }) {
  const files = await fetchFiles({ owner, repo, prNumber });

  // Detect truncation — any file missing `patch` when it has additions/deletions
  const truncated = files.some(
    (f) => !f.patch && (f.additions > 0 || f.deletions > 0) && !f.binary
  );

  let rawDiff = null;
  if (truncated) {
    logger.warn(`Patch truncated for PR #${prNumber} — falling back to raw diff mode`);
    rawDiff = await fetchRawDiff({ owner, repo, prNumber });
  }

  return { files, truncated, rawDiff };
}

async function fetchFiles({ owner, repo, prNumber }) {
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  return data.map((f) => ({
    path: f.filename,
    status: f.status,           // added | modified | removed | renamed
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    binary: !f.patch && f.changes === 0,
    patch: f.patch || null,
  }));
}

async function fetchRawDiff({ owner, repo, prNumber }) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: 'diff' },
  });
  // When mediaType.format is 'diff', octokit returns the raw string
  return typeof data === 'string' ? data : String(data);
}