import 'dotenv/config';
import { fetchDiff } from '../src/github/fetchDiff.js';

// Replace with your actual owner/repo/pr
const owner = 'hitheesha10';
const repo = 'ai-reviewer-test';
const prNumber = 1;

const result = await fetchDiff({ owner, repo, prNumber });

console.log('Truncated:', result.truncated);
console.log('File count:', result.files.length);
console.log();

for (const f of result.files) {
  console.log(`${f.status.padEnd(9)} ${f.path}  +${f.additions} -${f.deletions}`);
  if (f.patch) {
    console.log('  ─── patch preview ───');
    console.log(f.patch.split('\n').slice(0, 8).map(l => '  ' + l).join('\n'));
    console.log('  ─── end preview ───');
  } else {
    console.log('  (no patch — binary or truncated)');
  }
  console.log();
}

if (result.rawDiff) {
  console.log('Raw diff mode active. First 500 chars:');
  console.log(result.rawDiff.slice(0, 500));
}