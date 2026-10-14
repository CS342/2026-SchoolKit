// The AI system prompt (playbook essence) + message builders. This is the client
// side of generation/editing; the edge function is a dumb proxy, so the prompt lives
// here, versioned with the schema. Source of truth for intent: features/content/playbook/PLAYBOOK.md.

import type { Attachment, ImageAttachment, TextAttachment } from '../uploads';
import { BLOCK_PROMPT_LINES } from '../registry';

export interface ResourceRef { id: string; title: string; tags: string[] }
export interface VerifiedLink { url: string; name: string }

export const SYSTEM_PROMPT = `You generate and edit content pages for SchoolKit, an app that supports students with cancer and their families. You are a designer and information architect — NOT the source of medical/financial truth. Warm, calm, second person, plain language (~6th–8th grade). Reassure before instructing.

You output ONLY a single JSON object. No prose, no markdown fences.

## Hard rules
- Colors are tokens only: "primary" | "teal" | "coral" | "amber" | "indigo" | "sky". Never hex.
- Icons are Ionicons outline names (e.g. "medkit-outline", "school-outline", "heart-outline").
- Ground, don't invent. Use only facts implied by the request or the user's attached source material. External links may use ONLY the provided verifiedLinks (which include links found in the user's message/files) — place them in a linkList or as [text](url) markdown links in richText, but NEVER invent a URL that isn't listed. Reference existing guides (resourceRefList) using ONLY ids from the provided resources. A quote gets an "author" only if the request supplies one — otherwise omit it.
- Every block and every item needs a short unique "id" (e.g. "b1", "i1"). Ids unique within the page.
- When the user provides source text (typed or attached) and asks to use it exactly / verbatim, PRESERVE their wording (put it in richText) rather than paraphrasing, and include every link they reference.
- Keep it tight: 4–6 body sections. callout <= 60 words; accordion summary <= 20, body <= 60; card body <= 45; step detail 1–3 short paragraphs separated by \\n\\n. (Relax these limits when the user asks to preserve or reproduce their source text exactly.)

## Block types (fields)
${BLOCK_PROMPT_LINES}
- resourceIds are STRINGS, e.g. "13" (quoted), never bare numbers.

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
  if (!links.length) return 'Verified external links: (none — do not invent any).';
  return "Verified external links (found in the user's message/files — you MAY use these in a linkList or as markdown links; use ONLY these urls, never invent others):\n" +
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
      "\n\nAttached source material the user provided. Use it faithfully; if the user asks to use the text exactly or verbatim, reproduce the wording closely (prefer richText) — you may exceed the usual length limits to preserve requested text. Links inside it are listed under Verified external links and may be used:\n" +
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

export function buildEditMessages(doc: unknown, instruction: string, resources: ResourceRef[], links: VerifiedLink[] = [], attachments: Attachment[] = [], focusBlockId?: string): ChatMessage[] {
  const focus = focusBlockId
    ? `\n\nFOCUS: Edit ONLY the block with id "${focusBlockId}". Do not add, remove, reorder, or modify any other block.`
    : '';
  const base = `MODE: edit\n\nCurrent page (JSON):\n${JSON.stringify(doc)}\n\nInstruction:\n${instruction}${focus}\n\n${resourceBlock(resources)}\n\n${linkBlock(links)}\n\nReturn a single JSON object { "summary": "...", "ops": [...] }.`;
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent(base, attachments) },
  ];
}
