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

// ─── Interactive Component Types ──────────────────────────────
export type InteractionType = 'flip-card' | 'bottom-sheet' | 'expandable' | 'entrance';

export interface ObjectGroup {
  role: string;
  label: string;
  objectIds: string[];
}

export interface FlipCardConfig {
  flipDuration: number;
  flipDirection: 'horizontal' | 'vertical';
  defaultSide: 'front' | 'back';
}

export interface BottomSheetConfig {
  sheetHeightPercent: number;
  backdropOpacity: number;
  slideDuration: number;
  dismissOnBackdropTap: boolean;
}

export interface ExpandableConfig {
  defaultExpanded: boolean;
  expandDuration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

export interface EntranceConfig {
  animation: 'fade-in' | 'slide-up' | 'scale-up' | 'bounce';
  duration: number;
  staggerDelay: number;
  trigger: 'on-load' | 'on-scroll';
}

export type InteractionConfig =
  | FlipCardConfig
  | BottomSheetConfig
  | ExpandableConfig
  | EntranceConfig;

export type StaticDesignObject =
  | RectObject
  | EllipseObject
  | TextObject
  | ImageObject
  | LineObject;

export interface InteractiveComponentObject extends BaseObject {
  type: 'interactive';
  interactionType: InteractionType;
  interactionConfig: InteractionConfig;
  groups: ObjectGroup[];
  childIds: string[];
  children: StaticDesignObject[];
}

// Union type
export type DesignObject =
  | RectObject
  | EllipseObject
  | TextObject
  | ImageObject
  | LineObject
  | InteractiveComponentObject;

export type DesignObjectType = DesignObject['type'];

// ─── Full Document ─────────────────────────────────────────────
export interface DesignDocument {
  version: number;
  canvas: CanvasConfig;
  objects: DesignObject[];
  assets: Record<string, { url: string; name: string }>;
}

// ─── Mobile-First Canvas ──────────────────────────────────────
// Authoring canvas is 390px wide (iPhone 14 logical width).
// Width adapts to any device at view time via scaling.
// Height starts at one phone screen and can be manually extended.
export const MOBILE_CANVAS = { width: 390, height: 844 } as const;
export const CANVAS_EXTEND_INCREMENT = 400;

export const DEFAULT_DOCUMENT: DesignDocument = {
  version: 1,
  canvas: { width: MOBILE_CANVAS.width, height: MOBILE_CANVAS.height, background: '#FFFFFF' },
  objects: [],
  assets: {},
};
