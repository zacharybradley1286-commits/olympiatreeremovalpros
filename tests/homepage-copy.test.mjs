import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const siteRoot = new URL('..', import.meta.url);
const readPage = (name) => readFileSync(new URL(name, siteRoot), 'utf8');

test('homepage clearly separates urgent calls from standard quote requests', () => {
  const page = readPage('index.html');

  assert.match(page, /Immediate tree hazard\?/);
  assert.match(page, /Plan a removal, trimming, or stump project\?/);
  assert.match(page, /What Affects Tree Removal Cost\?/);
  assert.match(page, /When should I call about a tree hazard\?/);
});

test('pre-tenant messaging does not present the referral site as a contractor', () => {
  const home = readPage('index.html');
  const thankYou = readPage('thank-you.html');
  const contact = readPage('contact.html');

  assert.match(home, /connects property owners with independently operated tree-service providers/i);
  assert.doesNotMatch(home, /Fully Insured Crews/);
  assert.doesNotMatch(home, /24\/7 priority emergency dispatch/);
  assert.doesNotMatch(home, /we will pass your request/i);
  assert.match(contact, /If a provider accepts your request/i);
  assert.doesNotMatch(thankYou, /within 15[–-]30 minutes/);
  assert.doesNotMatch(thankYou, /Project desk hours/);
});
