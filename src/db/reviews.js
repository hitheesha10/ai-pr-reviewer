import { db } from './index.js';

/**
 * Create a review row (status: 'pending').
 */
export function createReview({ repo, prNumber, prTitle, prAuthor, headSha }) {
  const stmt = db.prepare(`
    INSERT INTO reviews (repo, pr_number, pr_title, pr_author, head_sha, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  const info = stmt.run(repo, prNumber, prTitle, prAuthor, headSha);
  return info.lastInsertRowid;
}

/**
 * Mark review as 'reviewing'.
 */
export function markReviewing(reviewId) {
  db.prepare(`UPDATE reviews SET status = 'reviewing' WHERE id = ?`).run(reviewId);
}

/**
 * Mark review as 'completed' and store findings + counts.
 */
export function completeReview(reviewId, findings, githubReviewId = null) {
  const tx = db.transaction(() => {
    const insertFinding = db.prepare(`
      INSERT INTO findings (review_id, type, severity, file, line, message, suggestion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const f of findings) {
      insertFinding.run(reviewId, f.type, f.severity, f.file, f.line, f.message, f.suggestion || '');
    }

    const counts = { high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      if (counts[f.severity] !== undefined) counts[f.severity]++;
    }

    db.prepare(`
      UPDATE reviews
      SET status = 'completed',
          finding_count = ?,
          high_count = ?,
          medium_count = ?,
          low_count = ?,
          github_review_id = ?,
          completed_at = datetime('now')
      WHERE id = ?
    `).run(findings.length, counts.high, counts.medium, counts.low, githubReviewId, reviewId);
  });

  tx();
}

/**
 * Mark review as 'failed' with an error message.
 */
export function failReview(reviewId, errorMessage) {
  db.prepare(`
    UPDATE reviews
    SET status = 'failed', error = ?, completed_at = datetime('now')
    WHERE id = ?
  `).run(String(errorMessage).slice(0, 500), reviewId);
}

/**
 * List reviews, newest first.
 */
export function listReviews({ limit = 50, repo = null } = {}) {
  const sql = repo
    ? `SELECT * FROM reviews WHERE repo = ? ORDER BY created_at DESC LIMIT ?`
    : `SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?`;
  const args = repo ? [repo, limit] : [limit];
  return db.prepare(sql).all(...args);
}

/**
 * Get a single review with its findings.
 */
export function getReview(reviewId) {
  const review = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(reviewId);
  if (!review) return null;

  const findings = db.prepare(`
    SELECT * FROM findings WHERE review_id = ?
    ORDER BY
      CASE severity
        WHEN 'high' THEN 0
        WHEN 'medium' THEN 1
        WHEN 'low' THEN 2
        ELSE 3
      END,
      file,
      line
  `).all(reviewId);

  return { ...review, findings };
}

/**
 * Find an existing review for the same repo + PR + head SHA (for dedupe).
 */
export function findExistingReview(repo, prNumber, headSha) {
  return db.prepare(`
    SELECT * FROM reviews
    WHERE repo = ? AND pr_number = ? AND head_sha = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(repo, prNumber, headSha);
}