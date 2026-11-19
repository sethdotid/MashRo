import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  Loader2,
  LogOut,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { getAccessToken, googleSignIn, initAuth, logout } from '../firebase';
import {
  GoogleFormMetadata,
  GoogleFormResponseEntry,
  createMashroGoogleForm,
  getGoogleFormInfo,
  listGoogleFormResponses,
  parseGoogleFormInput,
} from '../services/googleFormsService';
import {
  OwnerGoogleFormConfig,
  deleteSurveyResponse,
  fetchSurveyResponses,
  loadOwnerGoogleFormConfig,
  saveOwnerGoogleFormConfig,
} from '../services/surveyService';
import { StoredSurveyResponse } from '../types/survey';
import { buildCsvContent, computeDashboardStats } from '../utils/surveyLogic';
import { StarOrnament } from './BrandMotifs';
import { DashboardSummaryCharts } from './DashboardSummaryCharts';

type AttributeFilter = 'Semua' | 'Produk' | 'Kemasan & Porsi' | 'Layanan Pre-Order';

export function OwnerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [responses, setResponses] = useState<StoredSurveyResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [attrFilter, setAttrFilter] = useState<AttributeFilter>('Semua');

  // Google Forms state
  const [formConfig, setFormConfig] = useState<OwnerGoogleFormConfig | null>(null);
  const [manualFormId, setManualFormId] = useState('');
  const [googleFormMeta, setGoogleFormMeta] = useState<GoogleFormMetadata | null>(null);
  const [googleFormResponses, setGoogleFormResponses] = useState<GoogleFormResponseEntry[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [formsSuccess, setFormsSuccess] = useState<string | null>(null);
  const [copiedFormLink, setCopiedFormLink] = useState(false);

  // Confirmation modal states (Mandatory for mutating Workspace/Firestore actions)
  const [confirmCreateFormOpen, setConfirmCreateFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    setPermissionDenied(false);
    try {
      const [rows, savedConfig] = await Promise.all([
        fetchSurveyResponses(),
        loadOwnerGoogleFormConfig(),
      ]);
      setResponses(rows);
      if (savedConfig) {
        setFormConfig(savedConfig);
        setManualFormId(savedConfig.formId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions')) {
        setPermissionDenied(true);
      } else {
        setDataError('Gagal memuat data respons dari database.');
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth((nextUser, token) => {
      setUser(nextUser);
      setAccessToken(token ?? getAccessToken());
      setAuthReady(true);
      if (nextUser) {
        void loadDashboardData();
      } else {
        setResponses([]);
        setPermissionDenied(false);
      }
    });
    return () => unsubscribe();
  }, [loadDashboardData]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken || null);
      await loadDashboardData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Proses masuk dibatalkan atau gagal.';
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setResponses([]);
    setGoogleFormMeta(null);
    setGoogleFormResponses([]);
  };

  const stats = useMemo(() => computeDashboardStats(responses), [responses]);

  const filteredAttributes = useMemo(() => {
    if (attrFilter === 'Semua') return stats.attributeAverages;
    return stats.attributeAverages.filter((a) => a.category === attrFilter);
  }, [stats.attributeAverages, attrFilter]);

  const handleExportCsv = () => {
    if (responses.length === 0) return;
    const csv = buildCsvContent(responses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mashro-survei-respons-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const executeCreateGoogleForm = async () => {
    setConfirmCreateFormOpen(false);
    setFormsError(null);
    setFormsSuccess(null);

    const token = accessToken ?? getAccessToken();
    if (!token) {
      setFormsError('Token Google Forms belum aktif. Klik "Hubungkan Ulang Google Forms" terlebih dahulu.');
      return;
    }

    setFormsLoading(true);
    try {
      const created = await createMashroGoogleForm(token);
      setGoogleFormMeta(created);
      setManualFormId(created.formId);
      const config: OwnerGoogleFormConfig = {
        formId: created.formId,
        formTitle: created.title,
        responderUri: created.responderUri,
      };
      await saveOwnerGoogleFormConfig(config);
      setFormConfig(config);
      setGoogleFormResponses([]);
      setFormsSuccess(
        `Google Form lengkap MASHRO (${created.questionCount} pertanyaan) berhasil dibuat di akun Google Anda dan link survei siap dibagikan.`
      );
    } catch (err) {
      setFormsError(err instanceof Error ? err.message : 'Gagal membuat Google Form.');
    } finally {
      setFormsLoading(false);
    }
  };

  const handleCopyResponderUri = async (uri: string) => {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopiedFormLink(true);
      setTimeout(() => setCopiedFormLink(false), 2500);
    } catch {
      setFormsError('Tidak dapat menyalin otomatis ke clipboard. Silakan salin link secara manual dari kotak link.');
    }
  };

  const handleFetchGoogleForm = async () => {
    setFormsError(null);
    setFormsSuccess(null);

    const parsed = parseGoogleFormInput(manualFormId);
    if (parsed.isPublishedResponderUrl) {
      setFormsError(
        'Link "/forms/d/e/..." adalah link pengisian publik. Untuk menautkan ke dashboard, tempelkan URL editor Google Form (/forms/d/<ID>/edit) atau ID Form-nya.'
      );
      return;
    }

    const targetId = parsed.formId;
    if (!targetId) {
      setFormsError('Masukkan ID atau URL editor Google Form yang ingin ditautkan.');
      return;
    }

    const token = accessToken ?? getAccessToken();
    if (!token) {
      setFormsError('Token akses Google belum tersedia di sesi ini. Klik "Hubungkan Ulang Google Forms".');
      return;
    }

    setFormsLoading(true);
    try {
      const [meta, formResps] = await Promise.all([
        getGoogleFormInfo(targetId, token),
        listGoogleFormResponses(targetId, token),
      ]);
      setGoogleFormMeta(meta);
      setGoogleFormResponses(formResps);
      setManualFormId(meta.formId);
      const config: OwnerGoogleFormConfig = {
        formId: meta.formId,
        formTitle: meta.title,
        responderUri: meta.responderUri,
      };
      await saveOwnerGoogleFormConfig(config);
      setFormConfig(config);
      setFormsSuccess(`Berhasil menyinkronkan formulir "${meta.title}" (${formResps.length} respons).`);
    } catch (err) {
      setFormsError(err instanceof Error ? err.message : 'Gagal mengambil data Google Forms.');
    } finally {
      setFormsLoading(false);
    }
  };

  const executeDeleteResponse = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await deleteSurveyResponse(id);
      setResponses((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Gagal menghapus respons.');
    }
  };

  if (!authReady) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#173E2C] mb-3" />
        <p className="text-sm text-[#173E2C]/75">Memeriksa sesi pemilik MASHRO...</p>
      </main>
    );
  }

  // Unauthenticated view: Official Sign in with Google button
  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="bg-[#FCF9F2] border border-[#173E2C]/15 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-[#D6A23A] mb-3">
            <StarOrnament className="w-3.5 h-3.5" />
            <span>PORTAL PEMILIK MASHRO</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#173E2C] mb-3">
            Dashboard Manajemen Respons
          </h1>
          <p className="text-sm text-[#173E2C]/75 leading-relaxed mb-7">
            Masuk menggunakan akun Google pemilik bisnis MASHRO untuk melihat statistik kepuasan
            pelanggan, mengekspor data CSV, dan menghubungkan Google Forms.
          </p>

          {authError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-red-950/[0.06] border border-red-800/25 text-red-950 text-xs text-left"
            >
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="gsi-material-button"
          >
            <div className="gsi-material-button-icon">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                style={{ display: 'block' }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </div>
            <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
          </button>
        </div>
      </main>
    );
  }

  // Signed in, but lacks owner permissions
  if (permissionDenied) {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="bg-[#FCF9F2] border border-red-800/20 rounded-3xl p-8 text-center shadow-sm">
          <ShieldAlert className="w-10 h-10 text-red-800 mx-auto mb-4" aria-hidden="true" />
          <h1 className="font-editorial text-3xl font-semibold text-[#173E2C] mb-3">
            Akses Terbatas untuk Pemilik MASHRO
          </h1>
          <p className="text-sm text-[#173E2C]/80 leading-relaxed mb-6">
            Akun <strong>{user.email}</strong> tidak memiliki izin untuk membaca data respons survei
            pelanggan. Silakan masuk dengan akun Google pemilik bisnis yang terdaftar.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#0F2B1E] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Keluar & Ganti Akun</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#173E2C]/12">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#D6A23A] mb-1">
            <StarOrnament className="w-3 h-3" />
            <span>DASHBOARD PEMILIK</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#173E2C]/70">{user.email}</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#173E2C]">
            Manajemen Respons Survei MASHRO
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loadingData}
            className="min-h-[42px] px-4 py-2 rounded-full border border-[#173E2C]/20 bg-[#FCF9F2] text-[#173E2C] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#E5ECD9]/60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={responses.length === 0}
            className="min-h-[42px] px-5 py-2 rounded-full bg-[#173E2C] text-[#F7F1E3] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#0F2B1E] transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Ekspor CSV ({responses.length})</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[42px] px-4 py-2 rounded-full border border-[#173E2C]/20 text-[#173E2C]/80 text-xs sm:text-sm font-medium inline-flex items-center gap-2 hover:bg-red-950/5 hover:text-red-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {dataError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-950/[0.06] border border-red-800/25 text-red-950 text-sm flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{dataError}</span>
        </div>
      )}

      {/* KPI Summary Strip */}
      {loadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-[#FCF9F2] border border-[#173E2C]/10 animate-pulse"
            />
          ))}
        </div>
      ) : responses.length === 0 ? (
        <section className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-8 sm:p-12 text-center">
          <BarChart3 className="w-10 h-10 text-[#D6A23A] mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#173E2C] mb-2">
            Belum Ada Respons Masuk
          </h2>
          <p className="text-sm text-[#173E2C]/75 max-w-lg mx-auto leading-relaxed">
            Saat ini belum ada data pengiriman survei yang tersimpan di database. Statistik,
            grafik rata-rata kepuasan, dan ekspor CSV akan muncul otomatis segera setelah responden
            mengirimkan survei asli.
          </p>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-[#FCF9F2] border border-[#173E2C]/10">
              <p className="text-xs text-[#173E2C]/65 mb-2">Total Respons Asli</p>
              <p className="font-mono text-3xl font-semibold text-[#173E2C] tabular-nums">
                {stats.totalResponses}
              </p>
              <p className="text-xs text-[#173E2C]/60 mt-1 tabular-nums">
                {stats.preOrderCount} via Pre-Order
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCF9F2] border border-[#173E2C]/10">
              <p className="text-xs text-[#173E2C]/65 mb-2">Kepuasan Keseluruhan</p>
              <p className="font-mono text-3xl font-semibold text-[#173E2C] tabular-nums">
                {stats.avgOverallSatisfaction?.toFixed(1) ?? '—'}
                <span className="text-base font-normal text-[#173E2C]/55"> / 5</span>
              </p>
              <p className="text-xs text-[#173E2C]/60 mt-1">Rata-rata keseluruhan</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCF9F2] border border-[#173E2C]/10">
              <p className="text-xs text-[#173E2C]/65 mb-2">Skor Rekomendasi</p>
              <p className="font-mono text-3xl font-semibold text-[#173E2C] tabular-nums">
                {stats.avgRecommendScore?.toFixed(1) ?? '—'}
                <span className="text-base font-normal text-[#173E2C]/55"> / 10</span>
              </p>
              <p className="text-xs text-[#173E2C]/60 mt-1 tabular-nums">
                NPS Bersih: {stats.npsNetScore !== null ? `${stats.npsNetScore}` : '—'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCF9F2] border border-[#173E2C]/10">
              <p className="text-xs text-[#173E2C]/65 mb-2">Penerimaan Harga</p>
              <p className="font-mono text-3xl font-semibold text-[#173E2C] tabular-nums">
                {stats.priceAcceptancePct ?? 0}%
              </p>
              <p className="text-xs text-[#173E2C]/60 mt-1">Menilai Wajar / Sangat Wajar</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCF9F2] border border-[#173E2C]/10 col-span-2 lg:col-span-1">
              <p className="text-xs text-[#173E2C]/65 mb-2">Minat Beli Ulang</p>
              <p className="font-mono text-3xl font-semibold text-[#173E2C] tabular-nums">
                {stats.positiveRepurchasePct ?? 0}%
              </p>
              <p className="text-xs text-[#173E2C]/60 mt-1 tabular-nums">
                Minat beli: {stats.avgPurchaseLikelihood?.toFixed(1) ?? '—'}/5
              </p>
            </div>
          </section>

          {/* Recharts Summary Section: Bar & Pie Charts */}
          <DashboardSummaryCharts stats={stats} />

          {/* Attribute Averages Bar Chart */}
          <section className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#173E2C]">
                  Rata-Rata Kepuasan per Atribut
                </h2>
                <p className="text-xs sm:text-sm text-[#173E2C]/70">
                  Dihitung langsung dari {stats.totalResponses} respons masuk (skala 1.0 – 5.0).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F1E3] rounded-xl border border-[#173E2C]/10">
                {(['Semua', 'Produk', 'Kemasan & Porsi', 'Layanan Pre-Order'] as AttributeFilter[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAttrFilter(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        attrFilter === tab
                          ? 'bg-[#173E2C] text-[#F7F1E3]'
                          : 'text-[#173E2C]/75 hover:text-[#173E2C]'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-3.5">
              {filteredAttributes.map((attr) => {
                const widthPct = Math.round((attr.average / 5) * 100);
                return (
                  <div key={attr.key} className="grid grid-cols-1 sm:grid-cols-[240px_1fr_78px] gap-2 sm:gap-4 items-center">
                    <div className="text-sm font-medium text-[#173E2C] truncate" title={attr.label}>
                      {attr.label}
                    </div>
                    <div className="h-3 rounded-full bg-[#173E2C]/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#173E2C] transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="text-right font-mono text-sm font-semibold text-[#173E2C] tabular-nums">
                      {attr.average.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-[#173E2C]/55">
                        (n={attr.count})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Distribution Breakdowns */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-6">
              <h3 className="font-editorial text-2xl font-semibold text-[#173E2C] mb-4">
                Kewajaran Harga (Rp20rb–25rb) & Minat Beli Ulang
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#D6A23A] mb-2.5">
                    PENILAIAN KEWAJARAN HARGA
                  </p>
                  <div className="space-y-2">
                    {stats.priceDistribution.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-sm">
                        <span className="text-[#173E2C]/85">{d.label}</span>
                        <span className="font-mono text-xs text-[#173E2C] tabular-nums">
                          {d.count} ({d.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#173E2C]/10">
                  <p className="text-xs font-semibold text-[#D6A23A] mb-2.5">
                    MINAT MEMBELI KEMBALI
                  </p>
                  <div className="space-y-2">
                    {stats.repurchaseDistribution.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-sm">
                        <span className="text-[#173E2C]/85">{d.label}</span>
                        <span className="font-mono text-xs text-[#173E2C] tabular-nums">
                          {d.count} ({d.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-6">
              <h3 className="font-editorial text-2xl font-semibold text-[#173E2C] mb-4">
                Komponen Favorit & Tingkat Rasa Kenyang
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#D6A23A] mb-2.5">
                    KOMPONEN PRODUK FAVORIT
                  </p>
                  <div className="space-y-2">
                    {stats.favoriteDistribution.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-sm">
                        <span className="text-[#173E2C]/85">{d.label}</span>
                        <span className="font-mono text-xs text-[#173E2C] tabular-nums">
                          {d.count} pemilih ({d.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#173E2C]/10">
                  <p className="text-xs font-semibold text-[#D6A23A] mb-2.5">
                    TINGKAT RASA KENYANG
                  </p>
                  <div className="space-y-2">
                    {stats.satietyDistribution.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-sm">
                        <span className="text-[#173E2C]/85">{d.label}</span>
                        <span className="font-mono text-xs text-[#173E2C] tabular-nums">
                          {d.count} ({d.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Individual Submissions Table */}
          <section className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-6 sm:p-8">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#173E2C] mb-1">
              Daftar Respons Pelanggan
            </h2>
            <p className="text-xs sm:text-sm text-[#173E2C]/70 mb-5">
              Seluruh masukan terbaru beserta catatan saran dari responden.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#173E2C]/15 text-xs text-[#173E2C]/65">
                    <th className="py-3 pr-4 font-semibold">Waktu Kirim</th>
                    <th className="py-3 px-3 font-semibold">Aktivitas</th>
                    <th className="py-3 px-3 font-semibold text-right">Kepuasan</th>
                    <th className="py-3 px-3 font-semibold text-right">Rekomendasi</th>
                    <th className="py-3 px-3 font-semibold">Harga 20–25rb</th>
                    <th className="py-3 px-3 font-semibold">Saran / Masukan</th>
                    <th className="py-3 pl-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#173E2C]/10">
                  {responses.map((r) => (
                    <tr key={r.id} className="hover:bg-[#E5ECD9]/25 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-[#173E2C]/75 whitespace-nowrap tabular-nums">
                        {new Date(r.createdAtMs).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-3 text-[#173E2C]">
                        {r.activity}
                        {r.hasOrdered === 'Ya, pernah memesan' ? ' · PO' : ''}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                        {r.overallSatisfaction}/5
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                        {r.recommendScore}/10
                      </td>
                      <td className="py-3 px-3 text-xs text-[#173E2C]/80 whitespace-nowrap">
                        {r.priceReasonable}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#173E2C]/80 max-w-xs">
                        {r.feedbackNotes ? r.feedbackNotes : '—'}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          aria-label={`Hapus respons ${r.id}`}
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="p-2 rounded-lg text-[#173E2C]/55 hover:text-red-800 hover:bg-red-950/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Google Forms Integration Panel */}
      <section className="bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D6A23A] mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
              <span>PUBLIKASI LINK GOOGLE FORM & GOOGLE DRIVE (GRATIS)</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#173E2C]">
              Publikasikan Survei sebagai Link Google Form
            </h2>
            <p className="text-sm text-[#173E2C]/75 mt-1 max-w-2xl leading-relaxed">
              Buat formulir survei MASHRO lengkap (6 bagian, 32 pertanyaan) langsung di Google Forms
              dan Google Drive Anda secara gratis tanpa biaya langganan cloud, lalu bagikan link
              Google Form tersebut ke pelanggan. Catatan teknis: versi Google Forms menggunakan
              komponen bawaan standar (pilihan ganda, skala linear, kotak centang), sedangkan
              kontrol visual khusus (Volume Meter, Radio Tuner, Constellation, Boarding Pass, dan
              Destination Indicator) berjalan pada aplikasi web MASHRO ini.
            </p>
          </div>

          {!accessToken && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="min-h-[42px] px-5 py-2 rounded-full bg-[#173E2C] text-[#F7F1E3] text-xs sm:text-sm font-semibold hover:bg-[#0F2B1E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Hubungkan Ulang Google Forms
            </button>
          )}
        </div>

        {formsError && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl bg-red-950/[0.06] border border-red-800/25 text-red-950 text-xs sm:text-sm"
          >
            {formsError}
          </div>
        )}
        {formsSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#E5ECD9] border border-[#173E2C]/20 text-[#173E2C] text-xs sm:text-sm">
            {formsSuccess}
          </div>
        )}

        {(formConfig?.responderUri || googleFormMeta?.responderUri) && (
          <div className="mb-6 p-5 rounded-2xl bg-[#E5ECD9]/60 border border-[#173E2C]/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#173E2C]/70">
                  LINK GOOGLE FORM SIAP SEBAR
                </p>
                <p className="text-sm font-semibold text-[#173E2C]">
                  {googleFormMeta?.title ?? formConfig?.formTitle}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyResponderUri(
                      googleFormMeta?.responderUri || formConfig?.responderUri || ''
                    )
                  }
                  className="min-h-[40px] px-4 py-2 rounded-full bg-[#173E2C] text-[#F7F1E3] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#0F2B1E] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copiedFormLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Link Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Salin Link Google Form</span>
                    </>
                  )}
                </button>
                <a
                  href={googleFormMeta?.responderUri || formConfig?.responderUri}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] px-4 py-2 rounded-full border border-[#173E2C]/25 bg-white text-[#173E2C] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#FCF9F2] transition-colors whitespace-nowrap"
                >
                  <span>Buka Google Form</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                {(googleFormMeta?.formId || formConfig?.formId) && (
                  <a
                    href={`https://docs.google.com/forms/d/${encodeURIComponent(
                      googleFormMeta?.formId ?? formConfig?.formId ?? ''
                    )}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[40px] px-4 py-2 rounded-full border border-[#173E2C]/25 bg-white text-[#173E2C] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#FCF9F2] transition-colors whitespace-nowrap"
                  >
                    <span>Kelola di Drive / Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-white/90 border border-[#173E2C]/15 font-mono text-xs text-[#173E2C] break-all select-all">
              {googleFormMeta?.responderUri || formConfig?.responderUri}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-[#173E2C]/10 space-y-4">
            <h3 className="font-editorial text-xl font-semibold text-[#173E2C]">
              1. Buat & Publikasikan Link Google Form
            </h3>
            <p className="text-xs sm:text-sm text-[#173E2C]/75 leading-relaxed">
              Otomatis membuat Google Form MASHRO lengkap (6 bagian: Profil, Pengalaman Produk,
              Kemasan, Harga, Pre-Order, dan Kepuasan Keseluruhan) langsung di Google Drive Anda.
            </p>
            <button
              type="button"
              onClick={() => setConfirmCreateFormOpen(true)}
              disabled={formsLoading}
              className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#0F2B1E] transition-colors cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Buat Link Google Form MASHRO</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#173E2C]/10 space-y-4">
            <h3 className="font-editorial text-xl font-semibold text-[#173E2C]">
              2. Tautkan & Tarik Respons Google Form
            </h3>
            <p className="text-xs text-[#173E2C]/70 leading-relaxed">
              Tempelkan ID Formulir atau link editor Google Form (<span className="font-mono">/forms/d/.../edit</span>)
              untuk menarik jawaban terbaru langsung ke dashboard ini.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                aria-label="ID atau URL Google Form"
                value={manualFormId}
                onChange={(e) => setManualFormId(e.target.value)}
                placeholder="ID atau URL /forms/d/.../edit"
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-[#F7F1E3]/40 border border-[#173E2C]/20 text-sm text-[#173E2C] focus:outline-none focus:border-[#173E2C]"
              />
              <button
                type="button"
                onClick={handleFetchGoogleForm}
                disabled={formsLoading}
                className="min-h-[44px] px-5 py-2 rounded-xl border border-[#173E2C]/25 text-[#173E2C] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#E5ECD9]/60 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {formsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" aria-hidden="true" />
                )}
                <span>Tarik Respons</span>
              </button>
            </div>
          </div>
        </div>

        {googleFormMeta && (
          <div className="mt-6 pt-5 border-t border-[#173E2C]/10">
            <p className="text-sm font-semibold text-[#173E2C] mb-3">
              Respons dari Google Forms ({googleFormResponses.length})
            </p>
            {googleFormResponses.length === 0 ? (
              <p className="text-xs text-[#173E2C]/65">
                Belum ada respons pada Google Form yang ditautkan.
              </p>
            ) : (
              <div className="space-y-2.5">
                {googleFormResponses.map((entry) => (
                  <div
                    key={entry.responseId}
                    className="p-4 rounded-xl bg-white border border-[#173E2C]/10 text-xs text-[#173E2C]/85"
                  >
                    <div className="flex items-center justify-between font-mono text-[#173E2C]/60 mb-1.5 tabular-nums">
                      <span>ID: {entry.responseId}</span>
                      <span>
                        {entry.lastSubmittedTime
                          ? new Date(entry.lastSubmittedTime).toLocaleString('id-ID')
                          : ''}
                      </span>
                    </div>
                    <p>
                      {entry.summaryAnswers.map((a) => a.value).filter(Boolean).join(' · ') ||
                        'Tidak ada jawaban teks.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Confirmation Modal: Create Google Form */}
      {confirmCreateFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-create-form-title"
          className="fixed inset-0 z-50 bg-[#0F2B1E]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-[#FCF9F2] border border-[#173E2C]/15 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3
              id="confirm-create-form-title"
              className="font-editorial text-2xl font-semibold text-[#173E2C] mb-2"
            >
              Konfirmasi Pembuatan Google Form
            </h3>
            <p className="text-sm text-[#173E2C]/80 leading-relaxed mb-6">
              Tindakan ini akan membuat formulir baru berjudul{' '}
              <strong>“MASHRO – Survei Pengalaman dan Kepuasan Pelanggan”</strong> beserta 6 bagian
              lengkap (32 pertanyaan survei MASHRO) di akun Google Forms / Google Drive Anda (
              <strong>{user.email}</strong>) dan menghasilkan link publikasi siap sebar.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmCreateFormOpen(false)}
                className="min-h-[42px] px-5 py-2 rounded-full border border-[#173E2C]/25 text-[#173E2C] text-sm font-semibold hover:bg-[#E5ECD9]/60 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeCreateGoogleForm}
                className="min-h-[42px] px-6 py-2 rounded-full bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold hover:bg-[#0F2B1E] transition-colors cursor-pointer"
              >
                Ya, Buat Formulir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Firestore Response */}
      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 bg-[#0F2B1E]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-[#FCF9F2] border border-[#173E2C]/15 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3
              id="confirm-delete-title"
              className="font-editorial text-2xl font-semibold text-[#173E2C] mb-2"
            >
              Hapus Respons Survei?
            </h3>
            <p className="text-sm text-[#173E2C]/80 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus respons dengan kode{' '}
              <span className="font-mono">{confirmDeleteId}</span> secara permanen? Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="min-h-[42px] px-5 py-2 rounded-full border border-[#173E2C]/25 text-[#173E2C] text-sm font-semibold hover:bg-[#E5ECD9]/60 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDeleteResponse}
                className="min-h-[42px] px-6 py-2 rounded-full bg-red-800 text-white text-sm font-semibold hover:bg-red-900 transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
