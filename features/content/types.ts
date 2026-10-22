// Content Pages — block model types (spec: docs/content-blocks-spec.md §1–3).
// Pure types, zero runtime deps. The doc is declarative data; renderers own behavior.

import type { Audience } from './audience';

export type ColorToken = 'primary' | 'teal' | 'coral' | 'amber' | 'indigo' | 'sky';

/** Ionicons name. Validated softly at render (unknown → fallback icon). */
export type IconName = string;

// ─── Blocks ──────────────────────────────────────────────────────────────────

export interface BlockBase {
  /** Stable id — assigned once at creation, never reused. Ops/AI address by this. */
  id: string;
  type: string;
}

export interface TitlePart {
  text: string;
  /** Render in the page accent color. */
  accent?: boolean;
}

export interface HeroBlock extends BlockBase {
  type: 'hero';
  eyebrow?: string;
  eyebrowIcon?: IconName;
  /** Eyebrow pill color; defaults to the page accent. */
  eyebrowColor?: ColorToken;
  titleParts: TitlePart[];
  subtitle?: string;
}

export interface CalloutBlock extends BlockBase {
  type: 'callout';
  icon: IconName;
  text: string;
  tone?: ColorToken; // default 'primary'
}

export interface RichTextBlock extends BlockBase {
  type: 'richText';
  heading?: string;
  /** Constrained markdown subset: paragraphs, **bold**, *italic*, links, - bullets. */
  markdown: string;
}

export interface QuoteBlock extends BlockBase {
  type: 'quote';
  text: string;
  author?: string;
}

/** Fine print — disclaimers, sources, "not medical advice". Italic, centered, muted. */
export interface FootnoteBlock extends BlockBase {
  type: 'footnote';
  text: string;
}

export interface ImageBlock extends BlockBase {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
  /** width / height. Renderer clamps to the column width. */
  aspect?: number;
}

export interface AccordionItem {
  id: string;
  title: string;
  icon: IconName;
  color: ColorToken;
  summary: string;
  body: string;
}
export interface AccordionBlock extends BlockBase {
  type: 'accordion';
  heading: string;
  subheading?: string;
  items: AccordionItem[];
}

export interface CardItem {
  id: string;
  title: string;
  icon: IconName;
  color: ColorToken;
  body: string;
  href?: string;
}
export interface CardGridBlock extends BlockBase {
  type: 'cardGrid';
  heading: string;
  subheading?: string;
  items: CardItem[];
}

export interface StepItem {
  id: string;
  title: string;
  icon: IconName;
  color: ColorToken;
  detail: string;
}
export interface StepperBlock extends BlockBase {
  type: 'stepper';
  heading: string;
  subheading?: string;
  steps: StepItem[];
}

export interface LinkItem {
  id: string;
  name: string;
  icon: IconName;
  color: ColorToken;
  /** Optional description; shown only when the source gives one. */
  blurb?: string;
  url: string;
  /** Link label (e.g. "acco.org"); the renderer falls back to the URL's domain. */
  display?: string;
}
export interface LinkListBlock extends BlockBase {
  type: 'linkList';
  heading: string;
  subheading?: string;
  items: LinkItem[];
}

export interface ResourceRefListBlock extends BlockBase {
  type: 'resourceRefList';
  heading: string;
  subheading?: string;
  ranked?: boolean;
  resourceIds: string[];
}

export interface RecommendationsBlock extends BlockBase {
  type: 'recommendations';
}

// ─── added blocks (variety: layout, lists/data, media) ─────────────────────────

/** A visual break between sections. */
export interface DividerBlock extends BlockBase {
  type: 'divider';
  variant?: 'line' | 'dots' | 'space';
  tone?: ColorToken;
}

export interface ReferenceItem {
  id: string;
  label: string;
  url?: string;
}
/** A numbered list of sources / citations. */
export interface ReferencesBlock extends BlockBase {
  type: 'references';
  heading?: string;
  items: ReferenceItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  /** Authored default checked state; toggling in the reader is ephemeral. */
  done?: boolean;
}
/** A tappable / printable checklist. */
export interface ChecklistBlock extends BlockBase {
  type: 'checklist';
  heading?: string;
  subheading?: string;
  items: ChecklistItem[];
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  icon?: IconName;
  color: ColorToken;
}
/** A row of number + label stat tiles. */
export interface StatGridBlock extends BlockBase {
  type: 'statGrid';
  heading?: string;
  subheading?: string;
  items: StatItem[];
}

