export type HasTastedOption = 'Sudah pernah' | 'Belum pernah';
export type ActivityOption = 'Karyawan' | 'Mahasiswa' | 'Dosen/Staf' | 'Lainnya';
export type HasOrderedOption = 'Ya, pernah memesan' | 'Tidak, hanya mencicipi';
export type SatietyOption = 'Tidak mengenyangkan' | 'Cukup mengenyangkan' | 'Sangat mengenyangkan';
export type PriceReasonableOption = 'Sangat wajar' | 'Wajar' | 'Kurang wajar' | 'Tidak wajar';
export type PurchaseFrequencyOption =
  | 'Beberapa kali seminggu'
  | 'Sekali seminggu'
  | '2–3 kali sebulan'
  | 'Sekali sebulan atau lebih jarang'
  | 'Belum berminat';
export type RepurchaseIntentionOption =
  | 'Pasti akan membeli lagi'
  | 'Kemungkinan besar akan membeli lagi'
  | 'Ragu-ragu'
  | 'Kemungkinan tidak membeli lagi';

export type FavoriteComponentOption =
  | 'Mashed Cassava'
  | 'Pan-Seared Chicken'
  | 'Pumpkin Puree Sauce'
  | 'Steamed Green Beans & Carrots'
  | 'Semua komponen';

export interface SurveyDraft {
  hasTasted: HasTastedOption | null;
  activity: ActivityOption | null;
  activityOther: string;
  hasOrdered: HasOrderedOption | null;

  // Section 3: Pengalaman Produk (1-5)
  ratingCassava: number | null;
  ratingChicken: number | null;
  ratingPumpkinSauce: number | null;
  ratingVegetables: number | null;
  ratingAroma: number | null;
  ratingTexture: number | null;
  ratingVisual: number | null;
  ratingFlavorCombo: number | null;

  // Section 4: Evaluasi Produk dan Kemasan
  ratingPortion: number | null;
  ratingIngredientCombo: number | null;
  satietyLevel: SatietyOption | null;
  ratingPackPracticality: number | null;
  ratingPackStrength: number | null;
  ratingLeakResistance: number | null;
  ratingEaseOfOpening: number | null;
  ratingEatingConvenience: number | null;

  // Section 5: Harga dan Minat Pembelian
  priceReasonable: PriceReasonableOption | null;
  purchaseLikelihood: number | null;
  purchaseFrequency: PurchaseFrequencyOption | null;
  repurchaseIntention: RepurchaseIntentionOption | null;

  // Section 6: Evaluasi Layanan Pre-Order (Conditional)
  preOrderEase: number | null;
  preOrderResponsiveness: number | null;
  preOrderAccuracy: number | null;
  preOrderPunctuality: number | null;

  // Section 7: Kepuasan Keseluruhan
  overallSatisfaction: number | null;
  recommendScore: number | null;
  favoriteComponents: FavoriteComponentOption[];
  feedbackNotes: string;
}

export interface StoredSurveyResponse {
  id: string;
  createdAtMs: number;
  source: 'web_survey';
  hasTasted: 'Sudah pernah';
  activity: ActivityOption;
  activityOther?: string;
  hasOrdered: HasOrderedOption;
  ratingCassava: number;
  ratingChicken: number;
  ratingPumpkinSauce: number;
  ratingVegetables: number;
  ratingAroma: number;
  ratingTexture: number;
  ratingVisual: number;
  ratingFlavorCombo: number;
  ratingPortion: number;
  ratingIngredientCombo: number;
  satietyLevel: SatietyOption;
  ratingPackPracticality: number;
  ratingPackStrength: number;
  ratingLeakResistance: number;
  ratingEaseOfOpening: number;
  ratingEatingConvenience: number;
  priceReasonable: PriceReasonableOption;
  purchaseLikelihood: number;
  purchaseFrequency: PurchaseFrequencyOption;
  repurchaseIntention: RepurchaseIntentionOption;
  preOrderEase?: number;
  preOrderResponsiveness?: number;
  preOrderAccuracy?: number;
  preOrderPunctuality?: number;
  overallSatisfaction: number;
  recommendScore: number;
  favoriteComponents: FavoriteComponentOption[];
  feedbackNotes?: string;
}

