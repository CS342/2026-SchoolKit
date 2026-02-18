// ─── Canvas Config ─────────────────────────────────────────────
export interface CanvasConfig {
  width: number;
  height: number;
  background: string;
}

// ─── Base Object ───────────────────────────────────────────────
export interface BaseObject {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

// ─── Specific Object Types ─────────────────────────────────────
export interface RectObject extends BaseObject {
  type: 'rect';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface EllipseObject extends BaseObject {
  type: 'ellipse';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  fill: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  assetId: string;
  src: string;
}

export interface LineObject extends BaseObject {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'miter' | 'round' | 'bevel';
}

// Union type
export type DesignObject =
  | RectObject
  | EllipseObject
  | TextObject
  | ImageObject
  | LineObject;

export type DesignObjectType = DesignObject['type'];

// ─── Full Document ─────────────────────────────────────────────
export interface DesignDocument {
  version: number;
  canvas: CanvasConfig;
  objects: DesignObject[];
  assets: Record<string, { url: string; name: string }>;
}

// ─── Canvas Presets ────────────────────────────────────────────
export const CANVAS_PRESETS = [
  { label: 'Presentation (16:9)', width: 1280, height: 720 },
  { label: 'Social Post (Square)', width: 1080, height: 1080 },
  { label: 'Story (9:16)', width: 1080, height: 1920 },
  { label: 'Poster (A4)', width: 794, height: 1123 },
  { label: 'Letter', width: 816, height: 1056 },
  { label: 'Widescreen (1920x1080)', width: 1920, height: 1080 },
] as const;

export const DEFAULT_DOCUMENT: DesignDocument = {
  version: 1,
  canvas: { width: 1280, height: 720, background: '#FFFFFF' },
  objects: [],
  assets: {},
};
