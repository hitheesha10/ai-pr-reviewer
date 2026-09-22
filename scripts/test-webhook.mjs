import 'dotenv/config';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function sign(body) {
  return 'sha256=' + crypto.createHmac('sha256', SECRET).update(Buffer.from(body)).digest('hex');
}

async function post(path, body, headers = {}) {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers,
    body,
  });
  return { status: res.status, text: await res.text() };
}

function pass(msg) { console.log('  ✅ PASS —', msg); }
function fail(msg) { console.log('  ❌ FAIL —', msg); }
function expect(cond, passMsg, failMsg) {
  cond ? pass(passMsg) : fail(failMsg);
}

// ────────────────────────────────────────────────────────────
// Test 1 — Health check
// ────────────────────────────────────────────────────────────
async function test1() {
  console.log('\n[Test 1] Health check');
  const res = await fetch(BASE_URL + '/health');
  const body = await res.json();
  expect(res.status === 200 && body.ok === true,
    `GET /health → 200 ${JSON.stringify(body)}`,
    `expected 200 {"ok":true}, got ${res.status} ${JSON.stringify(body)}`);
}

// ────────────────────────────────────────────────────────────
// Test 2 — Missing signature → 401
// ────────────────────────────────────────────────────────────
async function test2() {
  console.log('\n[Test 2] Missing signature rejected');
  const res = await post('/webhook', '{}', {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'pull_request',
  });
  expect(res.status === 401 && res.text.includes('Invalid signature'),
    `POST /webhook (no sig) → 401 Invalid signature`,
    `expected 401, got ${res.status} — ${res.text.slice(0, 100)}`);
}

// ────────────────────────────────────────────────────────────
// Test 3 — Wrong signature → 401
// ────────────────────────────────────────────────────────────
async function test3() {
  console.log('\n[Test 3] Wrong signature rejected');
  const res = await post('/webhook', '{}', {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'pull_request',
    'X-Hub-Signature-256': 'sha256=' + 'deadbeef'.repeat(8),
  });
  expect(res.status === 401 && res.text.includes('Invalid signature'),
    `POST /webhook (bad sig) → 401 Invalid signature`,
    `expected 401, got ${res.status} — ${res.text.slice(0, 100)}`);
}

// ────────────────────────────────────────────────────────────
// Test 4 — Valid PR open event → 202
// ────────────────────────────────────────────────────────────
async function test4() {
  console.log('\n[Test 4] Valid pull_request/opened accepted');
  const body = JSON.stringify({
    action: 'opened',
    pull_request: {
      number: 1,
      title: 'Test PR',
      user: { login: 'hitheesha' },
      head: { sha: 'abc123' },
    },
    repository: { full_name: 'hitheesha/test-repo' },
  });
  const res = await post('/webhook', body, {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'pull_request',
    'X-GitHub-Delivery': 'test-delivery-001',
    'X-Hub-Signature-256': sign(body),
  });
  expect(res.status === 202 && res.text === 'Accepted',
    `POST /webhook (valid) → 202 Accepted`,
    `expected 202 Accepted, got ${res.status} — ${res.text.slice(0, 100)}`);
}

// ────────────────────────────────────────────────────────────
// Test 5 — Non-PR event (push) ignored but accepted
// ────────────────────────────────────────────────────────────
async function test5() {
  console.log('\n[Test 5] Non-PR event (push) acknowledged but ignored');
  const body = JSON.stringify({ action: 'created', ref: 'main' });
  const res = await post('/webhook', body, {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'push',
    'X-GitHub-Delivery': 'test-delivery-002',
    'X-Hub-Signature-256': sign(body),
  });
  expect(res.status === 202,
    `POST /webhook (push) → 202 Accepted (handler ignores it)`,
    `expected 202, got ${res.status} — ${res.text.slice(0, 100)}`);
}

// ────────────────────────────────────────────────────────────
// Test 6 — Irrelevant PR action (closed) ignored
// ────────────────────────────────────────────────────────────
async function test6() {
  console.log('\n[Test 6] PR action "closed" acknowledged but ignored');
  const body = JSON.stringify({
    action: 'closed',
    pull_request: {
      number: 1,
      title: 'Test PR',
      user: { login: 'hitheesha' },
      head: { sha: 'abc123' },
    },
    repository: { full_name: 'hitheesha/test-repo' },
  });
  const res = await post('/webhook', body, {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'pull_request',
    'X-GitHub-Delivery': 'test-delivery-003',
    'X-Hub-Signature-256': sign(body),
  });
  expect(res.status === 202,
    `POST /webhook (closed) → 202 Accepted (handler ignores it)`,
    `expected 202, got ${res.status} — ${res.text.slice(0, 100)}`);
}

// ────────────────────────────────────────────────────────────
// Run all tests
// ────────────────────────────────────────────────────────────
(async () => {
  console.log('Running Phase 1 webhook tests against', BASE_URL);
  console.log('Secret length:', SECRET?.length, '(expected 64)');

  try {
    await test1();
    await test2();
    await test3();
    await test4();
    await test5();
    await test6();
  } catch (err) {
    console.error('\n💥 Test runner crashed:', err.message);
    console.error('   Is the server running? (`npm run dev`)');
    process.exit(1);
  }

  console.log('\nDone. Check server logs (Terminal A) for event handling lines.');
  console.log('Note: Tests 2–6 only verify HTTP responses.');
  console.log('Tests 5 & 6 also require server logs to confirm "ignoring..." messages.\n');
})();