export type SurveyStepId =
  | 'respondent'
  | 'product'
  | 'packaging'
  | 'pricing'
  | 'preorder'
  | 'overall'
  | 'review';

export interface SurveyStepMeta {
  id: SurveyStepId;
  numberLabel: string;
  title: string;
  shortTitle: string;
  subtitle: string;
}

export const INITIAL_SURVEY_DRAFT: SurveyDraft = {
  hasTasted: null,
  activity: null,
  activityOther: '',
  hasOrdered: null,
  ratingCassava: null,
  ratingChicken: null,
  ratingPumpkinSauce: null,
  ratingVegetables: null,
  ratingAroma: null,
  ratingTexture: null,
  ratingVisual: null,
  ratingFlavorCombo: null,
  ratingPortion: null,
  ratingIngredientCombo: null,
  satietyLevel: null,
  ratingPackPracticality: null,
  ratingPackStrength: null,
  ratingLeakResistance: null,
  ratingEaseOfOpening: null,
  ratingEatingConvenience: null,
  priceReasonable: null,
  purchaseLikelihood: null,
  purchaseFrequency: null,
  repurchaseIntention: null,
  preOrderEase: null,
  preOrderResponsiveness: null,
  preOrderAccuracy: null,
  preOrderPunctuality: null,
  overallSatisfaction: null,
  recommendScore: null,
  favoriteComponents: [],
  feedbackNotes: '',
};

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  'Karyawan',
  'Mahasiswa',
  'Dosen/Staf',
  'Lainnya',
];

export const SATIETY_OPTIONS: SatietyOption[] = [
  'Tidak mengenyangkan',
  'Cukup mengenyangkan',
  'Sangat mengenyangkan',
];

export const PRICE_REASONABLE_OPTIONS: PriceReasonableOption[] = [
  'Sangat wajar',
  'Wajar',
  'Kurang wajar',
  'Tidak wajar',
];

export const PURCHASE_FREQUENCY_OPTIONS: PurchaseFrequencyOption[] = [
  'Beberapa kali seminggu',
  'Sekali seminggu',
  '2–3 kali sebulan',
  'Sekali sebulan atau lebih jarang',
  'Belum berminat',
];

export const REPURCHASE_INTENTION_OPTIONS: RepurchaseIntentionOption[] = [
  'Pasti akan membeli lagi',
  'Kemungkinan besar akan membeli lagi',
  'Ragu-ragu',
  'Kemungkinan tidak membeli lagi',
];

export const FAVORITE_COMPONENT_OPTIONS: { value: FavoriteComponentOption; label: string; detail: string }[] = [
  {
    value: 'Mashed Cassava',
    label: 'Mashed Cassava',
    detail: 'Singkong tumbuk lembut bergizi',
  },
  {
    value: 'Pan-Seared Chicken',
    label: 'Pan-Seared Chicken',
    detail: 'Ayam panggang bumbu rempah',
  },
  {
    value: 'Pumpkin Puree Sauce',
    label: 'Pumpkin Puree Sauce',
    detail: 'Saus labu kuning lembut',
  },
  {
    value: 'Steamed Green Beans & Carrots',
    label: 'Steamed Green Beans & Carrots',
    detail: 'Buncis dan wortel kukus segar',
  },
  {
    value: 'Semua komponen',
    label: 'Semua komponen',
    detail: 'Perpaduan keseluruhan sajian dalam satu mangkuk',
  },
];

