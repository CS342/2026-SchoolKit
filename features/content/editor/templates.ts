// Block palette + a small field-config that drives the generic block editor. New
// blocks/items are minted with nanoid ids. Two blocks (hero, resourceRefList) have
// bespoke editors; everything else is described declaratively here.
import { nanoid } from 'nanoid/non-secure';
import type { BlockType, ContentBlock, ContentDoc, AccordionItem, CardItem, StepItem, LinkItem } from '../types';

const nid = () => nanoid(8);

export type FieldKind = 'text' | 'textarea' | 'color' | 'icon' | 'toggle';
export interface FieldDef { key: string; label: string; kind: FieldKind; placeholder?: string }
export interface ItemConfig { arrayKey: 'items' | 'steps'; noun: string; fields: FieldDef[]; make: () => any }
export interface BlockConfig { fields: FieldDef[]; item?: ItemConfig; special?: 'hero' | 'resourceRefList' }

// ─── palette metadata (add-block menu) ─────────────────────────────────────────
export interface BlockMeta { type: BlockType; label: string; icon: string; blurb: string }

export const BLOCK_PALETTE: BlockMeta[] = [
  { type: 'callout', label: 'Callout', icon: 'chatbox-ellipses-outline', blurb: 'A reassuring note up top.' },
  { type: 'accordion', label: 'Expandable cards', icon: 'list-outline', blurb: 'Categories to tap and explore.' },
  { type: 'cardGrid', label: 'Card grid', icon: 'grid-outline', blurb: 'A few items side by side.' },
  { type: 'stepper', label: 'Step-by-step', icon: 'footsteps-outline', blurb: 'An ordered plan or journey.' },
  { type: 'resourceRefList', label: 'Resource list', icon: 'link-outline', blurb: 'Link to other SchoolKit guides.' },
  { type: 'linkList', label: 'External links', icon: 'globe-outline', blurb: 'Outside organizations & sites.' },
  { type: 'richText', label: 'Text', icon: 'text-outline', blurb: 'A paragraph of prose.' },
  { type: 'quote', label: 'Quote', icon: 'chatbubble-outline', blurb: 'A short, affirming quote.' },
  { type: 'image', label: 'Image', icon: 'image-outline', blurb: 'A picture with a caption.' },
  { type: 'footnote', label: 'Fine print', icon: 'information-circle-outline', blurb: 'Disclaimer or source note.' },
  { type: 'recommendations', label: 'Recommendations', icon: 'sparkles-outline', blurb: 'Auto-suggested related pages.' },
];

/** Human label for any block type (used on block cards). */
export const BLOCK_LABEL: Record<BlockType, string> = {
  hero: 'Title', callout: 'Callout', richText: 'Text', quote: 'Quote', footnote: 'Fine print',
  image: 'Image', accordion: 'Expandable cards', cardGrid: 'Card grid', stepper: 'Step-by-step',
  linkList: 'External links', resourceRefList: 'Resource list', recommendations: 'Recommendations',
};
export const BLOCK_ICON: Record<BlockType, string> = {
  hero: 'text', callout: 'chatbox-ellipses-outline', richText: 'text-outline', quote: 'chatbubble-outline',
  footnote: 'information-circle-outline', image: 'image-outline', accordion: 'list-outline',
  cardGrid: 'grid-outline', stepper: 'footsteps-outline', linkList: 'globe-outline',
  resourceRefList: 'link-outline', recommendations: 'sparkles-outline',
};

// ─── section header fields (shared) ─────────────────────────────────────────────
const HEADER: FieldDef[] = [
  { key: 'heading', label: 'Section title', kind: 'text' },
  { key: 'subheading', label: 'Subtitle', kind: 'text', placeholder: 'Optional' },
];

// ─── item makers ────────────────────────────────────────────────────────────────
const makeAccordionItem = (): AccordionItem => ({ id: nid(), title: 'New item', icon: 'ellipse-outline', color: 'teal', summary: '', body: '' });
const makeCard = (): CardItem => ({ id: nid(), title: 'New card', icon: 'star-outline', color: 'teal', body: '' });
const makeStep = (): StepItem => ({ id: nid(), title: 'New step', icon: 'ellipse-outline', color: 'teal', detail: '' });
const makeLink = (): LinkItem => ({ id: nid(), name: 'New link', icon: 'link-outline', color: 'teal', blurb: '', url: 'https://', display: '' });

