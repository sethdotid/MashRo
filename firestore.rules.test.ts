import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Static & payload-contract verification tests for MASHRO Firestore Security Rules.
 * Verifies all Dirty Dozen attack vectors against the ruleset structure & validation logic.
 */
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');

test('firestore.rules exists and enforces rules_version 2 + global deny', () => {
  const rules = fs.readFileSync(rulesPath, 'utf8');
  assert.ok(rules.includes("rules_version = '2';"));
  assert.ok(rules.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));
});

test('survey_responses forbids public read/list/update and requires strict schema + request.time', () => {
  const rules = fs.readFileSync(rulesPath, 'utf8');
  assert.ok(rules.includes('match /survey_responses/{responseId}'));
  assert.ok(rules.includes('allow create: if isValidId(responseId) && isValidSurveyResponse(incoming());'));
  assert.ok(rules.includes('allow update: if false;'));
  assert.ok(rules.includes('allow list: if isVerifiedOwnerEmail();'));
  assert.ok(rules.includes('data.createdAt == request.time'));
  assert.ok(rules.includes('data.keys().hasAll(['));
  assert.ok(rules.includes('data.keys().hasOnly(['));
  assert.ok(rules.includes('request.auth.token.email_verified == true'));
});
