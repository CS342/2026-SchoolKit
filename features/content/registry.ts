// Central block-type manifest — the SINGLE source of truth for every block type.
//
// Each block type is declared once here as a BlockDef: its zod schema, default
// factory, editor field-config, palette metadata, item-array key, TOC heading
// field, layout flag, card summary, and AI-prompt fragment. Every consumer
// (validate.ts, editor/templates.ts, blocks.tsx, ContentPage.tsx, BlockCard.tsx,
// ai/prompt.ts) DERIVES from REGISTRY instead of re-listing block types.
//
// Because REGISTRY is typed `Record<BlockType, BlockDef>`, TypeScript refuses to
// compile until every member of the ContentBlock union has an entry — so adding a
// block type is: (1) extend the union in types.ts, (2) add one REGISTRY entry,
// (3) add one BLOCK_RENDERERS entry in blocks.tsx. Nothing can silently drift.
//
// PURE module: imports only zod, nanoid, and ./types. It must never import
// validate.ts, editor/templates.ts, or anything React Native, so the validation/
// test path (node env) stays free of RN.

import { z } from 'zod';
import { nanoid } from 'nanoid/non-secure';
import type {
  BlockType, ContentBlock, ContentDoc,
  AccordionItem, CardItem, StepItem, LinkItem,
} from './types';

const nid = () => nanoid(8);

// ─── shared zod primitives (used by block schemas + validate.ts DocMeta) ─────────
export const ColorTokenSchema = z.enum(['primary', 'teal', 'coral', 'amber', 'indigo', 'sky']);
const Icon = z.string().min(1);
const Id = z.string().min(1);
const Str = z.string().min(1);
// Block `id` is optional in the schema so an insert op (id minted on apply) validates;
// parseContentDoc enforces id presence for stored docs via `requireId`.
const idOpt = { id: z.string().optional() };

const TitlePart = z.object({ text: z.string(), accent: z.boolean().optional() });
const AccordionItemS = z.object({ id: Id, title: Str, icon: Icon, color: ColorTokenSchema, summary: Str, body: Str });
const CardItemS = z.object({ id: Id, title: Str, icon: Icon, color: ColorTokenSchema, body: Str, href: z.string().optional() });
const StepItemS = z.object({ id: Id, title: Str, icon: Icon, color: ColorTokenSchema, detail: Str });
const LinkItemS = z.object({ id: Id, name: Str, icon: Icon, color: ColorTokenSchema, blurb: Str, url: Str, display: Str });

// ─── editor field-config types (moved here from editor/templates.ts) ─────────────
export type FieldKind = 'text' | 'textarea' | 'color' | 'icon' | 'toggle';
export interface FieldDef { key: string; label: string; kind: FieldKind; placeholder?: string }
export interface ItemConfig { arrayKey: string; noun: string; fields: FieldDef[]; make: () => any }
export interface BlockConfig { fields: FieldDef[]; item?: ItemConfig; special?: 'hero' | 'resourceRefList' }
export interface BlockMeta { type: BlockType; label: string; icon: string; blurb: string }

const HEADER: FieldDef[] = [
  { key: 'heading', label: 'Section title', kind: 'text' },
  { key: 'subheading', label: 'Subtitle', kind: 'text', placeholder: 'Optional' },
];

// ─── item makers ─────────────────────────────────────────────────────────────────
export const makeAccordionItem = (): AccordionItem => ({ id: nid(), title: 'New item', icon: 'ellipse-outline', color: 'teal', summary: '', body: '' });
export const makeCard = (): CardItem => ({ id: nid(), title: 'New card', icon: 'star-outline', color: 'teal', body: '' });
export const makeStep = (): StepItem => ({ id: nid(), title: 'New step', icon: 'ellipse-outline', color: 'teal', detail: '' });
export const makeLink = (): LinkItem => ({ id: nid(), name: 'New link', icon: 'link-outline', color: 'teal', blurb: '', url: 'https://', display: '' });

// ─── the manifest ────────────────────────────────────────────────────────────────
export interface BlockDef {
  type: BlockType;
  /** zod schema (id optional — see idOpt). */
  schema: z.ZodTypeAny;
  /** mint a default instance (used by the add-block menu + newPageDoc). */
  make: () => ContentBlock;
  /** declarative editor field-config (drives the generic BlockFields editor). */
  editor: BlockConfig;
  palette: { label: string; icon: string; blurb: string; manuallyAddable: boolean; order: number };
  /** key of the addressable item array, if any (for item-level ops). */
  itemArrayKey?: string;
  /** which field is the TOC/section heading, if any. */
  headingField?: string;
  /** triggers the wide/two-column page layout. */
  wideLayout?: boolean;
  /** one-line summary shown on the editor block card. */
  summary: (block: any) => string;
  /** one line for the AI system prompt's "Block types (fields)" list. */
  aiPrompt: string;
}

