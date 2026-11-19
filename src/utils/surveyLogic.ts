import {
  FavoriteComponentOption,
  PACKAGING_RATING_ITEMS,
  PREORDER_ITEMS,
  PRICE_REASONABLE_OPTIONS,
  PRODUCT_EXPERIENCE_ITEMS,
  PURCHASE_FREQUENCY_OPTIONS,
  PriceReasonableOption,
  PurchaseFrequencyOption,
  REPURCHASE_INTENTION_OPTIONS,
  RepurchaseIntentionOption,
  SATIETY_OPTIONS,
  STEP_DEFINITIONS,
  SatietyOption,
  StoredSurveyResponse,
  SurveyDraft,
  SurveyStepId,
  SurveyStepMeta,
} from '../types/survey';

/**
 * Determines which survey steps are active based on conditional branching rules.
 */
export function getVisibleSteps(draft: SurveyDraft): SurveyStepMeta[] {
  const stepOrder: SurveyStepId[] = ['respondent', 'product', 'packaging', 'pricing'];
  if (draft.hasOrdered === 'Ya, pernah memesan') {
    stepOrder.push('preorder');
  }
  stepOrder.push('overall', 'review');

  return stepOrder.map((id, idx) => ({
    ...STEP_DEFINITIONS[id],
    numberLabel: String(idx + 1).padStart(2, '0'),
  }));
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  missingFields: string[];
}

function isValid1to5(val: number | null): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 5;
}

/**
 * Validates required fields for a given step, returning clear Bahasa Indonesia messages.
 */