export const PRODUCT_EXPERIENCE_ITEMS: {
  key: keyof Pick<
    SurveyDraft,
    | 'ratingCassava'
    | 'ratingChicken'
    | 'ratingPumpkinSauce'
    | 'ratingVegetables'
    | 'ratingAroma'
    | 'ratingTexture'
    | 'ratingVisual'
    | 'ratingFlavorCombo'
  >;
  label: string;
  description: string;
}[] = [
  {
    key: 'ratingCassava',
    label: 'Rasa Mashed Cassava',
    description: 'Kelezatan, tingkat gurih, dan kelembutan singkong tumbuk.',
  },
  {
    key: 'ratingChicken',
    label: 'Rasa Pan-Seared Chicken',
    description: 'Cita rasa bumbu, kematangan, dan keempukan daging ayam.',
  },
  {
    key: 'ratingPumpkinSauce',
    label: 'Rasa Pumpkin Puree Sauce',
    description: 'Keseimbangan rasa manis-gurih dan kekayaan rasa saus labu kuning.',
  },
  {
    key: 'ratingVegetables',
    label: 'Rasa Sayuran (Buncis & Wortel Kukus)',
    description: 'Kesegaran serta rasa alami buncis dan wortel kukus.',
  },
  {
    key: 'ratingAroma',
    label: 'Aroma Sajian',
    description: 'Keharuman sajian secara keseluruhan saat pertama kali dibuka.',
  },
  {
    key: 'ratingTexture',
    label: 'Tekstur Makanan',
    description: 'Perpaduan tekstur lembut mashed cassava, juicy ayam, dan renyah sayuran.',
  },
  {
    key: 'ratingVisual',
    label: 'Tampilan Visual Sajian',
    description: 'Penataan warna dan daya tarik visual makanan dalam mangkuk.',
  },
  {
    key: 'ratingFlavorCombo',
    label: 'Perpaduan Rasa Keseluruhan',
    description: 'Harmoni seluruh komponen saat disantap bersama.',
  },
];

export const PACKAGING_RATING_ITEMS: {
  key: keyof Pick<
    SurveyDraft,
    | 'ratingPortion'
    | 'ratingIngredientCombo'
    | 'ratingPackPracticality'
    | 'ratingPackStrength'
    | 'ratingLeakResistance'
    | 'ratingEaseOfOpening'
    | 'ratingEatingConvenience'
  >;
  label: string;
  description: string;
  group: 'product' | 'packaging';
}[] = [
  {
    key: 'ratingPortion',
    label: 'Ukuran Porsi Sajian',
    description: 'Kesesuaian porsi satu mangkuk untuk kebutuhan makan Anda.',
    group: 'product',
  },
  {
    key: 'ratingIngredientCombo',
    label: 'Komposisi Bahan dalam Mangkuk',
    description: 'Proporsi antara karbohidrat, protein, saus, dan sayuran.',
    group: 'product',
  },
  {
    key: 'ratingPackPracticality',
    label: 'Kepraktisan Kemasan',
    description: 'Kemudahan dibawa maupun disimpan sebelum disantap.',
    group: 'packaging',
  },
  {
    key: 'ratingPackStrength',
    label: 'Kekuatan & Ketahanan Kemasan',
    description: 'Kekokohan wadah saat digenggam dan membawa makanan hangat.',
    group: 'packaging',
  },
  {
    key: 'ratingLeakResistance',
    label: 'Ketahanan Terhadap Kebocoran',
    description: 'Keamanan penutup dan wadah agar saus tidak tumpah.',
    group: 'packaging',
  },
  {
    key: 'ratingEaseOfOpening',
    label: 'Kemudahan Membuka Kemasan',
    description: 'Kemudahan melepas tutup atau segel tanpa tumpah.',
    group: 'packaging',
  },
  {
    key: 'ratingEatingConvenience',
    label: 'Kenyamanan Saat Menyantap',
    description: 'Kenyamanan makan langsung dari mangkuk kemasan MASHRO.',
    group: 'packaging',
  },
];