// NOTE: insertion order here = the order block types appear in the AI prompt.
// The add-block menu uses `palette.order` instead.
export const REGISTRY: Record<BlockType, BlockDef> = {
  hero: {
    type: 'hero',
    schema: z.object({ ...idOpt, type: z.literal('hero'), eyebrow: z.string().optional(), eyebrowIcon: z.string().optional(), eyebrowColor: ColorTokenSchema.optional(), titleParts: z.array(TitlePart).min(1), subtitle: z.string().optional() }),
    make: () => ({ id: nid(), type: 'hero', eyebrow: 'Eyebrow', eyebrowIcon: 'bookmark-outline', eyebrowColor: 'teal', titleParts: [{ text: 'New ' }, { text: 'Page', accent: true }] }),
    editor: { fields: [], special: 'hero' },
    palette: { label: 'Title', icon: 'text', blurb: 'The page title.', manuallyAddable: false, order: 0 },
    summary: (b) => (b.titleParts ?? []).map((p: any) => p.text).join('') || 'Untitled',
    aiPrompt: `- hero: { id, type:"hero", eyebrow?, eyebrowIcon?, eyebrowColor?, titleParts:[{text, accent?:true}], subtitle? } — exactly one, first. Split the title across titleParts so exactly ONE short key word has accent:true and the rest do not, e.g. [{text:"Coping with "},{text:"Fatigue",accent:true},{text:" at School"}]. Never mark the whole title.`,
  },
  callout: {
    type: 'callout',
    schema: z.object({ ...idOpt, type: z.literal('callout'), icon: Icon, text: Str, tone: ColorTokenSchema.optional() }),
    make: () => ({ id: nid(), type: 'callout', icon: 'information-circle-outline', text: 'Add a reassuring note here.', tone: 'primary' }),
    editor: { fields: [
      { key: 'text', label: 'Message', kind: 'textarea' },
      { key: 'icon', label: 'Icon', kind: 'icon' },
      { key: 'tone', label: 'Color', kind: 'color' },
    ] },
    palette: { label: 'Callout', icon: 'chatbox-ellipses-outline', blurb: 'A reassuring note up top.', manuallyAddable: true, order: 1 },
    summary: (b) => (b.text ?? '').slice(0, 80),
    aiPrompt: `- callout: { id, type:"callout", icon, text, tone? } — one reassuring note near the top.`,
  },
  richText: {
    type: 'richText',
    schema: z.object({ ...idOpt, type: z.literal('richText'), heading: z.string().optional(), markdown: Str }),
    make: () => ({ id: nid(), type: 'richText', markdown: 'Write here. **Bold** and *italic* work, and\n\n- bullet\n- points\n\ntoo.' }),
    editor: { fields: [
      { key: 'heading', label: 'Heading', kind: 'text', placeholder: 'Optional' },
      { key: 'markdown', label: 'Text', kind: 'textarea' },
    ] },
    palette: { label: 'Text', icon: 'text-outline', blurb: 'A paragraph of prose.', manuallyAddable: true, order: 7 },
    headingField: 'heading',
    summary: (b) => (b.heading ? b.heading + ' — ' : '') + (b.markdown ?? '').replace(/[#*_>-]/g, '').slice(0, 70),
    aiPrompt: `- richText: { id, type:"richText", heading?, markdown } — markdown supports **bold**, *italic*, [text](url), and "- " bullets.`,
  },
  quote: {
    type: 'quote',
    schema: z.object({ ...idOpt, type: z.literal('quote'), text: Str, author: z.string().optional() }),
    make: () => ({ id: nid(), type: 'quote', text: 'A short, encouraging quote.' }),
    editor: { fields: [
      { key: 'text', label: 'Quote', kind: 'textarea' },
      { key: 'author', label: 'Attribution', kind: 'text', placeholder: 'Optional' },
    ] },
    palette: { label: 'Quote', icon: 'chatbubble-outline', blurb: 'A short, affirming quote.', manuallyAddable: true, order: 8 },
    summary: (b) => (b.text ?? '').slice(0, 80),
    aiPrompt: `- quote: { id, type:"quote", text, author? }`,
  },
  footnote: {
    type: 'footnote',
    schema: z.object({ ...idOpt, type: z.literal('footnote'), text: Str }),
    make: () => ({ id: nid(), type: 'footnote', text: 'This page is general guidance, not medical advice.' }),
    editor: { fields: [{ key: 'text', label: 'Fine print', kind: 'textarea' }] },
    palette: { label: 'Fine print', icon: 'information-circle-outline', blurb: 'Disclaimer or source note.', manuallyAddable: true, order: 10 },
    summary: (b) => (b.text ?? '').slice(0, 80),
    aiPrompt: `- footnote: { id, type:"footnote", text } — fine print / "not medical advice".`,
  },
  image: {
    type: 'image',
    schema: z.object({ ...idOpt, type: z.literal('image'), url: Str, alt: Str, caption: z.string().optional(), aspect: z.number().optional() }),
    make: () => ({ id: nid(), type: 'image', url: '', alt: '' }),
    editor: { fields: [
      { key: 'url', label: 'Image URL', kind: 'text', placeholder: 'https://…' },
      { key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'Describe the image' },
      { key: 'caption', label: 'Caption', kind: 'text', placeholder: 'Optional' },
    ] },
    palette: { label: 'Image', icon: 'image-outline', blurb: 'A picture with a caption.', manuallyAddable: true, order: 9 },
    summary: (b) => b.alt || b.url || 'Image',
    aiPrompt: `- image: { id, type:"image", url, alt, caption? } — ONLY if the request supplies a real image URL OR an attached-image token (see "Attached images"); otherwise never emit an image. Never invent an image URL. When placing an attached image, copy its token EXACTLY into "url" and write a fitting alt from what you see.`,
  },
  accordion: {
    type: 'accordion',
    schema: z.object({ ...idOpt, type: z.literal('accordion'), heading: Str, subheading: z.string().optional(), items: z.array(AccordionItemS) }),
    make: () => ({ id: nid(), type: 'accordion', heading: 'Section title', subheading: '', items: [makeAccordionItem()] }),
    editor: { fields: HEADER, item: { arrayKey: 'items', noun: 'card', make: makeAccordionItem, fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'summary', label: 'Summary', kind: 'text' },
      { key: 'body', label: 'Details', kind: 'textarea' },
      { key: 'icon', label: 'Icon', kind: 'icon' },
      { key: 'color', label: 'Color', kind: 'color' },
    ] } },
    palette: { label: 'Expandable cards', icon: 'list-outline', blurb: 'Categories to tap and explore.', manuallyAddable: true, order: 2 },
    itemArrayKey: 'items',
    headingField: 'heading',
    summary: (b) => `${b.heading} · ${(b.items ?? []).length} items`,
    aiPrompt: `- accordion: { id, type:"accordion", heading, subheading?, items:[{id,title,icon,color,summary,body}] } — 3–5 tap-to-expand categories.`,
  },
  cardGrid: {
    type: 'cardGrid',
    schema: z.object({ ...idOpt, type: z.literal('cardGrid'), heading: Str, subheading: z.string().optional(), items: z.array(CardItemS) }),
    make: () => ({ id: nid(), type: 'cardGrid', heading: 'Section title', subheading: '', items: [makeCard(), makeCard()] }),
    editor: { fields: HEADER, item: { arrayKey: 'items', noun: 'card', make: makeCard, fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'body', label: 'Body', kind: 'textarea' },
      { key: 'icon', label: 'Icon', kind: 'icon' },
      { key: 'color', label: 'Color', kind: 'color' },
    ] } },
    palette: { label: 'Card grid', icon: 'grid-outline', blurb: 'A few items side by side.', manuallyAddable: true, order: 3 },
    itemArrayKey: 'items',
    headingField: 'heading',
    wideLayout: true,
    summary: (b) => `${b.heading} · ${(b.items ?? []).length} items`,
    aiPrompt: `- cardGrid: { id, type:"cardGrid", heading, subheading?, items:[{id,title,icon,color,body,href?}] } — 2–4 parallel items.`,
  },
  stepper: {
    type: 'stepper',
    schema: z.object({ ...idOpt, type: z.literal('stepper'), heading: Str, subheading: z.string().optional(), steps: z.array(StepItemS) }),
    make: () => ({ id: nid(), type: 'stepper', heading: 'Section title', subheading: '', steps: [makeStep(), makeStep()] }),
    editor: { fields: HEADER, item: { arrayKey: 'steps', noun: 'step', make: makeStep, fields: [
      { key: 'title', label: 'Step title', kind: 'text' },
      { key: 'detail', label: 'Details', kind: 'textarea' },
      { key: 'icon', label: 'Icon', kind: 'icon' },
      { key: 'color', label: 'Color', kind: 'color' },
    ] } },
    palette: { label: 'Step-by-step', icon: 'footsteps-outline', blurb: 'An ordered plan or journey.', manuallyAddable: true, order: 4 },
    itemArrayKey: 'steps',
    headingField: 'heading',
    wideLayout: true,
    summary: (b) => `${b.heading} · ${(b.steps ?? []).length} steps`,
    aiPrompt: `- stepper: { id, type:"stepper", heading, subheading?, steps:[{id,title,icon,color,detail}] } — an ORDERED plan (3–6 steps).`,
  },
  linkList: {
    type: 'linkList',
    schema: z.object({ ...idOpt, type: z.literal('linkList'), heading: Str, subheading: z.string().optional(), items: z.array(LinkItemS) }),
    make: () => ({ id: nid(), type: 'linkList', heading: 'Resources', subheading: '', items: [makeLink()] }),
    editor: { fields: HEADER, item: { arrayKey: 'items', noun: 'link', make: makeLink, fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'blurb', label: 'Description', kind: 'textarea' },
      { key: 'url', label: 'URL', kind: 'text', placeholder: 'https://…' },
      { key: 'display', label: 'Shown as', kind: 'text', placeholder: 'example.org' },
      { key: 'icon', label: 'Icon', kind: 'icon' },
      { key: 'color', label: 'Color', kind: 'color' },
    ] } },
    palette: { label: 'External links', icon: 'globe-outline', blurb: 'Outside organizations & sites.', manuallyAddable: true, order: 6 },
    itemArrayKey: 'items',
    headingField: 'heading',
    wideLayout: true,
    summary: (b) => `${b.heading} · ${(b.items ?? []).length} items`,
    aiPrompt: `- linkList: { id, type:"linkList", heading, subheading?, items:[{id,name,icon,color,blurb,url,display}] } — outside orgs; urls from verifiedLinks only.`,
  },
  resourceRefList: {
    type: 'resourceRefList',
    // resourceIds coerced to strings — models often emit them as numbers (13 not "13").
    schema: z.object({ ...idOpt, type: z.literal('resourceRefList'), heading: Str, subheading: z.string().optional(), ranked: z.boolean().optional(), resourceIds: z.array(z.coerce.string()) }),
    make: () => ({ id: nid(), type: 'resourceRefList', heading: 'Related guides', subheading: '', ranked: false, resourceIds: [] }),
    editor: { fields: [...HEADER, { key: 'ranked', label: 'Numbered list', kind: 'toggle' }], special: 'resourceRefList' },
    palette: { label: 'Resource list', icon: 'link-outline', blurb: 'Link to other SchoolKit guides.', manuallyAddable: true, order: 5 },
    headingField: 'heading',
    wideLayout: true,
    summary: (b) => `${b.heading} · ${(b.resourceIds ?? []).length} guides`,
    aiPrompt: `- resourceRefList: { id, type:"resourceRefList", heading, subheading?, ranked?:true, resourceIds:[ids] } — link to existing SchoolKit guides.`,
  },
  recommendations: {
    type: 'recommendations',
    schema: z.object({ ...idOpt, type: z.literal('recommendations') }),
    make: () => ({ id: nid(), type: 'recommendations' }),
    editor: { fields: [] },
    palette: { label: 'Recommendations', icon: 'sparkles-outline', blurb: 'Auto-suggested related pages.', manuallyAddable: true, order: 11 },
    summary: () => 'Related pages (automatic)',
    aiPrompt: `- recommendations: { id, type:"recommendations" } — always the LAST block.`,
  },
};

// ─── derivations shared by multiple consumers ────────────────────────────────────
const DEFS = Object.values(REGISTRY);

/** zod schema per block type (consumed by validate.ts). */
export const BLOCK_SCHEMAS = Object.fromEntries(DEFS.map((d) => [d.type, d.schema])) as Record<BlockType, z.ZodTypeAny>;

/** item-array key per block type, only for blocks that have one (consumed by validate.ts/ops.ts). */
export const ARRAY_KEY = Object.fromEntries(
  DEFS.filter((d) => d.itemArrayKey).map((d) => [d.type, d.itemArrayKey!]),
) as Partial<Record<BlockType, string>>;

/** block types that trigger the wide page layout (consumed by ContentPage.tsx). */
export const WIDE_TYPES = new Set<BlockType>(DEFS.filter((d) => d.wideLayout).map((d) => d.type));

/** one line per type for the AI prompt, in REGISTRY (prompt) order. */
export const BLOCK_PROMPT_LINES = DEFS.map((d) => d.aiPrompt).join('\n');
