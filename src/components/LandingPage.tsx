import React from 'react';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { BotanicalSprig, ImageWithFallback, StarOrnament } from './BrandMotifs';

interface LandingPageProps {
  onStartSurvey: () => void;
}

const BOWL_COMPONENTS = [
  {
    name: 'Mashed Cassava',
    detail: 'Singkong pilihan yang ditumbuk halus hingga lembut dan gurih alami.',
  },
  {
    name: 'Pan-Seared Chicken',
    detail: 'Dada ayam panggang bumbu rempah dengan tekstur juicy dan bernutrisi.',
  },
  {
    name: 'Pumpkin Puree Sauce',
    detail: 'Saus labu kuning lembut bercita rasa manis-gurih yang menyeimbangkan sajian.',
  },
  {
    name: 'Steamed Green Beans & Carrots',
    detail: 'Buncis dan wortel kukus segar untuk kerenyahan serta serat harian.',
  },
];

const SURVEY_OUTLINE = [
  {
    step: '01',
    title: 'Profil Pengalaman Awal',
    desc: 'Konfirmasi apakah Anda sudah mencicipi MASHRO serta aktivitas harian Anda.',
  },
  {
    step: '02',
    title: 'Rasa, Aroma & Kemasan',
    desc: 'Penilaian tiap komponen sajian, ukuran porsi, dan kepraktisan wadah bowl.',
  },
  {
    step: '03',
    title: 'Harga & Layanan Pre-Order',
    desc: 'Evaluasi kisaran harga usulan Rp20.000–Rp25.000 dan pengalaman pemesanan.',
  },
];

export function LandingPage({ onStartSurvey }: LandingPageProps) {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-12 sm:pt-12">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between py-2">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-medium tracking-wider text-[#173E2C]/75 mb-4">
              <StarOrnament className="w-3.5 h-3.5 text-[#D6A23A]" />
              <span>MASHRO</span>
              <span aria-hidden="true">·</span>
              <span>Sajian Sehat Single-Serving</span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.08] text-[#173E2C] text-balance mb-5">
              MASHRO – Survei Pengalaman dan Kepuasan Pelanggan
            </h1>

            <p className="font-editorial italic text-xl sm:text-2xl text-[#173E2C]/85 mb-6">
              Bantu kami menyempurnakan setiap sajian MASHRO.
            </p>

            <p className="text-base text-[#173E2C]/80 leading-relaxed max-w-xl mb-8">
              Survei ini ditujukan khusus bagi Anda yang telah mencicipi semangkuk sajian sehat
              MASHRO—perpaduan mashed cassava, pan-seared chicken, pumpkin puree sauce, serta
              buncis dan wortel kukus. Masukan jujur Anda membantu kami menyempurnakan rasa,
              porsi, kemasan, kisaran harga, dan layanan pre-order.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#173E2C]/80 border-y border-[#173E2C]/12 py-3.5">
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D6A23A]" aria-hidden="true" />
                <span>Estimasi waktu: 3–5 menit</span>
              </span>
              <span aria-hidden="true" className="hidden sm:inline text-[#173E2C]/30">
                ·
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#173E2C]/70" aria-hidden="true" />
                <span>Respon anonim untuk evaluasi produk</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="button"
                onClick={onStartSurvey}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl bg-[#173E2C] text-[#F7F1E3] text-base font-semibold inline-flex items-center justify-center gap-3 hover:bg-[#0F2B1E] transition-colors shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173E2C]"
              >
                <span>Mulai Survei</span>
                <ArrowRight className="w-4 h-4 text-[#D96B27]" aria-hidden="true" />
              </button>
              <span className="text-xs text-[#5C3D28]/75">
                Tanpa perlu membuat akun atau mengisi nomor telepon.
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full min-h-[280px] sm:min-h-[380px] rounded-3xl overflow-hidden bg-[#E5ECD9]/60 border border-[#173E2C]/10 shadow-sm relative">
            <ImageWithFallback
              src="/src/assets/images/mashro_hero_bowl_1795027773941.jpg"
              alt="Semangkuk sajian sehat MASHRO berisi mashed cassava, pan-seared chicken, saus labu kuning, buncis dan wortel kukus"
              fallbackTitle="MASHRO Healthy Meal Bowl"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="my-12 sm:my-16 flex items-center justify-center gap-4">
        <div className="h-px flex-1 bg-[#173E2C]/12" />
        <BotanicalSprig className="w-24 h-10 text-[#173E2C]/35" />
        <div className="h-px flex-1 bg-[#173E2C]/12" />
      </div>

      {/* Komposisi Sajian */}
      <section id="tentang-sajian" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="rounded-3xl overflow-hidden border border-[#173E2C]/10 bg-[#FCF9F2] shadow-sm aspect-[4/3]">
            <ImageWithFallback
              src="/src/assets/images/mashro_botanical_ingredients_1795027774863.jpg"
              alt="Bahan segar alami MASHRO: labu kuning, singkong, buncis, wortel, dan daun sage"
              fallbackTitle="Bahan Alami Pilihan MASHRO"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-7 order-1 lg:order-2">
          <p className="text-xs font-semibold tracking-wider text-[#D6A23A] mb-2">
            KOMPOSISI SAJIAN MASHRO
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#173E2C] mb-6 text-balance">
            Empat Komponen Utama dalam Satu Mangkuk Seimbang
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BOWL_COMPONENTS.map((item, idx) => (
              <div
                key={item.name}
                className="p-5 rounded-2xl bg-[#FCF9F2] border border-[#173E2C]/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[#D6A23A] tabular-nums">
                    0{idx + 1}
                  </span>
                  <StarOrnament className="w-3 h-3 text-[#D6A23A]/70" />
                </div>
                <h3 className="font-editorial text-xl font-semibold text-[#173E2C] mb-1.5">
                  {item.name}
                </h3>
                <p className="text-sm text-[#173E2C]/75 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur Survei & Privasi */}
      <section id="alur-survei" className="mt-14 sm:mt-16 pt-12 border-t border-[#173E2C]/12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#D6A23A] mb-2">
              ALUR PENGISIAN
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#173E2C]">
              Ringkas, Terstruktur, dan Adaptif
            </h2>
          </div>
          <p className="text-sm text-[#173E2C]/70 max-w-md">
            Pertanyaan menyesuaikan pengalaman Anda—bagian evaluasi pre-order hanya tampil jika
            Anda pernah memesan langsung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SURVEY_OUTLINE.map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-2xl bg-[#FCF9F2] border border-[#5C3D28]/15"
            >
              <p className="font-mono text-xs font-semibold text-[#D96B27] mb-3 tabular-nums">
                Stasiun {item.step}
              </p>
              <h3 className="font-editorial text-2xl font-semibold text-[#173E2C] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[#5C3D28]/80 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div
          id="privasi"
          className="mt-8 p-6 rounded-2xl bg-[#E5ECD9]/60 border border-[#5C3D28]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h3 className="font-editorial text-xl font-semibold text-[#173E2C]">
              Pemberitahuan Privasi Responden
            </h3>
            <p className="text-sm text-[#173E2C]/80 leading-relaxed max-w-2xl">
              Kami tidak meminta nama lengkap, nomor telepon, maupun alamat rumah. Seluruh jawaban
              disimpan secara anonim khusus untuk evaluasi dan peningkatan kualitas produk MASHRO.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartSurvey}
            className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-[#173E2C] text-[#F7F1E3] text-sm font-semibold hover:bg-[#0F2B1E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Mulai Survei Sekarang
          </button>
        </div>
      </section>
    </main>
  );
}
