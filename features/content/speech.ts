// Read-aloud script for a ContentDoc — what the page's "Listen" player speaks.
// Each block's text comes from its REGISTRY `speech`; this module orders them into
// segments (one per block, split if long). Per-block segments keep TTS requests small,
// let playback start before the whole page is generated, and mean editing one block
// only re-generates that block's audio (the server caches by exact text).
//
// PURE module (node-testable): imports only ./registry and ./types.

import { REGISTRY } from './registry';
import type { ContentDoc } from './types';

export interface SpeechSegment {
  /** Unique per segment: the block id, suffixed when a long block is split. */
  key: string;
  blockId: string;
  /** Short label for the player: the block's heading, else the nearest heading above it,
   *  else the page title — always author content, so it's in the page's language. */
  label: string;
  text: string;
}

/** Under generate-tts's 5000-char limit, with headroom. */
export const MAX_SEGMENT_CHARS = 2500;

/** Split text at line, then sentence, then word boundaries so no piece exceeds `max`. */
export function splitForSpeech(text: string, max = MAX_SEGMENT_CHARS): string[] {
  if (text.length <= max) return [text];
  const units = text.split(/\n+/).flatMap((line) =>
    line.length <= max ? [line] : line.match(/[^.!?]+[.!?]*\s*/g) ?? [line],
  );
  const out: string[] = [];
  let cur = '';
  for (let unit of units) {
    while (unit.length > max) {
      const cut = unit.lastIndexOf(' ', max) > 0 ? unit.lastIndexOf(' ', max) : max;
      if (cur) { out.push(cur); cur = ''; }
      out.push(unit.slice(0, cut).trim());
      unit = unit.slice(cut).trim();
    }
    const next = cur ? `${cur}\n${unit}` : unit;
    if (next.length > max) { out.push(cur); cur = unit; } else cur = next;
  }
  if (cur.trim()) out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

export function docSpeechSegments(doc: ContentDoc): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  const hasHero = doc.blocks.some((b) => b.type === 'hero');
  if (!hasHero && doc.title) {
    segments.push({ key: '__title', blockId: '__title', label: doc.title, text: doc.title });
  }
  let section = doc.title;
  for (const block of doc.blocks) {
    const def = REGISTRY[block.type];
    const headingField = block.type === 'hero' ? null : def?.headingField;
    const heading = headingField ? ((block as any)[headingField] as string | undefined) : undefined;
    if (heading) section = heading;
    const text = def?.speech(block) ?? '';
    if (!text) continue;
    const label = section;
    splitForSpeech(text).forEach((piece, i) => {
      segments.push({ key: i ? `${block.id}#${i}` : block.id, blockId: block.id, label, text: piece });
    });
  }
  return segments;
}
