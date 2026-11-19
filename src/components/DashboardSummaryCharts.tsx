import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardAnalytics } from '../utils/surveyLogic';

type BarMetricMode = 'pilar' | 'layanan' | 'produk';
type PieMetricMode = 'harga' | 'kepuasan' | 'beli_ulang' | 'aktivitas';

const MASHRO_CHART_COLORS = ['#173E2C', '#3A6B52', '#D6A23A', '#8AA67A', '#B7C9A2'];

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: {
    label?: string;
    average?: number;
    count?: number;
    percentage?: number;
  };
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-[#FCF9F2] border border-[#173E2C]/20 rounded-xl px-3.5 py-2.5 shadow-md text-xs text-[#173E2C]">
      <p className="font-semibold mb-1">{item.label}</p>
      <p className="font-mono tabular-nums">
        Rata-rata: <strong>{Number(item.average ?? 0).toFixed(1)}</strong> / 5.0
      </p>
      {typeof item.count === 'number' && (
        <p className="text-[#173E2C]/65 font-mono tabular-nums">Responden: n={item.count}</p>
      )}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-[#FCF9F2] border border-[#173E2C]/20 rounded-xl px-3.5 py-2.5 shadow-md text-xs text-[#173E2C]">
      <p className="font-semibold mb-1">{item.label}</p>
      <p className="font-mono tabular-nums">
        {item.count ?? 0} respons ({item.percentage ?? 0}%)
      </p>
    </div>
  );
}

export function DashboardSummaryCharts({ stats }: { stats: DashboardAnalytics }) {
  const [barMode, setBarMode] = useState<BarMetricMode>('pilar');
  const [pieMode, setPieMode] = useState<PieMetricMode>('harga');

  const barData = useMemo(() => {
    if (barMode === 'pilar') {
      return stats.categoryAverages.map((c) => ({
        label: c.label,
        average: c.average,
        count: c.count,
      }));
    }
    if (barMode === 'layanan') {
      return stats.attributeAverages
        .filter((a) => a.category === 'Layanan Pre-Order')
        .map((a) => ({
          label: a.label
            .replace('Kecepatan Respons Penjual', 'Respons Penjual')
            .replace('Kemudahan Pemesanan', 'Kemudahan Pesan'),
          average: a.average,
          count: a.count,
        }));
    }
    return stats.attributeAverages
      .filter((a) => a.category === 'Produk')
      .map((a) => ({
        label: a.label
          .replace('Rasa ', '')
          .replace('Perpaduan Rasa Keseluruhan', 'Perpaduan Rasa'),
        average: a.average,
        count: a.count,
      }));
  }, [barMode, stats]);

  const pieData = useMemo(() => {
    const source =
      pieMode === 'harga'
        ? stats.priceDistribution
        : pieMode === 'kepuasan'
        ? stats.overallSatisfactionDistribution
        : pieMode === 'beli_ulang'
        ? stats.repurchaseDistribution
        : stats.activityDistribution;
    return source.filter((item) => item.count > 0);
  }, [pieMode, stats]);

  return (
    <section
      aria-label="Ringkasan Visual Metrik Utama"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* Bar Chart Card (7 cols) */}
      <div className="lg:col-span-7 bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-6 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#D6A23A] mb-1">
              GRAFIK BATANG METRIK UTAMA
            </p>
            <h2 className="font-editorial text-2xl font-semibold text-[#173E2C]">
              Skor Kualitas Produk & Layanan
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Pilih kelompok metrik grafik batang"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F1E3] rounded-xl border border-[#173E2C]/10"
          >
            {(
              [
                { id: 'pilar', label: 'Pilar Utama' },
                { id: 'layanan', label: 'Kualitas Layanan' },
                { id: 'produk', label: 'Produk' },
              ] as { id: BarMetricMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={barMode === tab.id}
                onClick={() => setBarMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  barMode === tab.id
                    ? 'bg-[#173E2C] text-[#F7F1E3]'
                    : 'text-[#173E2C]/75 hover:text-[#173E2C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {barData.length === 0 ? (
          <div className="flex-1 min-h-[260px] flex items-center justify-center text-center px-4 text-sm text-[#173E2C]/65 bg-white/60 rounded-2xl border border-[#173E2C]/10">
            Belum ada responden yang menilai layanan Pre-Order pada kategori ini.
          </div>
        ) : (
          <div className="w-full h-[280px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 8, right: 12, left: -16, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(23, 62, 44, 0.1)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#173E2C', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(23, 62, 44, 0.2)' }}
                  tickLine={false}
                  interval={0}
                  angle={barData.length > 5 ? -18 : 0}
                  textAnchor={barData.length > 5 ? 'end' : 'middle'}
                  height={barData.length > 5 ? 56 : 32}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tick={{ fill: '#173E2C', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(201, 216, 181, 0.25)' }} />
                <Bar dataKey="average" radius={[8, 8, 0, 0]} maxBarSize={52}>
                  {barData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={idx % 3 === 2 ? '#D6A23A' : idx % 2 === 1 ? '#3A6B52' : '#173E2C'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pie / Donut Chart Card (5 cols) */}
      <div className="lg:col-span-5 bg-[#FCF9F2] border border-[#173E2C]/12 rounded-3xl p-6 flex flex-col">
        <div className="mb-4">
          <p className="text-xs font-semibold tracking-wider text-[#D6A23A] mb-1">
            DIAGRAM LINGKARAN DISTRIBUSI
          </p>
          <h2 className="font-editorial text-2xl font-semibold text-[#173E2C] mb-3">
            Proporsi Responden
          </h2>

          <div
            role="tablist"
            aria-label="Pilih distribusi diagram lingkaran"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F1E3] rounded-xl border border-[#173E2C]/10"
          >
            {(
              [
                { id: 'harga', label: 'Harga' },
                { id: 'kepuasan', label: 'Kepuasan' },
                { id: 'beli_ulang', label: 'Beli Ulang' },
                { id: 'aktivitas', label: 'Aktivitas' },
              ] as { id: PieMetricMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={pieMode === tab.id}
                onClick={() => setPieMode(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  pieMode === tab.id
                    ? 'bg-[#173E2C] text-[#F7F1E3]'
                    : 'text-[#173E2C]/75 hover:text-[#173E2C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[200px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={3}
                stroke="none"
              >
                {pieData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={MASHRO_CHART_COLORS[idx % MASHRO_CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Clean Tabular Legend */}
        <ul className="mt-3 pt-3 border-t border-[#173E2C]/10 space-y-1.5 text-xs">
          {pieData.map((entry, idx) => (
            <li key={entry.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{
                    backgroundColor: MASHRO_CHART_COLORS[idx % MASHRO_CHART_COLORS.length],
                  }}
                />
                <span className="text-[#173E2C]/85 truncate">{entry.label}</span>
              </span>
              <span className="font-mono font-semibold text-[#173E2C] tabular-nums shrink-0">
                {entry.count} ({entry.percentage}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
