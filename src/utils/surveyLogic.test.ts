import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARDING_PASS_STATIONS,
  INITIAL_SURVEY_DRAFT,
  StoredSurveyResponse,
  SurveyDraft,
} from '../types/survey';
import {
  buildCsvContent,
  buildFirestorePayload,
  computeDashboardStats,
  getVisibleSteps,
  validateStep,
} from './surveyLogic';

function makeCompleteDraft(overrides: Partial<SurveyDraft> = {}): SurveyDraft {
  return {
    ...INITIAL_SURVEY_DRAFT,
    hasTasted: 'Sudah pernah',
    activity: 'Karyawan',
    hasOrdered: 'Ya, pernah memesan',
    ratingCassava: 5,
    ratingChicken: 5,
    ratingPumpkinSauce: 4,
    ratingVegetables: 4,
    ratingAroma: 5,
    ratingTexture: 5,
    ratingVisual: 5,
    ratingFlavorCombo: 5,
    ratingPortion: 4,
    ratingIngredientCombo: 5,
    satietyLevel: 'Cukup mengenyangkan',
    ratingPackPracticality: 5,
    ratingPackStrength: 4,
    ratingLeakResistance: 5,
    ratingEaseOfOpening: 4,
    ratingEatingConvenience: 5,
    priceReasonable: 'Wajar',
    purchaseLikelihood: 4,
    purchaseFrequency: 'Sekali seminggu',
    repurchaseIntention: 'Kemungkinan besar akan membeli lagi',
    preOrderEase: 5,
    preOrderResponsiveness: 5,
    preOrderAccuracy: 5,
    preOrderPunctuality: 4,
    overallSatisfaction: 5,
    recommendScore: 9,
    favoriteComponents: ['Mashed Cassava', 'Pumpkin Puree Sauce'],
    feedbackNotes: 'Saus labu sangat lembut dan porsinya pas.',
    ...overrides,
  };
}

test('getVisibleSteps includes preorder step only when respondent has ordered and maps every step to a Boarding Pass station', () => {
  const orderedSteps = getVisibleSteps(makeCompleteDraft({ hasOrdered: 'Ya, pernah memesan' }));
  assert.equal(orderedSteps.some((s) => s.id === 'preorder'), true);
  assert.equal(orderedSteps.length, 7);

  for (const step of orderedSteps) {
    const station = BOARDING_PASS_STATIONS[step.id];
    assert.ok(station?.stationCode.startsWith('ST-'), `Missing stationCode for ${step.id}`);
    assert.ok(station?.stopName.length > 0, `Missing stopName for ${step.id}`);
  }

  const tasterOnlySteps = getVisibleSteps(makeCompleteDraft({ hasOrdered: 'Tidak, hanya mencicipi' }));
  assert.equal(tasterOnlySteps.some((s) => s.id === 'preorder'), false);
  assert.equal(tasterOnlySteps.length, 6);
});

test('validateStep enforces required fields in Bahasa Indonesia', () => {
  const emptyCheck = validateStep('respondent', INITIAL_SURVEY_DRAFT);
  assert.equal(emptyCheck.valid, false);
  assert.ok(emptyCheck.missingFields.includes('hasTasted'));
  assert.ok(emptyCheck.missingFields.includes('activity'));

  const productMissing = validateStep(
    'product',
    makeCompleteDraft({ ratingPumpkinSauce: null })
  );
  assert.equal(productMissing.valid, false);
  assert.ok(productMissing.errors[0].includes('Rasa Pumpkin Puree Sauce'));

  const validOverall = validateStep('overall', makeCompleteDraft({ feedbackNotes: '' }));
  assert.equal(validOverall.valid, true);
});

test('buildFirestorePayload strips preOrder fields when respondent did not pre-order', () => {
  const draft = makeCompleteDraft({
    hasOrdered: 'Tidak, hanya mencicipi',
    preOrderEase: 5,
    feedbackNotes: '   ',
  });
  const payload = buildFirestorePayload(draft);
  assert.equal('preOrderEase' in payload, false);
  assert.equal('preOrderResponsiveness' in payload, false);
  assert.equal('feedbackNotes' in payload, false);
  assert.equal(payload.source, 'web_survey');
});

test('computeDashboardStats returns zeroed empty state when no genuine responses exist', () => {
  const emptyStats = computeDashboardStats([]);
  assert.equal(emptyStats.totalResponses, 0);
  assert.equal(emptyStats.avgOverallSatisfaction, null);
  assert.equal(emptyStats.attributeAverages.length, 0);
  assert.equal(emptyStats.categoryAverages.length, 0);
  assert.equal(emptyStats.overallSatisfactionDistribution.length, 0);
});

