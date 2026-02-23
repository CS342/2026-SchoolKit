// ─── Clipboard Module ─────────────────────────────────────────
// Module-level singleton (outside Zustand so clipboard ops aren't undoable)

import type { DesignObject } from '../types/document';

let clipboardObjects: DesignObject[] = [];
let pasteCount = 0;

export function copyToClipboard(objects: DesignObject[]): void {
  clipboardObjects = JSON.parse(JSON.stringify(objects));
  pasteCount = 0;
}

export function getClipboard(): { objects: DesignObject[]; pasteCount: number } {
  return { objects: clipboardObjects, pasteCount };
}

export function incrementPasteCount(): void {
  pasteCount++;
}

export function hasClipboardContent(): boolean {
  return clipboardObjects.length > 0;
}
