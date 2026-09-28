import 'dotenv/config';
import { DiffParser } from '../src/review/DiffParser.js';
import { CommentFormatter } from '../src/review/CommentFormatter.js';
import { fetchDiff } from '../src/github/fetchDiff.js';
import { postReview } from '../src/github/postReview.js';

const owner = 'hitheesha10';
const repo = 'ai-reviewer-test';
const prNumber = 1;

const parser = new DiffParser();
const formatter = new CommentFormatter();

const diff = await fetchDiff({ owner, repo, prNumber });
const rawDiff = diff.rawDiff || diff.files
  .filter((f) => f.patch)
  .map((f) => `+++ b/${f.path}\n${f.patch}`)
  .join('\n');

const parsed = parser.parse(rawDiff);
const validLines = parser.validLineKeys(parsed);

console.log('Valid lines:', [...validLines]);

const firstAddedLine = parsed[0].changes.find((c) => c.type === 'add').lineNumber;

const findings = [
  {
    type: 'style',
    severity: 'low',
    file: parsed[0].file,
    line: firstAddedLine,
    message: 'Test finding — dry run.',
    suggestion: 'This comment proves postReview works.',
  },
];

await postReview({ owner, repo, prNumber, findings, validLines, formatter });

console.log('Done. Open the PR to verify:');
console.log(`https://github.com/${owner}/${repo}/pull/${prNumber}`);