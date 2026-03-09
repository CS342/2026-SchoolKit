// ─── Canvas Config ─────────────────────────────────────────────
export interface CanvasConfig {
  width: number;
  height: number;
  background: string;
  backgroundGradient?: GradientConfig | null;
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
  accessibilityLabel?: string;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
}

// ─── Shared Stroke Type ──────────────────────────────────────
export type StrokeDashPreset = 'solid' | 'dashed' | 'dotted' | 'dash-dot';

// ─── Shared Effect Types ──────────────────────────────────────
export interface GradientConfig {
  type: 'linear' | 'radial';
  colors: string[];      // 2-4 stops
  angle?: number;        // linear only, degrees (0-360)
}

export interface ShadowConfig {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

// ─── Specific Object Types ─────────────────────────────────────
export interface RectObject extends BaseObject {
  type: 'rect';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  gradient?: GradientConfig | null;
  shadow?: ShadowConfig | null;
  blur?: number;
  dash?: StrokeDashPreset;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface EllipseObject extends BaseObject {
  type: 'ellipse';
  fill: string;
  stroke: string;
  strokeWidth: number;
  gradient?: GradientConfig | null;
  shadow?: ShadowConfig | null;
  blur?: number;
  dash?: StrokeDashPreset;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fill: string;
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  shadow?: ShadowConfig | null;
  letterSpacing?: number;
  textDecoration?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  fontVariant?: 'normal' | 'small-caps';
  stroke?: string;
  strokeWidth?: number;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  assetId: string;
  src: string;
  cornerRadius?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  stroke?: string;
  strokeWidth?: number;
  shadow?: ShadowConfig | null;
}

export interface LineObject extends BaseObject {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
  lineCap: 'butt' | 'round' | 'square';
  lineJoin: 'miter' | 'round' | 'bevel';
  dash?: StrokeDashPreset;
}

export interface StarObject extends BaseObject {
  type: 'star';
  points: number;        // number of star points (3-12)
  innerRadius: number;   // % of outer (0.3-0.9)
  fill: string;
  stroke: string;
  strokeWidth: number;
  gradient?: GradientConfig | null;
  shadow?: ShadowConfig | null;
  dash?: StrokeDashPreset;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface TriangleObject extends BaseObject {
  type: 'triangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
  gradient?: GradientConfig | null;
  shadow?: ShadowConfig | null;
  dash?: StrokeDashPreset;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface ArrowObject extends BaseObject {
  type: 'arrow';
  points: number[];       // [x1,y1,x2,y2]
  stroke: string;
  strokeWidth: number;
  pointerLength: number;
  pointerWidth: number;
  fill: string;           // arrow head fill
  dash?: StrokeDashPreset;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface BadgeObject extends BaseObject {
  type: 'badge';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  textColor: string;
  fill: string;
  cornerRadius: number;
  paddingX: number;
  paddingY: number;
  gradient?: GradientConfig | null;
  shadow?: ShadowConfig | null;
  letterSpacing?: number;
  textDecoration?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

// ─── Interactive Component Types ──────────────────────────────
export type InteractionType = 'flip-card' | 'bottom-sheet' | 'expandable' | 'entrance' | 'carousel' | 'tabs' | 'quiz';

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
  springFriction?: number;   // bounce only (default 8)
  springTension?: number;    // bounce only (default 40)
}

export interface CarouselConfig {
  autoPlay: boolean;
  autoPlayInterval: number;   // ms
  showDots: boolean;
  showArrows: boolean;
  transitionDuration: number;  // ms
  pauseOnInteraction?: boolean;  // pause autoPlay on user interaction
  resumeDelay?: number;          // ms before resuming autoPlay (default 3000)
  arrowColor?: string;           // arrow icon color (default '#374151')
  arrowBgColor?: string;         // arrow background color (default 'rgba(255,255,255,0.9)')
  dotActiveColor?: string;       // active dot color (default '#fff')
  dotInactiveColor?: string;     // inactive dot color (default 'rgba(255,255,255,0.4)')
  dotPosition?: 'bottom' | 'top';  // dot position (default 'bottom')
}

export interface TabsConfig {
  defaultTab: number;          // 0-indexed
  tabPosition: 'top' | 'bottom';
  tabStyle: 'underline' | 'pill' | 'boxed';
}

export interface QuizConfig {
  questionText: string;
  options: string[];
  correctIndex: number;
  showFeedback: boolean;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  correctColor?: string;       // feedback text color for correct (default '#22C55E')
  incorrectColor?: string;     // feedback text color for incorrect (default '#EF4444')
  buttonColor?: string;        // "Try Again" button color (default '#7B68EE')
  optionHighlight?: string;    // selected option highlight (default 'rgba(123,104,238,0.1)')
}

export type InteractionConfig =
  | FlipCardConfig
  | BottomSheetConfig
  | ExpandableConfig
  | EntranceConfig
  | CarouselConfig
  | TabsConfig
  | QuizConfig;

export type StaticDesignObject =
  | RectObject
  | EllipseObject
  | TextObject
  | ImageObject
  | LineObject
  | StarObject
  | TriangleObject
  | ArrowObject
  | BadgeObject;

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
  | StarObject
  | TriangleObject
  | ArrowObject
  | BadgeObject
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
