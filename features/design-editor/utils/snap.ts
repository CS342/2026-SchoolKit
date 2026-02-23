// ─── Snap Utilities ───────────────────────────────────────────

export interface GuideLine {
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export interface MagneticSnapResult {
  x: number;
  y: number;
  guides: GuideLine[];
}

export interface ObjectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Grid Snap ────────────────────────────────────────────────

export function snapToGrid(x: number, y: number, gridSize: number): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

// ─── Magnetic Snap ────────────────────────────────────────────

const SNAP_THRESHOLD = 8;

export function magneticSnap(
  dragged: ObjectBounds,
  others: ObjectBounds[],
  canvasWidth: number,
  canvasHeight: number,
): MagneticSnapResult {
  const guides: GuideLine[] = [];
  let snappedX = dragged.x;
  let snappedY = dragged.y;
  let bestDx = SNAP_THRESHOLD + 1;
  let bestDy = SNAP_THRESHOLD + 1;

  // Dragged object edges & center
  const dragLeft = dragged.x;
  const dragRight = dragged.x + dragged.width;
  const dragCenterX = dragged.x + dragged.width / 2;
  const dragTop = dragged.y;
  const dragBottom = dragged.y + dragged.height;
  const dragCenterY = dragged.y + dragged.height / 2;

  const dragXPoints = [dragLeft, dragCenterX, dragRight];
  const dragYPoints = [dragTop, dragCenterY, dragBottom];

  // Build snap targets: other objects + canvas edges + canvas center
  const verticalTargets: number[] = [0, canvasWidth, canvasWidth / 2];
  const horizontalTargets: number[] = [0, canvasHeight, canvasHeight / 2];

  for (const other of others) {
    verticalTargets.push(other.x, other.x + other.width / 2, other.x + other.width);
    horizontalTargets.push(other.y, other.y + other.height / 2, other.y + other.height);
  }

  // Find best vertical snap (affects X)
  for (const dragPt of dragXPoints) {
    for (const target of verticalTargets) {
      const dist = Math.abs(dragPt - target);
      if (dist < bestDx) {
        bestDx = dist;
        snappedX = dragged.x + (target - dragPt);
      }
    }
  }

  // Find best horizontal snap (affects Y)
  for (const dragPt of dragYPoints) {
    for (const target of horizontalTargets) {
      const dist = Math.abs(dragPt - target);
      if (dist < bestDy) {
        bestDy = dist;
        snappedY = dragged.y + (target - dragPt);
      }
    }
  }

  // Only apply snap if within threshold; collect guides for the snapped positions
  if (bestDx <= SNAP_THRESHOLD) {
    // Figure out which target we snapped to for guide lines
    const snappedLeft = snappedX;
    const snappedRight = snappedX + dragged.width;
    const snappedCenterX = snappedX + dragged.width / 2;
    for (const target of verticalTargets) {
      if (
        Math.abs(snappedLeft - target) < 1 ||
        Math.abs(snappedRight - target) < 1 ||
        Math.abs(snappedCenterX - target) < 1
      ) {
        guides.push({ orientation: 'vertical', position: target });
      }
    }
  } else {
    snappedX = dragged.x;
  }

  if (bestDy <= SNAP_THRESHOLD) {
    const snappedTop = snappedY;
    const snappedBottom = snappedY + dragged.height;
    const snappedCenterY = snappedY + dragged.height / 2;
    for (const target of horizontalTargets) {
      if (
        Math.abs(snappedTop - target) < 1 ||
        Math.abs(snappedBottom - target) < 1 ||
        Math.abs(snappedCenterY - target) < 1
      ) {
        guides.push({ orientation: 'horizontal', position: target });
      }
    }
  } else {
    snappedY = dragged.y;
  }

  return { x: snappedX, y: snappedY, guides };
}
