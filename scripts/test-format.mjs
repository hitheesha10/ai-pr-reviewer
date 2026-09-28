import { DiffParser } from '../src/review/DiffParser.js';
import { CommentFormatter } from '../src/review/CommentFormatter.js';

const parser = new DiffParser();
const formatter = new CommentFormatter();

const rawDiff = `+++ b/hello.js
@@ -0,0 +1,4 @@
+function add(a, b) {
+  return a + b;
+}
+console.log(add(2, 3));`;

const parsed = parser.parse(rawDiff);
const validLines = parser.validLineKeys(parsed);

console.log('Valid lines:', [...validLines]);

const findings = [
  {
    type: 'test',
    severity: 'medium',
    file: 'hello.js',
    line: 1,
    message: 'New function `add` introduced without unit tests.',
    suggestion: 'Add hello.test.js with unit tests.',
  },
  {
    type: 'style',
    severity: 'low',
    file: 'hello.js',
    line: 4,
    message: 'console.log left in production code.',
    suggestion: 'Remove or replace with a logger.',
  },
  {
    type: 'style',
    severity: 'low',
    file: 'hello.js',
    line: 999, // intentionally invalid
    message: 'This line does not exist in the diff.',
    suggestion: 'Should be dropped from inline.',
  },
];

console.log('\n=== Summary body ===');
console.log(formatter.formatSummary(findings, { owner: 'x', repo: 'y', prNumber: 1 }));

console.log('\n=== Inline comment (first finding) ===');
console.log(formatter.formatInlineComment(findings[0]));

const inlineable = findings.filter((f) => validLines.has(`${f.file}:${f.line}`));
console.log('\nInlineable count:', inlineable.length, '/', findings.length, '(should be 2 / 3)');