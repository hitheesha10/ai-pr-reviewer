import 'dotenv/config';
import { DiffParser } from '../src/review/DiffParser.js';
import { ReviewEngine } from '../src/review/ReviewEngine.js';
import { BugRiskStrategy } from '../src/review/strategies/BugRiskStrategy.js';
import { StyleStrategy } from '../src/review/strategies/StyleStrategy.js';
import { TestCoverageStrategy } from '../src/review/strategies/TestCoverageStrategy.js';
import { fetchDiff } from '../src/github/fetchDiff.js';

const owner = 'hitheesha10';
const repo = 'ai-reviewer-test';
const prNumber = 1;

const diff = await fetchDiff({ owner, repo, prNumber });

const parser = new DiffParser();

const rawDiff = diff.rawDiff || diff.files
  .filter((f) => f.patch)
  .map((f) => `+++ b/${f.path}\n${f.patch}`)
  .join('\n');

const parsed = parser.parse(rawDiff);

console.log('Parsed files:', parsed.map((f) => f.file));

const diffText = parser.toAddedLinesText(parsed);
console.log('\n--- Diff text sent to LLM ---');
console.log(diffText);
console.log('--- End diff text ---\n');

const engine = new ReviewEngine([
  new BugRiskStrategy(),
  new StyleStrategy(),
  new TestCoverageStrategy(),
]);

const findings = await engine.run(diffText, { owner, repo, prNumber });

console.log('\n=== Findings ===');
for (const f of findings) {
  console.log(`[${f.severity.padEnd(6)}] ${f.type.padEnd(5)} ${f.file}:${f.line}`);
  console.log(`         ${f.message}`);
  console.log(`         → ${f.suggestion}`);
}