export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  caption?: string;
}
/** Several images in a grid. */
export interface GalleryBlock extends BlockBase {
  type: 'gallery';
  heading?: string;
  subheading?: string;
  items: GalleryItem[];
}

export interface TestimonialItem {
  id: string;
  text: string;
  author?: string;
  role?: string;
}
/** Multiple short quotes (generalizes the single `quote` block). */
export interface TestimonialsBlock extends BlockBase {
  type: 'testimonials';
  heading?: string;
  subheading?: string;
  items: TestimonialItem[];
}

/** Two side-by-side markdown columns (stacked on mobile). */
export interface ColumnsBlock extends BlockBase {
  type: 'columns';
  heading?: string;
  left: string;
  right: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  markdown: string;
}
/** Tabbed sections — one panel visible at a time. */
export interface TabsBlock extends BlockBase {
  type: 'tabs';
  heading?: string;
  subheading?: string;
  items: TabItem[];
}

export interface FlipCardItem {
  id: string;
  front: string;
  back: string;
  icon?: IconName;
  color: ColorToken;
}
/** Tap-to-flip cards (e.g. term → definition, myth → fact). */
export interface FlipCardBlock extends BlockBase {
  type: 'flipCard';
  heading?: string;
  subheading?: string;
  items: FlipCardItem[];
}

export interface ComparisonRow {
  id: string;
  /** One cell per column; length should match `columns`. */
  cells: string[];
}
/** A simple comparison table (columns + rows). Rows are the item array. */
export interface ComparisonTableBlock extends BlockBase {
  type: 'comparisonTable';
  heading?: string;
  subheading?: string;
  columns: string[];
  rows: ComparisonRow[];
}

/** An embedded video (YouTube/Vimeo embed, or a direct mp4). */
export interface VideoBlock extends BlockBase {
  type: 'video';
  provider?: 'youtube' | 'vimeo' | 'mp4';
  url: string;
  title?: string;
  caption?: string;
}

export type ContentBlock =
  | HeroBlock
  | CalloutBlock
  | RichTextBlock
  | QuoteBlock
  | FootnoteBlock
  | ImageBlock
  | AccordionBlock
  | CardGridBlock
  | StepperBlock
  | LinkListBlock
  | ResourceRefListBlock
  | RecommendationsBlock
  | DividerBlock
  | ReferencesBlock
  | ChecklistBlock
  | StatGridBlock
  | GalleryBlock
  | TestimonialsBlock
  | ColumnsBlock
  | TabsBlock
  | FlipCardBlock
  | ComparisonTableBlock
  | VideoBlock;

export type BlockType = ContentBlock['type'];

/** The field name of a block's addressable item array (for item-level ops).
 *  A plain string so new item-array blocks can use their own key (e.g. 'rows'). */
export type ItemArrayKey = string;

// ─── Document ─────────────────────────────────────────────────────────────────

export interface ContentDoc {
  schemaVersion: 1;
  slug: string;
  title: string;
  accent: ColorToken;
  category?: string;
  tags: string[];
  /** Resource id backing bookmark / download / recommendations "currentId". */
  resourceId?: string;
  /** Optional custom share text; falls back to the title. */
  shareMessage?: string;
  /** Who the page is for. Missing = everyone. Off-audience pages are hidden from lists. */
  audience?: Audience;
  blocks: ContentBlock[];
}

// ─── Ops (spec §3) ────────────────────────────────────────────────────────────

/** Insert/move target: an absolute index, or relative to a sibling id. */
export type Position = number | { after: string } | { before: string };

export type Op =
  // block-level
  | { op: 'insertBlock'; at: Position; block: ContentBlock }
  | { op: 'updateBlock'; id: string; patch: Record<string, unknown> }
  | { op: 'removeBlock'; id: string }
  | { op: 'moveBlock'; id: string; to: Position }
  // item-level (accordion/cardGrid/linkList `items`, stepper `steps`)
  | { op: 'insertItem'; block: string; at: Position; item: Record<string, unknown> }
  | { op: 'updateItem'; block: string; item: string; patch: Record<string, unknown> }
  | { op: 'removeItem'; block: string; item: string }
  | { op: 'moveItem'; block: string; item: string; to: Position };

export type OpType = Op['op'];
