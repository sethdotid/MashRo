import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  buildConstellationSvgPath,
  CONSTELLATION_PATTERNS,
  ConstellationCustomPoint,
  ConstellationPattern,
  DEFAULT_CONSTELLATION_LEVEL_LABELS,
  getConstellationPoints,
  getLitStarCount,
} from '../utils/constellation';

export interface ConstellationIndicatorProps {
  id: string;
  label: string;
  description?: string;
  value: number | null;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  pattern?: ConstellationPattern;
  customPoints?: ConstellationCustomPoint[];
  levelLabels?: Record<number, string>;
  lowLabel?: string;
  highLabel?: string;
  hasError?: boolean;
  allowPatternCustomization?: boolean;
}

const AMBIENT_SKY_SPECKS = [
  { x: 7, y: 20, size: 1.4 },
  { x: 21, y: 74, size: 1.2 },
  { x: 39, y: 16, size: 1.5 },
  { x: 58, y: 78, size: 1.2 },
  { x: 77, y: 18, size: 1.4 },
  { x: 93, y: 30, size: 1.2 },
  { x: 47, y: 82, size: 1.1 },
];

function StarGlyph({ filled, className = 'w-5 h-5' }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1.35 : 1.7}
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.2L14.7 8.4L21.4 9.1L16.3 13.6L17.8 20.2L12 16.7L6.2 20.2L7.7 13.6L2.6 9.1L9.3 8.4L12 2.2Z" />
    </svg>
  );
}

/**
 * Interactive 'Constellation Indicator' component that arranges rating inputs
 * along a customizable star constellation that illuminates as satisfaction increases.
 */
