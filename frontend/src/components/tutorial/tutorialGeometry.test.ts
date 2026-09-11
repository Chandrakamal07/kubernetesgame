import assert from 'node:assert';
import {
  clampToViewport,
  calculateCoachmarkPlacement,
  calculateArrowGeometry,
  VIEWPORT_MARGIN,
  TARGET_PADDING,
} from './tutorialGeometry.ts';
import type {
  TargetRect,
  ViewportSize,
} from './tutorialGeometry.ts';

console.log('--- Running Tutorial Geometry Unit Tests ---');

// Test 1: clampToViewport keeps box completely inside safe viewport bounds
{
  const viewport: ViewportSize = { width: 1920, height: 1080 };
  const card = { width: 320, height: 200 };

  // Case: coordinate too far left/top
  const clampedNeg = clampToViewport({ left: -50, top: -100 }, card, viewport);
  assert.strictEqual(clampedNeg.left, VIEWPORT_MARGIN);
  assert.strictEqual(clampedNeg.top, VIEWPORT_MARGIN);

  // Case: coordinate too far right/bottom
  const clampedOver = clampToViewport({ left: 2000, top: 1200 }, card, viewport);
  assert.strictEqual(clampedOver.left, 1920 - 320 - VIEWPORT_MARGIN);
  assert.strictEqual(clampedOver.top, 1080 - 200 - VIEWPORT_MARGIN);

  console.log('✓ clampToViewport bounds test passed');
}

// Test 2: calculateCoachmarkPlacement - Center placement when no target
{
  const viewport: ViewportSize = { width: 1280, height: 720 };
  const placement = calculateCoachmarkPlacement(null, 300, 200, viewport, 'center');
  assert.strictEqual(placement.placement, 'center');
  assert.strictEqual(placement.left, (1280 - 300) / 2);
  assert.strictEqual(placement.top, (720 - 200) / 2);
  console.log('✓ calculateCoachmarkPlacement center test passed');
}

// Test 3: calculateCoachmarkPlacement - Target near top (e.g. HUD), placement below target
{
  const viewport: ViewportSize = { width: 1920, height: 1080 };
  const hudTarget: TargetRect = {
    top: 10,
    left: 800,
    width: 200,
    height: 40,
    bottom: 50,
    right: 1000,
    centerX: 900,
    centerY: 30,
  };

  const placement = calculateCoachmarkPlacement(hudTarget, 300, 200, viewport, 'bottom');
  assert.strictEqual(placement.placement, 'bottom');
  assert.strictEqual(placement.top, 50 + 20); // target.bottom + GAP
  assert.ok(placement.left >= VIEWPORT_MARGIN);
  assert.ok(placement.left + 300 <= viewport.width - VIEWPORT_MARGIN);
  console.log('✓ calculateCoachmarkPlacement HUD bottom test passed');
}

// Test 4: calculateCoachmarkPlacement - Target near bottom (e.g. Terminal input), placement above target
{
  const viewport: ViewportSize = { width: 1920, height: 1080 };
  const terminalTarget: TargetRect = {
    top: 980,
    left: 50,
    width: 1200,
    height: 50,
    bottom: 1030,
    right: 1250,
    centerX: 650,
    centerY: 1005,
  };

  const placement = calculateCoachmarkPlacement(terminalTarget, 320, 220, viewport, 'top');
  assert.strictEqual(placement.placement, 'top');
  assert.strictEqual(placement.top, 980 - 20 - 220); // target.top - GAP - cardHeight
  assert.ok(placement.top >= VIEWPORT_MARGIN);
  console.log('✓ calculateCoachmarkPlacement Terminal top test passed');
}

// Test 5: calculateArrowGeometry - Coachmark ABOVE target
{
  const coachmark = {
    left: 500,
    right: 800,
    top: 200,
    bottom: 400,
    width: 300,
    height: 200,
  } as DOMRect;

  const target: TargetRect = {
    top: 500,
    bottom: 600,
    left: 550,
    right: 750,
    width: 200,
    height: 100,
    centerX: 650,
    centerY: 550,
  };

  const arrow = calculateArrowGeometry(coachmark, target);
  assert.ok(arrow !== null);
  assert.strictEqual(arrow.startY, 400); // bottom of coachmark
  assert.strictEqual(arrow.endY, 500 - TARGET_PADDING - 4); // top of target spotlight
  assert.ok(arrow.path.startsWith('M'));
  console.log('✓ calculateArrowGeometry above->below test passed');
}

// Test 6: calculateArrowGeometry - Coachmark BELOW target
{
  const coachmark = {
    left: 500,
    right: 800,
    top: 600,
    bottom: 800,
    width: 300,
    height: 200,
  } as DOMRect;

  const target: TargetRect = {
    top: 200,
    bottom: 300,
    left: 550,
    right: 750,
    width: 200,
    height: 100,
    centerX: 650,
    centerY: 250,
  };

  const arrow = calculateArrowGeometry(coachmark, target);
  assert.ok(arrow !== null);
  assert.strictEqual(arrow.startY, 600); // top of coachmark
  assert.strictEqual(arrow.endY, 300 + TARGET_PADDING + 4); // bottom of target spotlight
  assert.ok(arrow.path.startsWith('M'));
  console.log('✓ calculateArrowGeometry below->above test passed');
}

// Test 7: calculateArrowGeometry - Coachmark to the LEFT of target
{
  const coachmark = {
    left: 100,
    right: 400,
    top: 300,
    bottom: 500,
    width: 300,
    height: 200,
  } as DOMRect;

  const target: TargetRect = {
    top: 320,
    bottom: 480,
    left: 500,
    right: 800,
    width: 300,
    height: 160,
    centerX: 650,
    centerY: 400,
  };

  const arrow = calculateArrowGeometry(coachmark, target);
  assert.ok(arrow !== null);
  assert.strictEqual(arrow.startX, 400); // right of coachmark
  assert.strictEqual(arrow.endX, 500 - TARGET_PADDING - 4); // left of target spotlight
  assert.ok(arrow.path.startsWith('M'));
  console.log('✓ calculateArrowGeometry left->right test passed');
}

console.log('--- ALL TUTORIAL GEOMETRY TESTS PASSED CLEANLY ---');