export const PREORDER_ITEMS: {
  key: keyof Pick<
    SurveyDraft,
    | 'preOrderEase'
    | 'preOrderResponsiveness'
    | 'preOrderAccuracy'
    | 'preOrderPunctuality'
  >;
  label: string;
  description: string;
}[] = [
  {
    key: 'preOrderEase',
    label: 'Kemudahan Proses Pemesanan',
    description: 'Kejelasan alur pemesanan dan kemudahan mengisi detail pesanan.',
  },
  {
    key: 'preOrderResponsiveness',
    label: 'Kecepatan Respons Penjual',
    description: 'Kecepatan dan keramahan tim MASHRO dalam merespons pesan.',
  },
  {
    key: 'preOrderAccuracy',
    label: 'Ketepatan & Kesesuaian Pesanan',
    description: 'Kelengkapan serta kesesuaian item yang diterima dengan pesanan.',
  },
  {
    key: 'preOrderPunctuality',
    label: 'Ketepatan Waktu Pengambilan / Pengantaran',
    description: 'Kesesuaian jadwal pengambilan atau pengiriman dengan waktu yang dijanjikan.',
  },
];

export const STEP_DEFINITIONS: Record<SurveyStepId, Omit<SurveyStepMeta, 'numberLabel'>> = {
  respondent: {
    id: 'respondent',
    title: 'Tentang Responden',
    shortTitle: 'Profil',
    subtitle: 'Informasi singkat mengenai pengalaman awal dan aktivitas Anda.',
  },
  product: {
    id: 'product',
    title: 'Pengalaman Produk',
    shortTitle: 'Rasa & Visual',
    subtitle: 'Nilai cita rasa setiap komponen, aroma, tekstur, dan tampilan sajian MASHRO.',
  },
  packaging: {
    id: 'packaging',
    title: 'Evaluasi Produk & Kemasan',
    shortTitle: 'Porsi & Kemasan',
    subtitle: 'Bantu kami menilai porsi, rasa kenyang, serta fungsionalitas kemasan.',
  },
  pricing: {
    id: 'pricing',
    title: 'Harga & Minat Pembelian',
    shortTitle: 'Harga & Minat',
    subtitle: 'Evaluasi kisaran harga usulan Rp20.000–Rp25.000 dan minat pembelian Anda.',
  },
  preorder: {
    id: 'preorder',
    title: 'Evaluasi Layanan Pre-Order',
    shortTitle: 'Pre-Order',
    subtitle: 'Penilaian terhadap proses pemesanan dan pengiriman MASHRO.',
  },
  overall: {
    id: 'overall',
    title: 'Kepuasan Keseluruhan',
    shortTitle: 'Kepuasan Akhir',
    subtitle: 'Kesan akhir, rekomendasi, komponen favorit, dan saran Anda untuk MASHRO.',
  },
  review: {
    id: 'review',
    title: 'Tinjauan & Kirim Survei',
    shortTitle: 'Tinjauan',
    subtitle: 'Periksa kembali jawaban Anda sebelum mengirim masukan.',
  },
};

export interface BoardingStationMeta {
  stationCode: string;
  stopName: string;
  gateTag: string;
}

export const BOARDING_PASS_STATIONS: Record<SurveyStepId, BoardingStationMeta> = {
  respondent: {
    stationCode: 'ST-01',
    stopName: 'Peron Awal',
    gateTag: 'Validasi Pengalaman',
  },
  product: {
    stationCode: 'ST-02',
    stopName: 'Paviliun Rasa',
    gateTag: 'Rasa · Aroma · Tekstur',
  },
  packaging: {
    stationCode: 'ST-03',
    stopName: 'Bengkel Kemasan',
    gateTag: 'Porsi & Ketahanan Wadah',
  },
  pricing: {
    stationCode: 'ST-04',
    stopName: 'Loket Nilai',
    gateTag: 'Harga & Minat Kembali',
  },
  preorder: {
    stationCode: 'ST-05',
    stopName: 'Jalur Pesan',
    gateTag: 'Layanan Pre-Order',
  },
  overall: {
    stationCode: 'ST-06',
    stopName: 'Observatorium Bintang',
    gateTag: 'Kepuasan & Rekomendasi',
  },
  review: {
    stationCode: 'ST-07',
    stopName: 'Gerbang Akhir',
    gateTag: 'Periksa & Kirim Tiket',
  },
};