// ─── per-block config ────────────────────────────────────────────────────────────
export const BLOCK_CONFIG: Record<BlockType, BlockConfig> = {
  hero: { fields: [], special: 'hero' },
  callout: { fields: [
    { key: 'text', label: 'Message', kind: 'textarea' },
    { key: 'icon', label: 'Icon', kind: 'icon' },
    { key: 'tone', label: 'Color', kind: 'color' },
  ] },
  richText: { fields: [
    { key: 'heading', label: 'Heading', kind: 'text', placeholder: 'Optional' },
    { key: 'markdown', label: 'Text', kind: 'textarea' },
  ] },
  quote: { fields: [
    { key: 'text', label: 'Quote', kind: 'textarea' },
    { key: 'author', label: 'Attribution', kind: 'text', placeholder: 'Optional' },
  ] },
  footnote: { fields: [{ key: 'text', label: 'Fine print', kind: 'textarea' }] },
  image: { fields: [
    { key: 'url', label: 'Image URL', kind: 'text', placeholder: 'https://…' },
    { key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'Describe the image' },
    { key: 'caption', label: 'Caption', kind: 'text', placeholder: 'Optional' },
  ] },
  accordion: { fields: HEADER, item: { arrayKey: 'items', noun: 'card', make: makeAccordionItem, fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'summary', label: 'Summary', kind: 'text' },
    { key: 'body', label: 'Details', kind: 'textarea' },
    { key: 'icon', label: 'Icon', kind: 'icon' },
    { key: 'color', label: 'Color', kind: 'color' },
  ] } },
  cardGrid: { fields: HEADER, item: { arrayKey: 'items', noun: 'card', make: makeCard, fields: [
    { key: 'title', label: 'Title', kind: 'text' },
    { key: 'body', label: 'Body', kind: 'textarea' },
    { key: 'icon', label: 'Icon', kind: 'icon' },
    { key: 'color', label: 'Color', kind: 'color' },
  ] } },
  stepper: { fields: HEADER, item: { arrayKey: 'steps', noun: 'step', make: makeStep, fields: [
    { key: 'title', label: 'Step title', kind: 'text' },
    { key: 'detail', label: 'Details', kind: 'textarea' },
    { key: 'icon', label: 'Icon', kind: 'icon' },
    { key: 'color', label: 'Color', kind: 'color' },
  ] } },
  linkList: { fields: HEADER, item: { arrayKey: 'items', noun: 'link', make: makeLink, fields: [
    { key: 'name', label: 'Name', kind: 'text' },
    { key: 'blurb', label: 'Description', kind: 'textarea' },
    { key: 'url', label: 'URL', kind: 'text', placeholder: 'https://…' },
    { key: 'display', label: 'Shown as', kind: 'text', placeholder: 'example.org' },
    { key: 'icon', label: 'Icon', kind: 'icon' },
    { key: 'color', label: 'Color', kind: 'color' },
  ] } },
  resourceRefList: { fields: [...HEADER, { key: 'ranked', label: 'Numbered list', kind: 'toggle' }], special: 'resourceRefList' },
  recommendations: { fields: [] },
};

// ─── new-block templates ──────────────────────────────────────────────────────
export function newBlock(type: BlockType): ContentBlock {
  const id = nid();
  switch (type) {
    case 'hero': return { id, type, eyebrow: 'Eyebrow', eyebrowIcon: 'bookmark-outline', eyebrowColor: 'teal', titleParts: [{ text: 'New ' }, { text: 'Page', accent: true }] };
    case 'callout': return { id, type, icon: 'information-circle-outline', text: 'Add a reassuring note here.', tone: 'primary' };
    case 'richText': return { id, type, markdown: 'Write here. **Bold** and *italic* work, and\n\n- bullet\n- points\n\ntoo.' };
    case 'quote': return { id, type, text: 'A short, encouraging quote.' };
    case 'footnote': return { id, type, text: 'This page is general guidance, not medical advice.' };
    case 'image': return { id, type, url: '', alt: '' };
    case 'accordion': return { id, type, heading: 'Section title', subheading: '', items: [makeAccordionItem()] };
    case 'cardGrid': return { id, type, heading: 'Section title', subheading: '', items: [makeCard(), makeCard()] };
    case 'stepper': return { id, type, heading: 'Section title', subheading: '', steps: [makeStep(), makeStep()] };
    case 'linkList': return { id, type, heading: 'Resources', subheading: '', items: [makeLink()] };
    case 'resourceRefList': return { id, type, heading: 'Related guides', subheading: '', ranked: false, resourceIds: [] };
    case 'recommendations': return { id, type };
  }
}

/** A starter doc for a brand-new page: title + reassurance + auto recommendations. */
export function newPageDoc(): ContentDoc {
  return {
    schemaVersion: 1,
    slug: '',
    title: 'Untitled Page',
    accent: 'primary',
    category: '',
    tags: [],
    blocks: [newBlock('hero'), newBlock('callout'), newBlock('recommendations')],
  };
}
