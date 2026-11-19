import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  Loader2,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import {
  ACTIVITY_OPTIONS,
  BOARDING_PASS_STATIONS,
  FAVORITE_COMPONENT_OPTIONS,
  INITIAL_SURVEY_DRAFT,
  PACKAGING_RATING_ITEMS,
  PREORDER_ITEMS,
  PRICE_REASONABLE_OPTIONS,
  PRODUCT_EXPERIENCE_ITEMS,
  PURCHASE_FREQUENCY_OPTIONS,
  REPURCHASE_INTENTION_OPTIONS,
  SATIETY_OPTIONS,
  SurveyDraft,
  SurveyStepId,
} from '../types/survey';
import { getVisibleSteps, validateStep } from '../utils/surveyLogic';
import { submitSurveyResponse } from '../services/surveyService';
import { BotanicalSprig, StarOrnament } from './BrandMotifs';
import {
  CheckboxOptionGroup,
  RadioOptionGroup,
  Scale1to5,
} from './RatingControls';
import { ConstellationIndicator } from './ConstellationIndicator';
import { VolumeMeter } from './VolumeMeter';

interface SurveyWizardProps {
  onReturnHome: () => void;
}

type WizardOutcome = 'active' | 'never_tasted' | 'thank_you';

export function SurveyWizard({ onReturnHome }: SurveyWizardProps) {
  const [draft, setDraft] = useState<SurveyDraft>(INITIAL_SURVEY_DRAFT);
  const [currentStepId, setCurrentStepId] = useState<SurveyStepId>('respondent');
  const [outcome, setOutcome] = useState<WizardOutcome>('active');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const visibleSteps = useMemo(() => getVisibleSteps(draft), [draft]);
  const currentStepIndex = Math.max(
    0,
    visibleSteps.findIndex((s) => s.id === currentStepId)
  );
  const currentStepMeta = visibleSteps[currentStepIndex] ?? visibleSteps[0];
  const progressPercent = Math.round(((currentStepIndex + 1) / visibleSteps.length) * 100);

  const updateField = <K extends keyof SurveyDraft>(key: K, value: SurveyDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (missingFields.includes(String(key))) {
      setMissingFields((prev) => prev.filter((f) => f !== String(key)));
    }
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleNext = () => {
    setSubmitError(null);

    if (currentStepId === 'respondent' && draft.hasTasted === 'Belum pernah') {
      if (!draft.activity) {
        setValidationErrors(['Pilih aktivitas Anda saat ini sebelum melanjutkan.']);
        setMissingFields(['activity']);
        return;
      }
      setValidationErrors([]);
      setMissingFields([]);
      setOutcome('never_tasted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const result = validateStep(currentStepId, draft);
    if (!result.valid) {
      setValidationErrors(result.errors);
      setMissingFields(result.missingFields);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setMissingFields([]);

    const nextStep = visibleSteps[currentStepIndex + 1];
    if (nextStep) {
      setCurrentStepId(nextStep.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setValidationErrors([]);
    setMissingFields([]);
    setSubmitError(null);

    if (currentStepIndex === 0) {
      onReturnHome();
      return;
    }

    const prevStep = visibleSteps[currentStepIndex - 1];
    if (prevStep) {
      setCurrentStepId(prevStep.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToStep = (stepId: SurveyStepId) => {
    setValidationErrors([]);
    setMissingFields([]);
    setSubmitError(null);
    setCurrentStepId(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const id = await submitSurveyResponse(draft);
      setSubmittedId(id);
      setOutcome('thank_you');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan jawaban ke database. Silakan coba beberapa saat lagi.';
      setSubmitError(
        msg.includes('permission') || msg.includes('PERMISSION_DENIED')
          ? 'Penyimpanan ditolak oleh aturan keamanan database. Pastikan semua kolom wajib telah terisi dengan benar.'
          : msg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (outcome === 'never_tasted') {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
          <div className="flex justify-center mb-5">
            <BotanicalSprig className="w-24 h-10 text-[#173E2C]/40" />
          </div>
          <p className="text-xs font-semibold tracking-wider text-[#D6A23A] mb-2">
            TERIMA KASIH ATAS KETERTARIKAN ANDA
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#173E2C] mb-4 text-balance">
            Survei Ini Khusus untuk Pelanggan yang Sudah Mencicipi MASHRO
          </h1>
          <p className="text-sm sm:text-base text-[#173E2C]/80 leading-relaxed mb-8">
            Karena pertanyaan berikutnya menilai rasa mashed cassava, pan-seared chicken, pumpkin
            puree sauce, sayuran kukus, serta kemasan sajian MASHRO secara langsung, Anda tidak
            perlu melanjutkan ke bagian penilaian produk. Kami menantikan kesempatan Anda mencoba
            MASHRO di waktu mendatang!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setOutcome('active');
                setCurrentStepId('respondent');
              }}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-full border border-[#173E2C]/25 text-[#173E2C] text-sm font-semibold hover:bg-[#E5ECD9]/60 transition-colors cursor-pointer"
            >
              Ubah Jawaban Saya
            </button>
            <button
              type="button"
              onClick={onReturnHome}
              className="w-full sm:w-auto min-h-[44px] px-7 py-2.5 rounded-full bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold hover:bg-[#0F2B1E] transition-colors cursor-pointer"
            >
              Kembali ke Halaman Awal
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (outcome === 'thank_you') {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#E5ECD9] text-[#173E2C] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-[#D6A23A] mb-3">
            <StarOrnament className="w-3 h-3" />
            <span>MASHRO</span>
            <StarOrnament className="w-3 h-3" />
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#173E2C] mb-4 text-balance">
            Masukan Anda Telah Tersimpan
          </h1>
          <p className="text-base sm:text-lg text-[#173E2C]/85 leading-relaxed max-w-lg mx-auto mb-6">
            Terima kasih telah meluangkan waktu untuk memberikan masukan bagi MASHRO. Setiap
            pendapatmu membantu kami menjadi lebih baik!
          </p>
          {submittedId && (
            <p className="font-mono text-xs text-[#173E2C]/55 mb-8 tabular-nums">
              Kode Referensi Tersimpan: {submittedId}
            </p>
          )}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onReturnHome}
              className="min-h-[46px] px-8 py-3 rounded-full bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold hover:bg-[#0F2B1E] transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentStation = BOARDING_PASS_STATIONS[currentStepMeta.id];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
      {/* Boarding Pass Route Progress Strip */}
      <div className="mb-6 sm:mb-8 p-4 rounded-2xl bg-[#FCF9F2] border border-[#5C3D28]/18">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#5C3D28] mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Ticket className="w-4 h-4 text-[#D96B27] shrink-0" aria-hidden="true" />
            <span className="font-mono font-semibold text-[#173E2C] tabular-nums">
              {currentStation.stationCode}
            </span>
            <span aria-hidden="true" className="text-[#5C3D28]/40">·</span>
            <span className="font-semibold text-[#173E2C] truncate">
              Stasiun {currentStation.stopName}
            </span>
            <span className="hidden sm:inline text-[#5C3D28]/65">
              ({currentStepIndex + 1}/{visibleSteps.length})
            </span>
          </div>
          <span className="font-mono text-xs font-semibold text-[#173E2C] tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div
          className="w-full h-2.5 rounded-full bg-[#5C3D28]/12 overflow-hidden p-[2px]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres pengisian survei MASHRO"
        >
          <div
            className="h-full bg-gradient-to-r from-[#173E2C] via-[#23533C] to-[#D96B27] rounded-full transition-all duration-300 motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[275px_1fr] gap-8 items-start">
        {/* Desktop Boarding Pass Sidebar */}
        <aside className="hidden lg:block sticky top-20 bg-[#FCF9F2] border border-[#5C3D28]/20 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 bg-[#173E2C] text-[#F7F1E3]">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#D6A23A] mb-1">
              <span>MASHRO TRANSIT PASS</span>
              <span>MSH-01</span>
            </div>
            <p className="font-editorial text-xl font-semibold leading-tight">
              Rute Survei Pelanggan
            </p>
          </div>

          <div className="ticket-perforation border-b border-dashed border-[#5C3D28]/25 px-5 py-3 bg-[#F7F1E3]/60 flex items-center justify-between text-[11px] font-mono text-[#5C3D28]">
            <span>PENCICIP</span>
            <span className="text-[#D96B27]">→</span>
            <span>EVALUASI</span>
          </div>

          <div className="p-5">
            <ol className="space-y-1.5">
              {visibleSteps.map((step, idx) => {
                const isCurrent = step.id === currentStepId;
                const isCompleted = idx < currentStepIndex;
                const station = BOARDING_PASS_STATIONS[step.id];
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      disabled={idx > currentStepIndex}
                      onClick={() => idx <= currentStepIndex && handleJumpToStep(step.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-colors ${
                        isCurrent
                          ? 'bg-[#173E2C] text-[#F7F1E3] font-semibold shadow-xs'
                          : isCompleted
                          ? 'text-[#173E2C] hover:bg-[#E5ECD9]/70 cursor-pointer'
                          : 'text-[#5C3D28]/45 cursor-not-allowed'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                          isCurrent
                            ? 'bg-[#D96B27] border-[#FCF9F2]'
                            : isCompleted
                            ? 'bg-[#173E2C] border-[#173E2C]'
                            : 'bg-transparent border-[#5C3D28]/35'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate leading-snug">{station.stopName}</span>
                        <span
                          className={`block font-mono text-[10px] tabular-nums ${
                            isCurrent ? 'text-[#D6A23A]' : 'text-[#5C3D28]/60'
                          }`}
                        >
                          {station.stationCode} · {step.shortTitle}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 pt-4 border-t border-dashed border-[#5C3D28]/20 text-xs text-[#5C3D28]/75 leading-relaxed">
              Jawaban Anda tersimpan sementara di tiket ini saat berpindah antar stasiun.
            </div>
          </div>
        </aside>

        {/* Active Step Card */}
        <section className="bg-[#FCF9F2] border border-[#5C3D28]/18 rounded-3xl p-5 sm:p-8 shadow-sm">
          <div className="pb-5 border-b border-dashed border-[#5C3D28]/20 mb-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-semibold text-[#D96B27] mb-1.5 tabular-nums">
              <span>{currentStation.stationCode}</span>
              <span aria-hidden="true" className="text-[#5C3D28]/35">·</span>
              <span className="text-[#5C3D28]">PEMBERHENTIAN: {currentStation.stopName.toUpperCase()}</span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#173E2C] mb-1.5">
              {currentStepMeta.title}
            </h1>
            <p className="text-sm text-[#5C3D28]/85 leading-relaxed">
              {currentStepMeta.subtitle}
            </p>
          </div>

          {/* Validation Error Summary */}
          {validationErrors.length > 0 && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-2xl bg-red-950/[0.06] border border-red-800/25 text-red-950 text-sm"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-800" aria-hidden="true" />
                <div>
                  <p className="font-semibold mb-1">
                    Mohon lengkapi pertanyaan wajib berikut sebelum melanjutkan:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs sm:text-sm">
                    {validationErrors.slice(0, 4).map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                    {validationErrors.length > 4 && (
                      <li>Dan {validationErrors.length - 4} pertanyaan wajib lainnya.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Tentang Responden */}
          {currentStepId === 'respondent' && (
            <div>
              <RadioOptionGroup
                id="hasTasted"
                label="Apakah Anda sudah pernah mencicipi MASHRO?"
                description="Survei evaluasi produk hanya dilanjutkan oleh responden yang telah mencicipi sajian MASHRO."
                options={[
                  {
                    value: 'Sudah pernah',
                    label: 'Sudah pernah',
                    detail: 'Saya sudah pernah mencicipi sajian MASHRO',
                  },
                  {
                    value: 'Belum pernah',
                    label: 'Belum pernah',
                    detail: 'Saya belum pernah mencoba sajian MASHRO',
                  },
                ]}
                value={draft.hasTasted}
                onChange={(val) => updateField('hasTasted', val)}
                hasError={missingFields.includes('hasTasted')}
              />

              <RadioOptionGroup
                id="activity"
                label="Aktivitas Anda saat ini"
                columns={2}
                options={ACTIVITY_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                value={draft.activity}
                onChange={(val) => updateField('activity', val)}
                hasError={missingFields.includes('activity')}
              />

              {draft.activity === 'Lainnya' && (
                <div className="py-4 border-b border-[#173E2C]/10">
                  <label
                    htmlFor="activityOther"
                    className="block text-sm font-medium text-[#173E2C] mb-2"
                  >
                    Sebutkan aktivitas Anda (opsional)
                  </label>
                  <input
                    id="activityOther"
                    type="text"
                    maxLength={100}
                    value={draft.activityOther}
                    onChange={(e) => updateField('activityOther', e.target.value)}
                    placeholder="Contoh: Wiraswasta / Freelancer"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#173E2C]/20 text-sm text-[#173E2C] focus:outline-none focus:border-[#173E2C]"
                  />
                </div>
              )}

              {draft.hasTasted === 'Sudah pernah' && (
                <RadioOptionGroup
                  id="hasOrdered"
                  label="Apakah Anda pernah memesan MASHRO secara langsung (Pre-Order)?"
                  description="Jika pernah memesan, kami akan menanyakan evaluasi singkat mengenai layanan Pre-Order."
                  options={[
                    {
                      value: 'Ya, pernah memesan',
                      label: 'Ya, pernah memesan',
                      detail: 'Saya memesan langsung melalui sistem Pre-Order MASHRO',
                    },
                    {
                      value: 'Tidak, hanya mencicipi',
                      label: 'Tidak, hanya mencicipi',
                      detail: 'Saya mencicipi sampel / dibelikan orang lain tanpa memesan sendiri',
                    },
                  ]}
                  value={draft.hasOrdered}
                  onChange={(val) => updateField('hasOrdered', val)}
                  hasError={missingFields.includes('hasOrdered')}
                />
              )}
            </div>
          )}

          {/* STEP 2: Pengalaman Produk */}
          {currentStepId === 'product' && (
            <div>
              <div className="mb-4 p-4 rounded-2xl bg-[#E5ECD9]/55 border border-[#173E2C]/10 text-xs sm:text-sm text-[#173E2C]/85">
                Gunakan skala <strong>1 (Sangat Tidak Puas)</strong> hingga{' '}
                <strong>5 (Sangat Puas)</strong> untuk menilai pengalaman Anda pada setiap aspek
                sajian MASHRO.
              </div>
              {PRODUCT_EXPERIENCE_ITEMS.map((item) => (
                <VolumeMeter
                  key={item.key}
                  id={item.key}
                  label={item.label}
                  description={item.description}
                  value={draft[item.key]}
                  onChange={(val) => updateField(item.key, val)}
                  hasError={missingFields.includes(item.key)}
                />
              ))}
            </div>
          )}

          {/* STEP 3: Evaluasi Produk dan Kemasan */}
          {currentStepId === 'packaging' && (
            <div>
              {PACKAGING_RATING_ITEMS.filter((i) => i.group === 'product').map((item) => (
                <VolumeMeter
                  key={item.key}
                  id={item.key}
                  label={item.label}
                  description={item.description}
                  value={draft[item.key]}
                  onChange={(val) => updateField(item.key, val)}
                  hasError={missingFields.includes(item.key)}
                />
              ))}

              <RadioOptionGroup
                id="satietyLevel"
                label="Bagaimana tingkat rasa kenyang setelah menyantap satu porsi MASHRO?"
                options={SATIETY_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                value={draft.satietyLevel}
                onChange={(val) => updateField('satietyLevel', val)}
                hasError={missingFields.includes('satietyLevel')}
              />

              {PACKAGING_RATING_ITEMS.filter((i) => i.group === 'packaging').map((item) => (
                <VolumeMeter
                  key={item.key}
                  id={item.key}
                  label={item.label}
                  description={item.description}
                  value={draft[item.key]}
                  onChange={(val) => updateField(item.key, val)}
                  hasError={missingFields.includes(item.key)}
                />
              ))}
            </div>
          )}

          {/* STEP 4: Harga dan Minat Pembelian */}
          {currentStepId === 'pricing' && (
            <div>
              <div className="mb-4 p-5 rounded-2xl bg-[#E5ECD9]/60 border border-[#173E2C]/12">
                <p className="text-xs font-semibold tracking-wider text-[#173E2C]/70 mb-1">
                  INFORMASI KISARAN HARGA USULAN
                </p>
                <p className="font-editorial text-2xl font-semibold text-[#173E2C] mb-1.5">
                  Rp20.000 – Rp25.000 per mangkuk
                </p>
                <p className="text-sm text-[#173E2C]/80 leading-relaxed">
                  Rentang harga di atas merupakan kisaran usulan yang sedang kami evaluasi dan
                  belum menjadi harga jual final yang ditetapkan.
                </p>
              </div>

              <RadioOptionGroup
                id="priceReasonable"
                label="Menurut Anda, apakah kisaran harga Rp20.000–Rp25.000 tersebut wajar untuk satu sajian MASHRO?"
                columns={2}
                options={PRICE_REASONABLE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                value={draft.priceReasonable}
                onChange={(val) => updateField('priceReasonable', val)}
                hasError={missingFields.includes('priceReasonable')}
              />

              <Scale1to5
                id="purchaseLikelihood"
                variant="destination"
                label="Seberapa besar kemungkinan Anda membeli MASHRO pada kisaran harga tersebut?"
                lowLabel="1 · Sangat Tidak Mungkin"
                highLabel="5 · Sangat Mungkin"
                value={draft.purchaseLikelihood}
                onChange={(val) => updateField('purchaseLikelihood', val)}
                hasError={missingFields.includes('purchaseLikelihood')}
              />

              <RadioOptionGroup
                id="purchaseFrequency"
                variant="destination"
                label="Jika tersedia secara rutin, seberapa sering Anda berpotensi membeli MASHRO?"
                options={PURCHASE_FREQUENCY_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                value={draft.purchaseFrequency}
                onChange={(val) => updateField('purchaseFrequency', val)}
                hasError={missingFields.includes('purchaseFrequency')}
              />

              <RadioOptionGroup
                id="repurchaseIntention"
                variant="destination"
                label="Apakah Anda berkeinginan untuk membeli MASHRO kembali?"
                options={REPURCHASE_INTENTION_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                value={draft.repurchaseIntention}
                onChange={(val) => updateField('repurchaseIntention', val)}
                hasError={missingFields.includes('repurchaseIntention')}
              />
            </div>
          )}

          {/* STEP 5: Evaluasi Layanan Pre-Order */}
          {currentStepId === 'preorder' && (
            <div>
              {PREORDER_ITEMS.map((item) => (
                <VolumeMeter
                  key={item.key}
                  id={item.key}
                  label={item.label}
                  description={item.description}
                  value={draft[item.key]}
                  onChange={(val) => updateField(item.key, val)}
                  hasError={missingFields.includes(item.key)}
                />
              ))}
            </div>
          )}

          {/* STEP 6: Kepuasan Keseluruhan */}
          {currentStepId === 'overall' && (
            <div>
              <ConstellationIndicator
                id="overallSatisfaction"
                min={1}
                max={5}
                pattern="cassava-crown"
                label="Secara keseluruhan, seberapa puas Anda dengan produk MASHRO?"
                value={draft.overallSatisfaction}
                onChange={(val) => updateField('overallSatisfaction', val)}
                hasError={missingFields.includes('overallSatisfaction')}
              />

              <ConstellationIndicator
                id="recommendScore"
                min={0}
                max={10}
                pattern="arc"
                label="Seberapa besar kemungkinan Anda merekomendasikan MASHRO kepada teman atau rekan?"
                description="0 berarti tidak mungkin sama sekali, 10 berarti sangat mungkin merekomendasikan."
                value={draft.recommendScore}
                onChange={(val) => updateField('recommendScore', val)}
                hasError={missingFields.includes('recommendScore')}
              />

              <CheckboxOptionGroup
                id="favoriteComponents"
                label="Komponen produk mana yang paling Anda sukai?"
                description="Anda dapat memilih satu atau beberapa komponen favorit."
                options={FAVORITE_COMPONENT_OPTIONS}
                values={draft.favoriteComponents}
                onChange={(vals) => updateField('favoriteComponents', vals)}
                hasError={missingFields.includes('favoriteComponents')}
              />

              <div className="py-5">
                <label
                  htmlFor="feedbackNotes"
                  className="block text-base font-semibold text-[#173E2C] mb-1.5"
                >
                  Apa saran atau masukan yang ingin kamu berikan untuk MASHRO? (Opsional)
                </label>
                <p className="text-sm text-[#173E2C]/70 mb-3">
                  Saran terkait rasa, porsi, kemasan, maupun variasi menu sangat kami hargai.
                </p>
                <textarea
                  id="feedbackNotes"
                  rows={4}
                  maxLength={1000}
                  value={draft.feedbackNotes}
                  onChange={(e) => updateField('feedbackNotes', e.target.value)}
                  placeholder="Tuliskan saran atau masukan Anda di sini..."
                  className="w-full p-4 rounded-2xl bg-white border border-[#173E2C]/20 text-sm text-[#173E2C] leading-relaxed focus:outline-none focus:border-[#173E2C]"
                />
                <div className="text-right text-xs font-mono text-[#173E2C]/55 mt-1 tabular-nums">
                  {draft.feedbackNotes.length} / 1000
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Tinjauan & Kirim */}
          {currentStepId === 'review' && (
            <div className="space-y-6">
              {submitError && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-red-950/[0.06] border border-red-800/25 text-red-950 text-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-800" aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="divide-y divide-[#173E2C]/10 border border-[#173E2C]/12 rounded-2xl bg-white">
                {/* Summary: Profil */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#D6A23A] mb-1">
                      TENTANG RESPONDEN
                    </p>
                    <p className="text-sm text-[#173E2C]">
                      <strong>Pengalaman:</strong> {draft.hasTasted} ·{' '}
                      <strong>Aktivitas:</strong> {draft.activity}
                      {draft.activity === 'Lainnya' && draft.activityOther
                        ? ` (${draft.activityOther})`
                        : ''}{' '}
                      · <strong>Pre-Order:</strong> {draft.hasOrdered}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep('respondent')}
                    className="text-xs font-semibold text-[#173E2C] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ubah</span>
                  </button>
                </div>

                {/* Summary: Produk */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#D6A23A] mb-2">
                      PENGALAMAN PRODUK (SKALA 1–5)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#173E2C]/85">
                      {PRODUCT_EXPERIENCE_ITEMS.map((item) => (
                        <div key={item.key} className="bg-[#F7F1E3]/70 rounded-lg px-2.5 py-2">
                          <span className="block text-[#173E2C]/70 leading-snug mb-0.5">
                            {item.label.replace(/^Rasa /, '').replace(' (Buncis & Wortel Kukus)', '')}
                          </span>
                          <span className="font-mono font-semibold text-sm tabular-nums">
                            {draft[item.key]}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep('product')}
                    className="text-xs font-semibold text-[#173E2C] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ubah</span>
                  </button>
                </div>

                {/* Summary: Kemasan */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#D6A23A] mb-1.5">
                      PORSI & KEMASAN
                    </p>
                    <p className="text-sm text-[#173E2C] mb-1">
                      <strong>Rasa kenyang:</strong> {draft.satietyLevel}
                    </p>
                    <p className="text-xs text-[#173E2C]/75 font-mono tabular-nums">
                      Porsi {draft.ratingPortion}/5 · Komposisi {draft.ratingIngredientCombo}/5 ·
                      Praktis {draft.ratingPackPracticality}/5 · Kuat {draft.ratingPackStrength}/5
                      · Anti-bocor {draft.ratingLeakResistance}/5
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep('packaging')}
                    className="text-xs font-semibold text-[#173E2C] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ubah</span>
                  </button>
                </div>

                {/* Summary: Harga */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#D6A23A] mb-1">
                      HARGA & MINAT PEMBELIAN
                    </p>
                    <p className="text-sm text-[#173E2C] leading-relaxed">
                      <strong>Kewajaran Rp20rb–25rb:</strong> {draft.priceReasonable} ·{' '}
                      <strong>Minat beli:</strong> {draft.purchaseLikelihood}/5 ·{' '}
                      <strong>Frekuensi:</strong> {draft.purchaseFrequency} ·{' '}
                      <strong>Beli lagi:</strong> {draft.repurchaseIntention}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep('pricing')}
                    className="text-xs font-semibold text-[#173E2C] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ubah</span>
                  </button>
                </div>

                {/* Summary: Pre-Order (Conditional) */}
                {draft.hasOrdered === 'Ya, pernah memesan' && (
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#D6A23A] mb-1">
                        LAYANAN PRE-ORDER
                      </p>
                      <p className="text-xs text-[#173E2C]/85 font-mono tabular-nums">
                        Kemudahan {draft.preOrderEase}/5 · Respons {draft.preOrderResponsiveness}/5 ·
                        Ketepatan Pesanan {draft.preOrderAccuracy}/5 · Ketepatan Waktu{' '}
                        {draft.preOrderPunctuality}/5
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJumpToStep('preorder')}
                      className="text-xs font-semibold text-[#173E2C] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ubah</span>
                    </button>
                  </div>
                )}

                {/* Summary: Kepuasan Keseluruhan */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#D6A23A] mb-1">
                      KEPUASAN KESELURUHAN
                    </p>
                    <p className="text-sm text-[#173E2C]">
                      <strong>Kepuasan:</strong> {draft.overallSatisfaction}/5 ·{' '}
                      <strong>Rekomendasi:</strong> {draft.recommendScore}/10 ·{' '}
                      <strong>Favorit:</strong> {draft.favoriteComponents.join(', ')}
                    </p>
                    {draft.feedbackNotes.trim() && (
                      <p className="text-sm text-[#173E2C]/80 italic mt-1.5">
                        “{draft.feedbackNotes.trim()}”
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep('overall')}
                    className="text-xs font-semibold text-[#173E2C] hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ubah</span>
                  </button>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 rounded-2xl bg-[#E5ECD9]/60 border border-[#173E2C]/12 flex items-start gap-3 text-xs sm:text-sm text-[#173E2C]/85">
                <ShieldCheck className="w-5 h-5 text-[#173E2C] shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed">
                  <strong>Pemberitahuan Privasi:</strong> Respon dikumpulkan secara anonim tanpa
                  data pribadi sensitif (tanpa nama lengkap, nomor telepon, atau alamat rumah)
                  semata-mata untuk evaluasi kualitas sajian dan layanan MASHRO.
                </p>
              </div>
            </div>
          )}

          {/* Footer Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-dashed border-[#5C3D28]/20 flex items-center justify-between gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="min-h-[46px] px-4 sm:px-5 py-2.5 rounded-2xl border border-[#5C3D28]/25 bg-white text-[#173E2C] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 hover:bg-[#E5ECD9]/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 text-[#5C3D28] shrink-0" aria-hidden="true" />
              <span>Sebelumnya</span>
            </button>

            {currentStepId === 'review' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-h-[46px] px-5 sm:px-8 py-2.5 rounded-2xl bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold inline-flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 hover:bg-[#0F2B1E] transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D6A23A] shrink-0" aria-hidden="true" />
                    <span>Mengirim Jawaban...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Survei</span>
                    <CheckCircle2 className="w-4 h-4 text-[#D96B27] shrink-0" aria-hidden="true" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[46px] px-5 sm:px-7 py-2.5 rounded-2xl bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold inline-flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 hover:bg-[#0F2B1E] transition-colors shadow-xs cursor-pointer"
              >
                <span>
                  {currentStepIndex === visibleSteps.length - 2
                    ? 'Tinjau Jawaban'
                    : 'Lanjut'}
                </span>
                <ArrowRight className="w-4 h-4 text-[#D96B27] shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
