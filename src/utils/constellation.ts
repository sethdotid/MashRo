export type ConstellationPattern = 'cassava-crown' | 'dipper' | 'arc';

export interface ConstellationPoint {
  value: number;
  x: number;
  y: number;
  astroLabel: string;
}

export interface ConstellationCustomPoint {
  value: number;
  x: number;
  y: number;
  astroLabel?: string;
}

export interface ConstellationPatternMeta {
  id: ConstellationPattern;
  label: string;
  description: string;
}

export const CONSTELLATION_PATTERNS: ConstellationPatternMeta[] = [
  {
    id: 'cassava-crown',
    label: 'Mahkota',
    description: 'Formasi mahkota bintang lima puncak',
  },
  {
    id: 'dipper',
    label: 'Biduk',
    description: 'Formasi rasi biduk klasik',
  },
  {
    id: 'arc',
    label: 'Busur',
    description: 'Formasi busur cakrawala',
  },
];

export const DEFAULT_CONSTELLATION_LEVEL_LABELS: Record<number, string> = {
  1: 'Redup',
  2: 'Mulai Terlihat',
  3: 'Cukup Terang',
  4: 'Bersinar',
  5: 'Rasi Sempurna',
};

const PRESET_5_COORDS: Record<ConstellationPattern, Array<{ x: number; y: number }>> = {
  'cassava-crown': [
    { x: 12, y: 68 },
    { x: 31, y: 30 },
    { x: 50, y: 54 },
    { x: 69, y: 24 },
    { x: 88, y: 58 },
  ],
  dipper: [
    { x: 12, y: 26 },
    { x: 31, y: 42 },
    { x: 50, y: 70 },
    { x: 69, y: 74 },
    { x: 88, y: 34 },
  ],
  arc: [
    { x: 12, y: 72 },
    { x: 31, y: 38 },
    { x: 50, y: 22 },
    { x: 69, y: 38 },
    { x: 88, y: 72 },
  ],
};

function clampCoord(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(val * 10) / 10));
}

function formatAstroLabel(value: number, index: number): string {
  const prefix = value < 10 ? `0${value}` : String(value);
  return index === 0 && value === 0 ? 'S-00' : `S-${prefix}`;
}

/**
 * Generates bounded percentage coordinates (x in [8..92], y in [18..82])
 * for an interactive constellation rating control.
 */
export function getConstellationPoints(
  min: number,
  max: number,
  pattern: ConstellationPattern = 'cassava-crown',
  customPoints?: ConstellationCustomPoint[]
): ConstellationPoint[] {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const total = safeMax - safeMin + 1;
  const customByValue = new Map<number, ConstellationCustomPoint>();

  if (customPoints) {
    for (const pt of customPoints) {
      customByValue.set(pt.value, pt);
    }
  }

  const points: ConstellationPoint[] = [];

  for (let i = 0; i < total; i++) {
    const value = safeMin + i;
    const override = customByValue.get(value);
    if (override) {
      points.push({
        value,
        x: clampCoord(override.x, 8, 92),
        y: clampCoord(override.y, 18, 82),
        astroLabel: override.astroLabel ?? formatAstroLabel(value, i),
      });
      continue;
    }

    if (total === 5) {
      const preset = PRESET_5_COORDS[pattern][i];
      points.push({
        value,
        x: preset.x,
        y: preset.y,
        astroLabel: formatAstroLabel(value, i),
      });
      continue;
    }

    const ratio = total <= 1 ? 0.5 : i / (total - 1);
    const x = clampCoord(9 + ratio * 82, 8, 92);
    let y = 50;

    if (pattern === 'arc') {
      const normalized = (ratio - 0.5) * 2; // -1..1
      y = 22 + normalized * normalized * 52;
    } else if (pattern === 'dipper') {
      if (ratio <= 0.45) {
        y = 26 + (ratio / 0.45) * 44;
      } else if (ratio <= 0.78) {
        y = 70 + Math.sin(((ratio - 0.45) / 0.33) * Math.PI) * 6;
      } else {
        y = 70 - ((ratio - 0.78) / 0.22) * 38;
      }
    } else {
      // 'cassava-crown': alternating celestial crown wave
      const wave = i % 2 === 0 ? 18 : -16;
      const archBias = Math.abs(ratio - 0.5) * 24;
      y = 44 + wave + archBias;
    }

    points.push({
      value,
      x,
      y: clampCoord(y, 18, 82),
      astroLabel: formatAstroLabel(value, i),
    });
  }

  return points;
}

/**
 * Returns how many stars from the start of the constellation should be lit.
 */
export function getLitStarCount(min: number, max: number, value: number | null): number {
  if (value === null || Number.isNaN(value)) return 0;
  const total = Math.max(1, max - min + 1);
  return Math.min(total, Math.max(0, value - min + 1));
}

/**
 * Builds an SVG path string connecting the first `pointCount` constellation points.
 */
export function buildConstellationSvgPath(
  points: ConstellationPoint[],
  pointCount: number = points.length
): string {
  const count = Math.min(points.length, Math.max(0, pointCount));
  if (count === 0) return '';
  return points
    .slice(0, count)
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');
}
