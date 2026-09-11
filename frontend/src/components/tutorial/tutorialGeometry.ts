export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
  centerX: number;
  centerY: number;
}

export interface CoachmarkPlacement {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface ArrowGeometry {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  path: string;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export const VIEWPORT_MARGIN = 16;
export const TARGET_GAP = 20;
export const TARGET_PADDING = 8;

/**
 * Resolves the bounding rectangle of a tutorial target element safely.
 * Returns null if the target element is missing or invisible.
 */
export function getTargetRect(selector?: string): TargetRect | null {
  if (!selector) return null;

  try {
    const el = document.querySelector(selector);
    if (!el) return null;

    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;

    // Special case for battlefield canvas: spotlight specifically on the left worker nodes lane
    if (selector === '[data-tutorial="battlefield"]') {
      const nodeColWidth = Math.min(220, r.width * 0.35);
      return {
        top: Math.round(r.top + 16),
        left: Math.round(r.left + 24),
        width: Math.round(nodeColWidth),
        height: Math.round(r.height - 32),
        bottom: Math.round(r.bottom - 16),
        right: Math.round(r.left + 24 + nodeColWidth),
        centerX: Math.round(r.left + 24 + nodeColWidth / 2),
        centerY: Math.round(r.top + r.height / 2),
      };
    }

    return {
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
      bottom: Math.round(r.bottom),
      right: Math.round(r.right),
      centerX: Math.round(r.left + r.width / 2),
      centerY: Math.round(r.top + r.height / 2),
    };
  } catch (err) {
    console.warn(`[Tutorial] Error measuring target '${selector}':`, err);
    return null;
  }
}

/**
 * Clamps coordinates within the viewport safe boundaries.
 */
export function clampToViewport(
  pos: { left: number; top: number },
  dimensions: { width: number; height: number },
  viewport: ViewportSize,
  margin = VIEWPORT_MARGIN
): { left: number; top: number } {
  const maxLeft = Math.max(margin, viewport.width - dimensions.width - margin);
  const maxTop = Math.max(margin, viewport.height - dimensions.height - margin);

  return {
    left: Math.round(Math.max(margin, Math.min(maxLeft, pos.left))),
    top: Math.round(Math.max(margin, Math.min(maxTop, pos.top))),
  };
}

/**
 * Calculates the optimal coachmark placement relative to the active target.
 */
export function calculateCoachmarkPlacement(
  targetRect: TargetRect | null,
  cardWidth: number,
  cardHeight: number,
  viewport: ViewportSize,
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
): CoachmarkPlacement {
  // Center fallback when no target or explicitly center
  if (!targetRect || preferredPlacement === 'center') {
    const centered = clampToViewport(
      {
        left: (viewport.width - cardWidth) / 2,
        top: (viewport.height - cardHeight) / 2,
      },
      { width: cardWidth, height: cardHeight },
      viewport
    );
    return {
      ...centered,
      placement: 'center',
    };
  }

  type PlacementType = 'top' | 'bottom' | 'left' | 'right';
  const order: PlacementType[] = [];

  if (preferredPlacement) {
    order.push(preferredPlacement);
  }

  // Determine priority order based on available space
  const spaceBelow = viewport.height - targetRect.bottom - TARGET_GAP - VIEWPORT_MARGIN;
  const spaceAbove = targetRect.top - TARGET_GAP - VIEWPORT_MARGIN;
  const spaceLeft = targetRect.left - TARGET_GAP - VIEWPORT_MARGIN;
  const spaceRight = viewport.width - targetRect.right - TARGET_GAP - VIEWPORT_MARGIN;

  const remainingPlacements: PlacementType[] = ['bottom', 'top', 'left', 'right'].filter(
    (p) => !order.includes(p as PlacementType)
  ) as PlacementType[];

  // Sort remaining placements by available space
  remainingPlacements.sort((a, b) => {
    const spaceA = a === 'bottom' ? spaceBelow : a === 'top' ? spaceAbove : a === 'left' ? spaceLeft : spaceRight;
    const spaceB = b === 'bottom' ? spaceBelow : b === 'top' ? spaceAbove : b === 'left' ? spaceLeft : spaceRight;
    return spaceB - spaceA;
  });

  order.push(...remainingPlacements);

  // Evaluate candidate placements
  for (const candidate of order) {
    let rawTop = 0;
    let rawLeft = 0;
    let fits = false;

    if (candidate === 'bottom') {
      rawTop = targetRect.bottom + TARGET_GAP;
      rawLeft = targetRect.centerX - cardWidth / 2;
      fits = rawTop + cardHeight <= viewport.height - VIEWPORT_MARGIN;
    } else if (candidate === 'top') {
      rawTop = targetRect.top - TARGET_GAP - cardHeight;
      rawLeft = targetRect.centerX - cardWidth / 2;
      fits = rawTop >= VIEWPORT_MARGIN;
    } else if (candidate === 'left') {
      rawTop = targetRect.centerY - cardHeight / 2;
      rawLeft = targetRect.left - TARGET_GAP - cardWidth;
      fits = rawLeft >= VIEWPORT_MARGIN;
    } else if (candidate === 'right') {
      rawTop = targetRect.centerY - cardHeight / 2;
      rawLeft = targetRect.right + TARGET_GAP;
      fits = rawLeft + cardWidth <= viewport.width - VIEWPORT_MARGIN;
    }

    if (fits) {
      const clamped = clampToViewport(
        { left: rawLeft, top: rawTop },
        { width: cardWidth, height: cardHeight },
        viewport
      );
      return {
        ...clamped,
        placement: candidate,
      };
    }
  }

  // Fallback: pick the first placement and clamp
  const fallback = order[0] || 'bottom';
  let rawTop = targetRect.bottom + TARGET_GAP;
  let rawLeft = targetRect.centerX - cardWidth / 2;

  if (fallback === 'top') {
    rawTop = targetRect.top - TARGET_GAP - cardHeight;
  } else if (fallback === 'left') {
    rawTop = targetRect.centerY - cardHeight / 2;
    rawLeft = targetRect.left - TARGET_GAP - cardWidth;
  } else if (fallback === 'right') {
    rawTop = targetRect.centerY - cardHeight / 2;
    rawLeft = targetRect.right + TARGET_GAP;
  }

  const clamped = clampToViewport(
    { left: rawLeft, top: rawTop },
    { width: cardWidth, height: cardHeight },
    viewport
  );

  return {
    ...clamped,
    placement: fallback,
  };
}

/**
 * Calculates the exact start and end anchor points and Bezier/straight SVG path
 * connecting the nearest coachmark edge to the nearest target edge.
 */
export function calculateArrowGeometry(
  coachmarkRect: DOMRect | null,
  targetRect: TargetRect | null
): ArrowGeometry | null {
  if (!coachmarkRect || !targetRect) return null;

  const cLeft = coachmarkRect.left;
  const cRight = coachmarkRect.right;
  const cTop = coachmarkRect.top;
  const cBottom = coachmarkRect.bottom;
  const cCenterX = cLeft + coachmarkRect.width / 2;
  const cCenterY = cTop + coachmarkRect.height / 2;

  const tLeft = targetRect.left - TARGET_PADDING;
  const tRight = targetRect.right + TARGET_PADDING;
  const tTop = targetRect.top - TARGET_PADDING;
  const tBottom = targetRect.bottom + TARGET_PADDING;
  const tCenterX = targetRect.centerX;
  const tCenterY = targetRect.centerY;

  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  let path = '';

  // Case 1: Coachmark is ABOVE target
  if (cBottom <= tTop + 4) {
    startX = Math.round(Math.max(cLeft + 20, Math.min(cRight - 20, tCenterX)));
    startY = Math.round(cBottom);
    endX = Math.round(Math.max(tLeft + 12, Math.min(tRight - 12, startX)));
    endY = Math.round(tTop - 4);

    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dx) < 14) {
      path = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      const ctrlX = startX;
      const ctrlY = Math.round(startY + dy * 0.55);
      path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    }
  }
  // Case 2: Coachmark is BELOW target
  else if (cTop >= tBottom - 4) {
    startX = Math.round(Math.max(cLeft + 20, Math.min(cRight - 20, tCenterX)));
    startY = Math.round(cTop);
    endX = Math.round(Math.max(tLeft + 12, Math.min(tRight - 12, startX)));
    endY = Math.round(tBottom + 4);

    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dx) < 14) {
      path = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      const ctrlX = startX;
      const ctrlY = Math.round(startY + dy * 0.55);
      path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    }
  }
  // Case 3: Coachmark is to the LEFT of target
  else if (cRight <= tLeft + 4) {
    startX = Math.round(cRight);
    startY = Math.round(Math.max(cTop + 20, Math.min(cBottom - 20, tCenterY)));
    endX = Math.round(tLeft - 4);
    endY = Math.round(Math.max(tTop + 12, Math.min(tBottom - 12, startY)));

    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dy) < 14) {
      path = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      const ctrlX = Math.round(startX + dx * 0.55);
      const ctrlY = startY;
      path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    }
  }
  // Case 4: Coachmark is to the RIGHT of target
  else if (cLeft >= tRight - 4) {
    startX = Math.round(cLeft);
    startY = Math.round(Math.max(cTop + 20, Math.min(cBottom - 20, tCenterY)));
    endX = Math.round(tRight + 4);
    endY = Math.round(Math.max(tTop + 12, Math.min(tBottom - 12, startY)));

    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dy) < 14) {
      path = `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      const ctrlX = Math.round(startX + dx * 0.55);
      const ctrlY = startY;
      path = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    }
  }
  // Case 5: Diagonal / close relationship fallback
  else {
    const isHorizontalDominant = Math.abs(cCenterX - tCenterX) >= Math.abs(cCenterY - tCenterY);

    if (isHorizontalDominant) {
      if (cCenterX < tCenterX) {
        startX = Math.round(cRight);
        startY = Math.round(cCenterY);
        endX = Math.round(tLeft - 4);
        endY = Math.round(tCenterY);
      } else {
        startX = Math.round(cLeft);
        startY = Math.round(cCenterY);
        endX = Math.round(tRight + 4);
        endY = Math.round(tCenterY);
      }
    } else {
      if (cCenterY < tCenterY) {
        startX = Math.round(cCenterX);
        startY = Math.round(cBottom);
        endX = Math.round(tCenterX);
        endY = Math.round(tTop - 4);
      } else {
        startX = Math.round(cCenterX);
        startY = Math.round(cTop);
        endX = Math.round(tCenterX);
        endY = Math.round(tBottom + 4);
      }
    }

    const midX = Math.round((startX + endX) / 2);
    const midY = Math.round((startY + endY) / 2);
    path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  }

  return {
    startX,
    startY,
    endX,
    endY,
    path,
  };
}
