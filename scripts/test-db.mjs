import { createReview, markReviewing, completeReview, listReviews, getReview } from '../src/db/reviews.js';

const id = createReview({
  repo: 'hitheesha10/test',
  prNumber: 42,
  prTitle: 'Test PR',
  prAuthor: 'hitheesha10',
  headSha: 'abc123',
});

console.log('Created review ID:', id);

markReviewing(id);

completeReview(id, [
  { type: 'bug', severity: 'high', file: 'a.js', line: 10, message: 'Bug here', suggestion: 'Fix it' },
  { type: 'style', severity: 'low', file: 'a.js', line: 12, message: 'Style issue', suggestion: 'Fix it' },
], 999);

console.log('\n=== List ===');
console.log(listReviews({ limit: 5 }));

console.log('\n=== Detail ===');
console.log(JSON.stringify(getReview(id), null, 2));