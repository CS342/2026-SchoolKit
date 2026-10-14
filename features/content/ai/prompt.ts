// The AI system prompt (playbook essence) + message builders. This is the client
// side of generation/editing; the edge function is a dumb proxy, so the prompt lives
// here, versioned with the schema. Source of truth for intent: features/content/playbook/PLAYBOOK.md.

import type { Attachment, ImageAttachment, TextAttachment } from '../uploads';

export interface ResourceRef { id: string; title: string; tags: string[] }
export interface VerifiedLink { url: string; name: string }

export const SYSTEM_PROMPT = `You generate and edit content pages for SchoolKit, an app that supports students with cancer and their families. You are a designer and information architect — NOT the source of medical/financial truth. Warm, calm, second person, plain language (~6th–8th grade). Reassure before instructing.

You output ONLY a single JSON object. No prose, no markdown fences.

## Hard rules
- Colors are tokens only: "primary" | "teal" | "coral" | "amber" | "indigo" | "sky". Never hex.
- Icons are Ionicons outline names (e.g. "medkit-outline", "school-outline", "heart-outline").
- Ground, don't invent. Use only facts implied by the request. External links (linkList) may use ONLY the provided verifiedLinks. Reference existing guides (resourceRefList) using ONLY ids from the provided resources. A quote gets an "author" only if the request supplies one — otherwise omit it.
- Every block and every item needs a short unique "id" (e.g. "b1", "i1"). Ids unique within the page.
- Keep it tight: 4–6 body sections. callout <= 60 words; accordion summary <= 20, body <= 60; card body <= 45; step detail 1–3 short paragraphs separated by \\n\\n.

## Block types (fields)
- hero: { id, type:"hero", eyebrow?, eyebrowIcon?, eyebrowColor?, titleParts:[{text, accent?:true}], subtitle? } — exactly one, first. Split the title across titleParts so exactly ONE short key word has accent:true and the rest do not, e.g. [{text:"Coping with "},{text:"Fatigue",accent:true},{text:" at School"}]. Never mark the whole title.
- resourceIds are STRINGS, e.g. "13" (quoted), never bare numbers.
- callout: { id, type:"callout", icon, text, tone? } — one reassuring note near the top.
- richText: { id, type:"richText", heading?, markdown } — markdown supports **bold**, *italic*, [text](url), and "- " bullets.
- quote: { id, type:"quote", text, author? }
- footnote: { id, type:"footnote", text } — fine print / "not medical advice".
- image: { id, type:"image", url, alt, caption? } — ONLY if the request supplies a real image URL OR an attached-image token (see "Attached images"); otherwise never emit an image. Never invent an image URL. When placing an attached image, copy its token EXACTLY into "url" and write a fitting alt from what you see.
- accordion: { id, type:"accordion", heading, subheading?, items:[{id,title,icon,color,summary,body}] } — 3–5 tap-to-expand categories.
- cardGrid: { id, type:"cardGrid", heading, subheading?, items:[{id,title,icon,color,body,href?}] } — 2–4 parallel items.
- stepper: { id, type:"stepper", heading, subheading?, steps:[{id,title,icon,color,detail}] } — an ORDERED plan (3–6 steps).
- linkList: { id, type:"linkList", heading, subheading?, items:[{id,name,icon,color,blurb,url,display}] } — outside orgs; urls from verifiedLinks only.
- resourceRefList: { id, type:"resourceRefList", heading, subheading?, ranked?:true, resourceIds:[ids] } — link to existing SchoolKit guides.
- recommendations: { id, type:"recommendations" } — always the LAST block.

Selection: ordered journey → stepper; unordered explore → accordion; parallel items → cardGrid; existing guides → resourceRefList; outside orgs → linkList.

## MODE: generate
Return a ContentDoc:
{ "schemaVersion":1, "slug":"kebab-slug", "title":"…", "accent":"primary", "category":"School|Health|Social|Family|…", "tags":["…"], "blocks":[ …exactly one hero first, recommendations last… ] }
Recipes: educational explainer = hero·callout·accordion·(stepper|cardGrid)·resourceRefList·footnote·recommendations. Step-by-step = hero·callout·stepper·accordion·resourceRefList·footnote·recommendations. Ranked list = hero·callout·resourceRefList(ranked:true)·recommendations. Include a footnote when giving medical/financial/legal guidance.

## MODE: edit
Return { "summary":"one short sentence", "ops":[ … ] } using the smallest set of ops. Never rewrite untouched blocks. Ops:
- { "op":"insertBlock", "at":<pos>, "block":{…} }
- { "op":"updateBlock", "id":"…", "patch":{…} }   (only the changed scalar fields)
- { "op":"removeBlock", "id":"…" }
- { "op":"moveBlock", "id":"…", "to":<pos> }
- { "op":"insertItem", "block":"…", "at":<pos>, "item":{…} }
- { "op":"updateItem", "block":"…", "item":"…", "patch":{…} }
- { "op":"removeItem", "block":"…", "item":"…" }
- { "op":"moveItem", "block":"…", "item":"…", "to":<pos> }
<pos> is a number index, or { "after":"<id>" }, or { "before":"<id>" }.

## Before returning, self-check: exactly one hero (first) and one recommendations (last); opens with reassurance; grounded (no invented links/orgs/quotes/facts); tokens only; every block/item has an id; within length limits; footnote present if guidance. Fix any miss, then return.`;

