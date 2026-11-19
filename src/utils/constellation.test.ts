import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConstellationSvgPath,
  CONSTELLATION_PATTERNS,
  getConstellationPoints,
  getLitStarCount,
} from './constellation';

test('getConstellationPoints generates 5 well-spaced bounded coordinates for all patterns', () => {
  for (const patternMeta of CONSTELLATION_PATTERNS) {
    const pts = getConstellationPoints(1, 5, patternMeta.id);
    assert.equal(pts.length, 5);
    assert.deepEqual(
      pts.map((p) => p.value),
      [1, 2, 3, 4, 5]
    );
    for (const pt of pts) {
      assert.ok(pt.x >= 8 && pt.x <= 92, `x out of bounds for ${patternMeta.id}: ${pt.x}`);
      assert.ok(pt.y >= 18 && pt.y <= 82, `y out of bounds for ${patternMeta.id}: ${pt.y}`);
    }
    for (let i = 1; i < pts.length; i++) {
      assert.ok(pts[i].x - pts[i - 1].x >= 18, 'horizontal star gap must stay >= 18%');
    }
  }
});

test('getConstellationPoints supports 0-10 arc and custom point overrides clamped safely', () => {
  const arcPts = getConstellationPoints(0, 10, 'arc');
  assert.equal(arcPts.length, 11);
  assert.equal(arcPts[0].value, 0);
  assert.equal(arcPts[10].value, 10);
  assert.ok(arcPts[5].y < arcPts[0].y, 'arc center star should peak higher than edge star');

  const customPts = getConstellationPoints(1, 5, 'cassava-crown', [
    { value: 3, x: 2, y: 99, astroLabel: 'CUSTOM-3' },
  ]);
  assert.equal(customPts[2].x, 8);
  assert.equal(customPts[2].y, 82);
  assert.equal(customPts[2].astroLabel, 'CUSTOM-3');
});

test('getLitStarCount and buildConstellationSvgPath handle null, partial, and full selections', () => {
  const pts = getConstellationPoints(1, 5, 'cassava-crown');
  assert.equal(getLitStarCount(1, 5, null), 0);
  assert.equal(getLitStarCount(1, 5, 1), 1);
  assert.equal(getLitStarCount(1, 5, 4), 4);
  assert.equal(getLitStarCount(0, 10, 0), 1);
  assert.equal(getLitStarCount(0, 10, 10), 11);

  assert.equal(buildConstellationSvgPath(pts, 0), '');
  assert.equal(buildConstellationSvgPath(pts, 1), 'M 12 68');
  assert.equal(buildConstellationSvgPath(pts, 3), 'M 12 68 L 31 30 L 50 54');
});
