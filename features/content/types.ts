// Content Pages — block model types (spec: docs/content-blocks-spec.md §1–3).
// Pure types, zero runtime deps. The doc is declarative data; renderers own behavior.

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
  blurb: string;
  url: string;
  display: string;
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
  | RecommendationsBlock;

export type BlockType = ContentBlock['type'];

/** Blocks that own an addressable item array (for item-level ops). */
export type ItemArrayKey = 'items' | 'steps';

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
