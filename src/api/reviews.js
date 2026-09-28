import express from 'express';
import { listReviews, getReview } from '../db/reviews.js';

const router = express.Router();

// GET /api/reviews?limit=50&repo=owner/repo
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const repo = req.query.repo || null;

  try {
    const reviews = listReviews({ limit, repo });
    res.json({ reviews, count: reviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  try {
    const review = getReview(id);
    if (!review) return res.status(404).json({ error: 'Not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;