export function ConstellationIndicator({
  id,
  label,
  description,
  value,
  onChange,
  min = 1,
  max = 5,
  pattern = 'cassava-crown',
  customPoints,
  levelLabels,
  lowLabel,
  highLabel,
  hasError = false,
  allowPatternCustomization = true,
}: ConstellationIndicatorProps) {
  const [activePattern, setActivePattern] = useState<ConstellationPattern>(pattern);

  const resolvedLowLabel =
    lowLabel ?? (min === 0 && max === 10 ? '0 · Tidak Mungkin Sama Sekali' : `${min} · Sangat Tidak Puas`);
  const resolvedHighLabel =
    highLabel ?? (min === 0 && max === 10 ? '10 · Sangat Mungkin' : `${max} · Sangat Puas`);

  const points = getConstellationPoints(min, max, activePattern, customPoints);
  const totalLevels = points.length;
  const isSpatialMode = totalLevels <= 6;
  const litCount = getLitStarCount(min, max, value);

  const fullPath = buildConstellationSvgPath(points);
  const litPath = buildConstellationSvgPath(points, litCount);

  const activeLevelText = (() => {
    if (value === null) {
      return isSpatialMode ? `RASI BINTANG ${min}–${max}` : `KONSTELASI ${min}–${max}`;
    }
    const customLabel = levelLabels?.[value];
    if (customLabel) return `${value}/${max} · ${customLabel}`;
    if (min === 1 && max === 5 && DEFAULT_CONSTELLATION_LEVEL_LABELS[value]) {
      return `${value}/5 · ${DEFAULT_CONSTELLATION_LEVEL_LABELS[value]}`;
    }
    return `SKOR ${value}/${max}`;
  })();

  const getOptionAriaLabel = (num: number) => {
    const customLabel = levelLabels?.[num];
    if (customLabel) return `${label}: ${num} dari ${max} (${customLabel})`;
    if (min === 1 && max === 5 && DEFAULT_CONSTELLATION_LEVEL_LABELS[num]) {
      return `${label}: ${num} bintang dari ${max} (${DEFAULT_CONSTELLATION_LEVEL_LABELS[num]})`;
    }
    return `${label}: ${num} dari ${max}`;
  };

  return (
    <div
      id={`field-${id}`}
      data-testid={`constellation-indicator-${id}`}
      data-pattern={activePattern}
      className={`py-5 border-b border-[#5C3D28]/12 last:border-b-0 ${
        hasError ? 'bg-[#D96B27]/[0.06] -mx-4 px-4 rounded-2xl' : ''
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 mb-3.5">
        <div className="flex-1 min-w-[240px]">
          <p className="text-base font-semibold text-[#173E2C]">
            {label}
            <span className="text-[#D96B27] whitespace-nowrap" aria-hidden="true">
              &nbsp;*
            </span>
          </p>
          {description && (
            <p className="text-sm text-[#5C3D28]/80 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#5C3D28]/80 tabular-nums pt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D6A23A]" aria-hidden="true" />
          <span>{activeLevelText}</span>
        </span>
      </div>

      {/* Celestial Observatory Frame */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#173E2C] border border-[#0F2B1E] text-[#F7F1E3] shadow-inner">
        {/* Observatory Toolbar: Constellation Name & Pattern Customizer */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#F7F1E3]/12">
          <span className="font-mono text-[11px] tracking-wide text-[#C9D8B5] tabular-nums">
            {isSpatialMode ? 'PETA BINTANG' : 'BUSUR REKOMENDASI'} ·{' '}
            <span className="text-[#D6A23A]">
              {CONSTELLATION_PATTERNS.find((p) => p.id === activePattern)?.label.toUpperCase()}
            </span>
          </span>

          {allowPatternCustomization && (
            <div
              role="group"
              aria-label={`Pilih bentuk rasi bintang untuk ${label}`}
              className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#0F2B1E]/90 border border-[#F7F1E3]/12"
            >
              {CONSTELLATION_PATTERNS.map((item) => {
                const isActivePattern = activePattern === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isActivePattern}
                    onClick={() => setActivePattern(item.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#D6A23A] ${
                      isActivePattern
                        ? 'bg-[#D6A23A] text-[#0F2B1E] font-semibold'
                        : 'text-[#F7F1E3]/80 hover:text-[#F7F1E3] hover:bg-[#23533C]/70'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Spatial Constellation Canvas */}
        <div
          className={`relative w-full rounded-xl bg-[#0F2B1E]/95 border ${
            hasError ? 'border-[#D96B27]/75' : 'border-[#D6A23A]/20'
          } overflow-hidden ${isSpatialMode ? 'h-48 sm:h-52' : 'h-28 sm:h-32 mb-3'}`}
        >
          {/* Connecting Constellation SVG Layer */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {/* Subtle meridian guide lines */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="rgba(201, 216, 181, 0.08)"
              strokeWidth="0.4"
              strokeDasharray="1.5 2.5"
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="rgba(201, 216, 181, 0.08)"
              strokeWidth="0.4"
              strokeDasharray="1.5 2.5"
            />

            {/* Ambient tiny sky specks */}
            {AMBIENT_SKY_SPECKS.map((speck, idx) => (
              <circle
                key={idx}
                cx={speck.x}
                cy={speck.y}
                r={speck.size * 0.35}
                fill="rgba(247, 241, 227, 0.22)"
              />
            ))}

            {/* Base unlit constellation guide path */}
            {fullPath && (
              <path
                d={fullPath}
                fill="none"
                stroke="rgba(201, 216, 181, 0.28)"
                strokeWidth="0.85"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Illuminated Golden Yellow constellation path */}
            {litCount > 1 && litPath && (
              <path
                d={litPath}
                fill="none"
                stroke="#D6A23A"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {isSpatialMode ? (
            /* Direct Spatial Interactive Constellation Star Buttons (1–5) */
            <div role="radiogroup" aria-label={label} className="relative w-full h-full">
              {points.map((pt) => {
                const isSelected = value === pt.value;
                const isLit = value !== null && pt.value <= value;
                return (
                  <button
                    key={pt.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={getOptionAriaLabel(pt.value)}
                    onClick={() => onChange(pt.value)}
                    style={{
                      left: `${pt.x}%`,
                      top: `${pt.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-[46px] h-[46px] sm:w-[54px] sm:h-[54px] rounded-full border flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FCF9F2] ${
                      isSelected
                        ? 'bg-[#D96B27] border-[#FCF9F2] text-[#FCF9F2] scale-110 shadow-[0_0_0_4px_rgba(214,162,58,0.38)] z-20'
                        : isLit
                        ? 'bg-[#23533C] border-[#D6A23A] text-[#D6A23A] hover:scale-105 z-10'
                        : hasError
                        ? 'bg-[#173E2C] border-[#D96B27]/80 text-[#F7F1E3]/80 hover:border-[#D6A23A] hover:text-[#D6A23A]'
                        : 'bg-[#173E2C] border-[#C9D8B5]/35 text-[#F7F1E3]/75 hover:border-[#D6A23A] hover:text-[#D6A23A]'
                    }`}
                  >
                    <StarGlyph filled={isLit} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    <span className="font-mono text-[11px] font-bold tabular-nums leading-none mt-0.5">
                      {pt.value}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Illuminated Star Nodes inside the Sky Canvas for 0–10 Scale */
            <div aria-hidden="true" className="relative w-full h-full pointer-events-none">
              {points.map((pt) => {
                const isSelected = value === pt.value;
                const isLit = value !== null && pt.value <= value;
                return (
                  <span
                    key={pt.value}
                    style={{
                      left: `${pt.x}%`,
                      top: `${pt.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-transform duration-150 motion-reduce:transition-none ${
                      isSelected
                        ? 'bg-[#D96B27] text-[#FCF9F2] scale-125 ring-2 ring-[#D6A23A] z-20'
                        : isLit
                        ? 'bg-[#23533C] text-[#D6A23A] z-10'
                        : 'bg-transparent text-[#C9D8B5]/45'
                    }`}
                  >
                    <StarGlyph filled={isLit} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Accessible Keypad Row for Larger Ranges (e.g., 0–10 NPS) */}
        {!isSpatialMode && (
          <div
            role="radiogroup"
            aria-label={label}
            className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2"
          >
            {points.map((pt) => {
              const active = value === pt.value;
              const lit = value !== null && pt.value <= value;
              return (
                <button
                  key={pt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={getOptionAriaLabel(pt.value)}
                  onClick={() => onChange(pt.value)}
                  className={`min-h-[44px] rounded-xl border font-mono text-sm font-semibold tabular-nums cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6A23A] ${
                    active
                      ? 'bg-[#D96B27] border-[#FCF9F2] text-[#FCF9F2] shadow-sm ring-2 ring-[#D6A23A]/50'
                      : lit
                      ? 'bg-[#23533C] border-[#D6A23A] text-[#FCF9F2]'
                      : hasError
                      ? 'bg-[#0F2B1E] border-[#D96B27]/60 text-[#F7F1E3] hover:border-[#D6A23A]'
                      : 'bg-[#0F2B1E] border-[#C9D8B5]/25 text-[#F7F1E3]/85 hover:border-[#D6A23A] hover:bg-[#23533C]/60'
                  }`}
                >
                  {pt.value}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected level readout strip inside observatory */}
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] font-mono text-[#C9D8B5]/85 tabular-nums">
          <span>
            {value !== null
              ? `${litCount} dari ${totalLevels} bintang menyala`
              : `Ketuk bintang untuk memilih skor ${min}–${max}`}
          </span>
          {value !== null && (
            <span className="text-[#D6A23A] font-semibold">
              {isSpatialMode && DEFAULT_CONSTELLATION_LEVEL_LABELS[value]
                ? DEFAULT_CONSTELLATION_LEVEL_LABELS[value]
                : `Bintang #${value}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-[#5C3D28]/75">
        <span>{resolvedLowLabel}</span>
        <span>{resolvedHighLabel}</span>
      </div>
    </div>
  );
}