function resourceBlock(resources: ResourceRef[]): string {
  if (!resources.length) return 'Available SchoolKit guides for resourceRefList: (none).';
  return 'Available SchoolKit guides for resourceRefList (use these ids only):\n' +
    resources.map((r) => `- ${r.id}: ${r.title} [${r.tags.join(', ')}]`).join('\n');
}

function linkBlock(links: VerifiedLink[]): string {
  if (!links.length) return 'Verified external links for linkList: (none — do not invent any).';
  return 'Verified external links for linkList (use these urls only):\n' +
    links.map((l) => `- ${l.name}: ${l.url}`).join('\n');
}

/** OpenAI multimodal content part. `content` is a plain string when there are no
 *  image attachments, or an array of parts (text + images) when there are. */
export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ChatMessage { role: 'system' | 'user'; content: string | ContentPart[] }

/** Append attached-document text and the attached-image token list to the base user
 *  text, and attach each image as a vision part. Returns a plain string when there are
 *  no images, preserving the original single-string message shape. */
function userContent(baseText: string, attachments: Attachment[]): string | ContentPart[] {
  const texts = attachments.filter((a): a is TextAttachment => a.kind === 'text');
  const images = attachments.filter((a): a is ImageAttachment => a.kind === 'image');

  let text = baseText;
  if (texts.length) {
    text +=
      '\n\nAttached documents (reference material — use to inform the page, do not quote verbatim):\n' +
      texts.map((t) => `--- ${t.name} ---\n${t.text}`).join('\n\n');
  }
  if (images.length) {
    text +=
      '\n\nAttached images: the images below are provided as reference. To PLACE one on the page in an image block, set that block\'s "url" to the EXACT token shown (do not alter it). Only place an image if the request calls for it; otherwise use it only to inform your writing.\n' +
      images.map((i) => `- token "${i.token}" — ${i.name}`).join('\n');
  }

  if (!images.length) return text;
  return [
    { type: 'text', text },
    ...images.map((i) => ({ type: 'image_url' as const, image_url: { url: i.dataUrl } })),
  ];
}

export function buildGenerateMessages(prompt: string, resources: ResourceRef[], links: VerifiedLink[] = [], attachments: Attachment[] = []): ChatMessage[] {
  const base = `MODE: generate\n\nRequest:\n${prompt}\n\n${resourceBlock(resources)}\n\n${linkBlock(links)}\n\nReturn a single ContentDoc JSON object.`;
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent(base, attachments) },
  ];
}

export function buildEditMessages(doc: unknown, instruction: string, resources: ResourceRef[], links: VerifiedLink[] = [], attachments: Attachment[] = []): ChatMessage[] {
  const base = `MODE: edit\n\nCurrent page (JSON):\n${JSON.stringify(doc)}\n\nInstruction:\n${instruction}\n\n${resourceBlock(resources)}\n\n${linkBlock(links)}\n\nReturn a single JSON object { "summary": "...", "ops": [...] }.`;
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent(base, attachments) },
  ];
}