test('computeDashboardStats calculates accurate averages and NPS from genuine submissions', () => {
  const r1: StoredSurveyResponse = {
    id: 'resp-1',
    createdAtMs: 1700000000000,
    source: 'web_survey',
    hasTasted: 'Sudah pernah',
    activity: 'Karyawan',
    hasOrdered: 'Ya, pernah memesan',
    ratingCassava: 5,
    ratingChicken: 4,
    ratingPumpkinSauce: 5,
    ratingVegetables: 4,
    ratingAroma: 5,
    ratingTexture: 5,
    ratingVisual: 5,
    ratingFlavorCombo: 5,
    ratingPortion: 4,
    ratingIngredientCombo: 5,
    satietyLevel: 'Cukup mengenyangkan',
    ratingPackPracticality: 5,
    ratingPackStrength: 5,
    ratingLeakResistance: 5,
    ratingEaseOfOpening: 4,
    ratingEatingConvenience: 5,
    priceReasonable: 'Sangat wajar',
    purchaseLikelihood: 5,
    purchaseFrequency: 'Sekali seminggu',
    repurchaseIntention: 'Pasti akan membeli lagi',
    preOrderEase: 5,
    preOrderResponsiveness: 5,
    preOrderAccuracy: 5,
    preOrderPunctuality: 5,
    overallSatisfaction: 5,
    recommendScore: 10,
    favoriteComponents: ['Mashed Cassava'],
  };
  const r2: StoredSurveyResponse = {
    ...r1,
    id: 'resp-2',
    hasOrdered: 'Tidak, hanya mencicipi',
    ratingCassava: 3,
    priceReasonable: 'Kurang wajar',
    repurchaseIntention: 'Ragu-ragu',
    overallSatisfaction: 3,
    recommendScore: 6,
    preOrderEase: undefined,
    preOrderResponsiveness: undefined,
    preOrderAccuracy: undefined,
    preOrderPunctuality: undefined,
  };

  const stats = computeDashboardStats([r1, r2]);
  assert.equal(stats.totalResponses, 2);
  assert.equal(stats.preOrderCount, 1);
  assert.equal(stats.avgOverallSatisfaction, 4);
  assert.equal(stats.avgRecommendScore, 8);
  assert.equal(stats.npsNetScore, 0); // 1 promoter (50%) - 1 detractor (50%) = 0
  assert.equal(stats.priceAcceptancePct, 50);
  assert.equal(stats.positiveRepurchasePct, 50);

  const serviceCat = stats.categoryAverages.find((c) => c.key === 'layanan');
  assert.equal(serviceCat?.average, 5);
  assert.equal(serviceCat?.count, 1);

  const score5 = stats.overallSatisfactionDistribution.find((d) => d.label === 'Skor 5');
  assert.equal(score5?.count, 1);
  assert.equal(score5?.percentage, 50);

  const cassavaAvg = stats.attributeAverages.find((a) => a.key === 'ratingCassava');
  assert.equal(cassavaAvg?.average, 4);
  assert.equal(cassavaAvg?.count, 2);

  const preOrderAvg = stats.attributeAverages.find((a) => a.key === 'preOrderEase');
  assert.equal(preOrderAvg?.average, 5);
  assert.equal(preOrderAvg?.count, 1);
});

test('buildCsvContent properly escapes commas, quotes, and newlines', () => {
  const sample: StoredSurveyResponse = {
    id: 'csv-1',
    createdAtMs: Date.UTC(2026, 10, 18, 12, 0, 0),
    source: 'web_survey',
    hasTasted: 'Sudah pernah',
    activity: 'Mahasiswa',
    hasOrdered: 'Tidak, hanya mencicipi',
    ratingCassava: 5,
    ratingChicken: 5,
    ratingPumpkinSauce: 5,
    ratingVegetables: 5,
    ratingAroma: 5,
    ratingTexture: 5,
    ratingVisual: 5,
    ratingFlavorCombo: 5,
    ratingPortion: 5,
    ratingIngredientCombo: 5,
    satietyLevel: 'Sangat mengenyangkan',
    ratingPackPracticality: 5,
    ratingPackStrength: 5,
    ratingLeakResistance: 5,
    ratingEaseOfOpening: 5,
    ratingEatingConvenience: 5,
    priceReasonable: 'Wajar',
    purchaseLikelihood: 5,
    purchaseFrequency: 'Sekali seminggu',
    repurchaseIntention: 'Pasti akan membeli lagi',
    overallSatisfaction: 5,
    recommendScore: 10,
    favoriteComponents: ['Semua komponen'],
    feedbackNotes: 'Enak, gurih, "mantap"',
  };
  const csv = buildCsvContent([sample]);
  assert.ok(csv.startsWith('\uFEFFID Respons,'));
  assert.ok(csv.includes('"Enak, gurih, ""mantap"""'));
});