export function validateStep(stepId: SurveyStepId, draft: SurveyDraft): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];

  if (stepId === 'respondent') {
    if (!draft.hasTasted) {
      missingFields.push('hasTasted');
      errors.push('Pilih apakah Anda sudah pernah mencicipi MASHRO.');
    }
    if (!draft.activity) {
      missingFields.push('activity');
      errors.push('Pilih aktivitas Anda saat ini.');
    }
    if (draft.hasTasted === 'Sudah pernah' && !draft.hasOrdered) {
      missingFields.push('hasOrdered');
      errors.push('Pilih apakah Anda pernah memesan MASHRO melalui Pre-Order.');
    }
  }

  if (stepId === 'product') {
    for (const item of PRODUCT_EXPERIENCE_ITEMS) {
      if (!isValid1to5(draft[item.key])) {
        missingFields.push(item.key);
        errors.push(`Berikan penilaian 1–5 untuk "${item.label}".`);
      }
    }
  }

  if (stepId === 'packaging') {
    for (const item of PACKAGING_RATING_ITEMS) {
      if (!isValid1to5(draft[item.key])) {
        missingFields.push(item.key);
        errors.push(`Berikan penilaian 1–5 untuk "${item.label}".`);
      }
    }
    if (!draft.satietyLevel) {
      missingFields.push('satietyLevel');
      errors.push('Pilih tingkat rasa kenyang setelah menyantap MASHRO.');
    }
  }

  if (stepId === 'pricing') {
    if (!draft.priceReasonable) {
      missingFields.push('priceReasonable');
      errors.push('Pilih pendapat Anda mengenai kewajaran kisaran harga Rp20.000–Rp25.000.');
    }
    if (!isValid1to5(draft.purchaseLikelihood)) {
      missingFields.push('purchaseLikelihood');
      errors.push('Berikan skala kemungkinan pembelian (1–5).');
    }
    if (!draft.purchaseFrequency) {
      missingFields.push('purchaseFrequency');
      errors.push('Pilih perkiraan frekuensi pembelian Anda.');
    }
    if (!draft.repurchaseIntention) {
      missingFields.push('repurchaseIntention');
      errors.push('Pilih minat Anda untuk membeli MASHRO kembali.');
    }
  }

  if (stepId === 'preorder' && draft.hasOrdered === 'Ya, pernah memesan') {
    for (const item of PREORDER_ITEMS) {
      if (!isValid1to5(draft[item.key])) {
        missingFields.push(item.key);
        errors.push(`Berikan penilaian 1–5 untuk "${item.label}".`);
      }
    }
  }

  if (stepId === 'overall') {
    if (!isValid1to5(draft.overallSatisfaction)) {
      missingFields.push('overallSatisfaction');
      errors.push('Berikan penilaian kepuasan keseluruhan (1–5).');
    }
    if (
      typeof draft.recommendScore !== 'number' ||
      !Number.isInteger(draft.recommendScore) ||
      draft.recommendScore < 0 ||
      draft.recommendScore > 10
    ) {
      missingFields.push('recommendScore');
      errors.push('Pilih skor rekomendasi (0–10).');
    }
    if (draft.favoriteComponents.length === 0) {
      missingFields.push('favoriteComponents');
      errors.push('Pilih minimal satu komponen produk favorit Anda.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  };
}

/**
 * Sanitizes and builds a strict Firestore-compliant payload matching firebase-blueprint.json.
 */
export function buildFirestorePayload(draft: SurveyDraft): Record<string, unknown> {
  if (draft.hasTasted !== 'Sudah pernah') {
    throw new Error('Hanya responden yang sudah pernah mencicipi MASHRO yang dapat mengirim survei.');
  }

  const visibleSteps = getVisibleSteps(draft);
  for (const step of visibleSteps) {
    if (step.id !== 'review') {
      const check = validateStep(step.id, draft);
      if (!check.valid) {
        throw new Error(check.errors[0] || 'Data survei belum lengkap.');
      }
    }
  }

  const trimmedOther = draft.activityOther.trim().slice(0, 100);
  const trimmedFeedback = draft.feedbackNotes.trim().slice(0, 1000);

  const payload: Record<string, unknown> = {
    source: 'web_survey',
    hasTasted: 'Sudah pernah',
    activity: draft.activity!,
    hasOrdered: draft.hasOrdered!,
    ratingCassava: draft.ratingCassava!,
    ratingChicken: draft.ratingChicken!,
    ratingPumpkinSauce: draft.ratingPumpkinSauce!,
    ratingVegetables: draft.ratingVegetables!,
    ratingAroma: draft.ratingAroma!,
    ratingTexture: draft.ratingTexture!,
    ratingVisual: draft.ratingVisual!,
    ratingFlavorCombo: draft.ratingFlavorCombo!,
    ratingPortion: draft.ratingPortion!,
    ratingIngredientCombo: draft.ratingIngredientCombo!,
    satietyLevel: draft.satietyLevel!,
    ratingPackPracticality: draft.ratingPackPracticality!,
    ratingPackStrength: draft.ratingPackStrength!,
    ratingLeakResistance: draft.ratingLeakResistance!,
    ratingEaseOfOpening: draft.ratingEaseOfOpening!,
    ratingEatingConvenience: draft.ratingEatingConvenience!,
    priceReasonable: draft.priceReasonable!,
    purchaseLikelihood: draft.purchaseLikelihood!,
    purchaseFrequency: draft.purchaseFrequency!,
    repurchaseIntention: draft.repurchaseIntention!,
    overallSatisfaction: draft.overallSatisfaction!,
    recommendScore: draft.recommendScore!,
    favoriteComponents: draft.favoriteComponents.slice(0, 5),
  };

  if (draft.activity === 'Lainnya' && trimmedOther.length > 0) {
    payload.activityOther = trimmedOther;
  }

  if (draft.hasOrdered === 'Ya, pernah memesan') {
    payload.preOrderEase = draft.preOrderEase!;
    payload.preOrderResponsiveness = draft.preOrderResponsiveness!;
    payload.preOrderAccuracy = draft.preOrderAccuracy!;
    payload.preOrderPunctuality = draft.preOrderPunctuality!;
  }

  if (trimmedFeedback.length > 0) {
    payload.feedbackNotes = trimmedFeedback;
  }

  return payload;
}

export interface AttributeAverage {
  key: string;
  label: string;
  category: 'Produk' | 'Kemasan & Porsi' | 'Layanan Pre-Order';
  average: number;
  count: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export interface CategoryScoreSummary {
  key: string;
  label: string;
  average: number;
  count: number;
}

export interface DashboardAnalytics {
  totalResponses: number;
  preOrderCount: number;
  avgOverallSatisfaction: number | null;
  avgRecommendScore: number | null;
  npsNetScore: number | null;
  priceAcceptancePct: number | null;
  avgPurchaseLikelihood: number | null;
  positiveRepurchasePct: number | null;
  categoryAverages: CategoryScoreSummary[];
  overallSatisfactionDistribution: DistributionItem[];
  attributeAverages: AttributeAverage[];
  priceDistribution: DistributionItem[];
  repurchaseDistribution: DistributionItem[];
  frequencyDistribution: DistributionItem[];
  satietyDistribution: DistributionItem[];
  favoriteDistribution: DistributionItem[];
  activityDistribution: DistributionItem[];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function avgOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return round1(sum / values.length);
}

function buildDistribution(counts: Map<string, number>, orderedKeys: string[], total: number): DistributionItem[] {
  return orderedKeys.map((key) => {
    const count = counts.get(key) ?? 0;
    return {
      label: key,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

/**
 * Computes pure analytics from genuine submitted survey responses.
 * Returns null/0 metrics when responses is empty—never fabricates statistics.
 */
export function computeDashboardStats(responses: StoredSurveyResponse[]): DashboardAnalytics {
  const total = responses.length;

  if (total === 0) {
    return {
      totalResponses: 0,
      preOrderCount: 0,
      avgOverallSatisfaction: null,
      avgRecommendScore: null,
      npsNetScore: null,
      priceAcceptancePct: null,
      avgPurchaseLikelihood: null,
      positiveRepurchasePct: null,
      categoryAverages: [],
      overallSatisfactionDistribution: [],
      attributeAverages: [],
      priceDistribution: [],
      repurchaseDistribution: [],
      frequencyDistribution: [],
      satietyDistribution: [],
      favoriteDistribution: [],
      activityDistribution: [],
    };
  }

  const preOrders = responses.filter((r) => r.hasOrdered === 'Ya, pernah memesan');

  const avgOverallSatisfaction = avgOf(responses.map((r) => r.overallSatisfaction));
  const avgRecommendScore = avgOf(responses.map((r) => r.recommendScore));
  const avgPurchaseLikelihood = avgOf(responses.map((r) => r.purchaseLikelihood));

  const promoters = responses.filter((r) => r.recommendScore >= 9).length;
  const detractors = responses.filter((r) => r.recommendScore <= 6).length;
  const npsNetScore = Math.round(((promoters - detractors) / total) * 100);

  const reasonableCount = responses.filter(
    (r) => r.priceReasonable === 'Sangat wajar' || r.priceReasonable === 'Wajar'
  ).length;
  const priceAcceptancePct = Math.round((reasonableCount / total) * 100);

  const positiveRepurchaseCount = responses.filter(
    (r) =>
      r.repurchaseIntention === 'Pasti akan membeli lagi' ||
      r.repurchaseIntention === 'Kemungkinan besar akan membeli lagi'
  ).length;
  const positiveRepurchasePct = Math.round((positiveRepurchaseCount / total) * 100);

  const attributeDefs: {
    key: keyof StoredSurveyResponse;
    label: string;
    category: AttributeAverage['category'];
    subset?: StoredSurveyResponse[];
  }[] = [
    { key: 'ratingCassava', label: 'Rasa Mashed Cassava', category: 'Produk' },
    { key: 'ratingChicken', label: 'Rasa Pan-Seared Chicken', category: 'Produk' },
    { key: 'ratingPumpkinSauce', label: 'Rasa Pumpkin Puree Sauce', category: 'Produk' },
    { key: 'ratingVegetables', label: 'Rasa Sayuran Kukus', category: 'Produk' },
    { key: 'ratingAroma', label: 'Aroma Sajian', category: 'Produk' },
    { key: 'ratingTexture', label: 'Tekstur Makanan', category: 'Produk' },
    { key: 'ratingVisual', label: 'Tampilan Visual', category: 'Produk' },
    { key: 'ratingFlavorCombo', label: 'Perpaduan Rasa Keseluruhan', category: 'Produk' },
    { key: 'ratingPortion', label: 'Ukuran Porsi', category: 'Kemasan & Porsi' },
    { key: 'ratingIngredientCombo', label: 'Komposisi Bahan', category: 'Kemasan & Porsi' },
    { key: 'ratingPackPracticality', label: 'Kepraktisan Kemasan', category: 'Kemasan & Porsi' },
    { key: 'ratingPackStrength', label: 'Kekuatan Kemasan', category: 'Kemasan & Porsi' },
    { key: 'ratingLeakResistance', label: 'Ketahanan Kebocoran', category: 'Kemasan & Porsi' },
    { key: 'ratingEaseOfOpening', label: 'Kemudahan Membuka', category: 'Kemasan & Porsi' },
    { key: 'ratingEatingConvenience', label: 'Kenyamanan Menyantap', category: 'Kemasan & Porsi' },
    { key: 'preOrderEase', label: 'Kemudahan Pemesanan', category: 'Layanan Pre-Order', subset: preOrders },
    { key: 'preOrderResponsiveness', label: 'Kecepatan Respons Penjual', category: 'Layanan Pre-Order', subset: preOrders },
    { key: 'preOrderAccuracy', label: 'Ketepatan Pesanan', category: 'Layanan Pre-Order', subset: preOrders },
    { key: 'preOrderPunctuality', label: 'Ketepatan Waktu', category: 'Layanan Pre-Order', subset: preOrders },
  ];

  const attributeAverages: AttributeAverage[] = [];
  for (const def of attributeDefs) {
    const sourceList = def.subset ?? responses;
    const nums = sourceList
      .map((item) => item[def.key])
      .filter((val): val is number => typeof val === 'number');
    if (nums.length > 0) {
      attributeAverages.push({
        key: String(def.key),
        label: def.label,
        category: def.category,
        average: avgOf(nums) ?? 0,
        count: nums.length,
      });
    }
  }

  const priceCounts = new Map<string, number>();
  const repurchaseCounts = new Map<string, number>();
  const frequencyCounts = new Map<string, number>();
  const satietyCounts = new Map<string, number>();
  const favoriteCounts = new Map<string, number>();
  const activityCounts = new Map<string, number>();

  for (const r of responses) {
    priceCounts.set(r.priceReasonable, (priceCounts.get(r.priceReasonable) ?? 0) + 1);
    repurchaseCounts.set(r.repurchaseIntention, (repurchaseCounts.get(r.repurchaseIntention) ?? 0) + 1);
    frequencyCounts.set(r.purchaseFrequency, (frequencyCounts.get(r.purchaseFrequency) ?? 0) + 1);
    satietyCounts.set(r.satietyLevel, (satietyCounts.get(r.satietyLevel) ?? 0) + 1);
    activityCounts.set(r.activity, (activityCounts.get(r.activity) ?? 0) + 1);
    for (const fav of r.favoriteComponents) {
      favoriteCounts.set(fav, (favoriteCounts.get(fav) ?? 0) + 1);
    }
  }

  const favoriteKeys: FavoriteComponentOption[] = [
    'Mashed Cassava',
    'Pan-Seared Chicken',
    'Pumpkin Puree Sauce',
    'Steamed Green Beans & Carrots',
    'Semua komponen',
  ];

  const productAttrs = attributeAverages.filter((a) => a.category === 'Produk');
  const packAttrs = attributeAverages.filter((a) => a.category === 'Kemasan & Porsi');
  const preOrderAttrs = attributeAverages.filter((a) => a.category === 'Layanan Pre-Order');

  const categoryAverages: CategoryScoreSummary[] = [];
  if (productAttrs.length > 0) {
    categoryAverages.push({
      key: 'produk',
      label: 'Kualitas Produk',
      average: avgOf(productAttrs.map((a) => a.average)) ?? 0,
      count: total,
    });
  }
  if (packAttrs.length > 0) {
    categoryAverages.push({
      key: 'kemasan',
      label: 'Porsi & Kemasan',
      average: avgOf(packAttrs.map((a) => a.average)) ?? 0,
      count: total,
    });
  }
  if (preOrderAttrs.length > 0) {
    categoryAverages.push({
      key: 'layanan',
      label: 'Layanan Pre-Order',
      average: avgOf(preOrderAttrs.map((a) => a.average)) ?? 0,
      count: preOrders.length,
    });
  }
  if (avgOverallSatisfaction !== null) {
    categoryAverages.push({
      key: 'keseluruhan',
      label: 'Kepuasan Total',
      average: avgOverallSatisfaction,
      count: total,
    });
  }

  const satisfactionCounts = new Map<string, number>();
  for (const r of responses) {
    const label = `Skor ${r.overallSatisfaction}`;
    satisfactionCounts.set(label, (satisfactionCounts.get(label) ?? 0) + 1);
  }
  const overallSatisfactionDistribution = buildDistribution(
    satisfactionCounts,
    ['Skor 5', 'Skor 4', 'Skor 3', 'Skor 2', 'Skor 1'],
    total
  );

  return {
    totalResponses: total,
    preOrderCount: preOrders.length,
    avgOverallSatisfaction,
    avgRecommendScore,
    npsNetScore,
    priceAcceptancePct,
    avgPurchaseLikelihood,
    positiveRepurchasePct,
    categoryAverages,
    overallSatisfactionDistribution,
    attributeAverages,
    priceDistribution: buildDistribution(priceCounts, PRICE_REASONABLE_OPTIONS as PriceReasonableOption[], total),
    repurchaseDistribution: buildDistribution(
      repurchaseCounts,
      REPURCHASE_INTENTION_OPTIONS as RepurchaseIntentionOption[],
      total
    ),
    frequencyDistribution: buildDistribution(
      frequencyCounts,
      PURCHASE_FREQUENCY_OPTIONS as PurchaseFrequencyOption[],
      total
    ),
    satietyDistribution: buildDistribution(satietyCounts, SATIETY_OPTIONS as SatietyOption[], total),
    favoriteDistribution: buildDistribution(favoriteCounts, favoriteKeys, total),
    activityDistribution: buildDistribution(
      activityCounts,
      ['Karyawan', 'Mahasiswa', 'Dosen/Staf', 'Lainnya'],
      total
    ),
  };
}

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates UTF-8 CSV content (with BOM) from genuine survey responses.
 */
export function buildCsvContent(responses: StoredSurveyResponse[]): string {
  const headers = [
    'ID Respons',
    'Waktu Kirim',
    'Aktivitas',
    'Aktivitas Lainnya',
    'Pernah Pre-Order',
    'Rasa Mashed Cassava',
    'Rasa Pan-Seared Chicken',
    'Rasa Pumpkin Puree Sauce',
    'Rasa Sayuran',
    'Aroma',
    'Tekstur',
    'Tampilan Visual',
    'Perpaduan Rasa',
    'Ukuran Porsi',
    'Komposisi Bahan',
    'Tingkat Kenyang',
    'Kepraktisan Kemasan',
    'Kekuatan Kemasan',
    'Ketahanan Bocor',
    'Kemudahan Buka',
    'Kenyamanan Makan',
    'Kewajaran Harga (20-25rb)',
    'Minat Beli (1-5)',
    'Frekuensi Pembelian',
    'Minat Beli Ulang',
    'Pre-Order: Kemudahan',
    'Pre-Order: Respons Penjual',
    'Pre-Order: Ketepatan Pesanan',
    'Pre-Order: Ketepatan Waktu',
    'Kepuasan Keseluruhan (1-5)',
    'Skor Rekomendasi (0-10)',
    'Komponen Favorit',
    'Saran & Masukan',
  ];

  const rows = responses.map((r) => [
    r.id,
    new Date(r.createdAtMs).toISOString(),
    r.activity,
    r.activityOther ?? '',
    r.hasOrdered,
    r.ratingCassava,
    r.ratingChicken,
    r.ratingPumpkinSauce,
    r.ratingVegetables,
    r.ratingAroma,
    r.ratingTexture,
    r.ratingVisual,
    r.ratingFlavorCombo,
    r.ratingPortion,
    r.ratingIngredientCombo,
    r.satietyLevel,
    r.ratingPackPracticality,
    r.ratingPackStrength,
    r.ratingLeakResistance,
    r.ratingEaseOfOpening,
    r.ratingEatingConvenience,
    r.priceReasonable,
    r.purchaseLikelihood,
    r.purchaseFrequency,
    r.repurchaseIntention,
    r.preOrderEase ?? '',
    r.preOrderResponsiveness ?? '',
    r.preOrderAccuracy ?? '',
    r.preOrderPunctuality ?? '',
    r.overallSatisfaction,
    r.recommendScore,
    r.favoriteComponents.join('; '),
    r.feedbackNotes ?? '',
  ]);

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];

  return '\uFEFF' + csvLines.join('\r\n');
}
