// Client for the content AI. Invokes the generate-content edge function (which
// proxies OpenAI server-side), then validates the result with the same zod parser
// the rest of the app uses. generatePage → a full ContentDoc; editPage → validated
// ops the editor applies via applyOps.
import { supabase } from '../../../lib/supabase';
import { loadGuideIndex } from '../../../hooks/useResources';
import type { ContentDoc, Op } from '../types';
import { buildGenerateMessages, buildEditMessages, ResourceRef, VerifiedLink, ChatMessage, GenerateOptions } from './prompt';
import { parseGenerateResult, parseEditResult } from './parse';
import { collectVerifiedLinks } from '../uploads';
import type { Attachment } from '../uploads';
import type { Notice } from '../lint';

// The guides the Library actually lists (published pages included), so resourceRefList
// links point at the same cards readers see.
const resourceIndex = async (): Promise<ResourceRef[]> =>
  (await loadGuideIndex()).map((r) => ({ id: r.id, title: r.title, tags: r.tags }));

async function invoke(messages: ChatMessage[], temperature: number): Promise<{ result: unknown } | { error: string }> {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: { messages, temperature, max_tokens: 16384 },
  });
  if (error) {
    // supabase-js surfaces the real error in error.context (a Response).
    let message = error.message ?? 'The AI request failed.';
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try { const b = await context.json(); if (b?.error) message = b.error; } catch { /* keep generic */ }
    }
    if (/unauthorized|401/i.test(message)) message = 'Please sign in again to use AI.';
    return { error: message };
  }
  if (data?.error) return { error: data.error as string };
  return { result: data?.result };
}

/** `opts` generates one version of a topic: its audience (also set on the returned doc)
 *  and, optionally, a sibling version whose layout to mirror. */
export async function generatePage(prompt: string, attachments: Attachment[] = [], links: VerifiedLink[] = [], opts: GenerateOptions = {}): Promise<{ doc: ContentDoc; notices: Notice[] } | { error: string }> {
  const allLinks = collectVerifiedLinks(attachments, prompt, links);
  // Lower temperature so the model stays faithful to the user's wording (it preserves
  // supplied source text rather than drifting into a paraphrase); matches editPage.
  const res = await invoke(buildGenerateMessages(prompt, await resourceIndex(),allLinks, attachments, opts), 0.4);
  if ('error' in res) return { error: res.error };
  const parsed = parseGenerateResult(res.result);
  if (!parsed.doc) return { error: parsed.errors.join('; ') || 'The AI returned a page we could not read.' };
  // An audience the caller sets (even undefined = everyone) is the author's choice and
  // wins; otherwise the model's suggestion stands.
  const doc = 'audience' in opts ? { ...parsed.doc, audience: opts.audience } : parsed.doc;
  return { doc, notices: parsed.notices };
}

export async function editPage(doc: ContentDoc, instruction: string, attachments: Attachment[] = [], links: VerifiedLink[] = [], focusBlockId?: string): Promise<{ summary: string; ops: Op[] } | { error: string }> {
  const allLinks = collectVerifiedLinks(attachments, instruction, links);
  const res = await invoke(buildEditMessages(doc, instruction, await resourceIndex(),allLinks, attachments, focusBlockId), 0.4);
  if ('error' in res) return { error: res.error };
  const parsed = parseEditResult(res.result, doc);
  if (parsed.errors.length) return { error: `The AI suggested a change we couldn't apply: ${parsed.errors[0]}` };
  if (!parsed.ops.length) return { error: 'The AI didn\'t suggest any changes to make.' };
  return { summary: parsed.summary, ops: parsed.ops };
}

/** Ask the vision model to write alt text (and an optional caption) for an image URL.
 *  Used by the editor's image block. The image must be at a publicly reachable URL
 *  (content-images is a public bucket). Returns a short, screen-reader-friendly alt. */
export async function suggestImageText(imageUrl: string): Promise<{ alt: string; caption?: string } | { error: string }> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You write image alt text for SchoolKit, a supportive app for students with cancer and their families. Return ONLY a JSON object {"alt": string, "caption": string}. "alt" is concise (<=125 chars), factual, screen-reader-friendly, and does not start with "image of"/"picture of". "caption" is an optional short display caption, or "" if none fits.',
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Write alt text and an optional caption for this image. Return the JSON object only.' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];
  const res = await invoke(messages, 0.3);
  if ('error' in res) return { error: res.error };
  const r = res.result as { alt?: unknown; caption?: unknown } | null;
  const alt = typeof r?.alt === 'string' ? r.alt.trim() : '';
  if (!alt) return { error: 'The AI didn\'t return alt text.' };
  const caption = typeof r?.caption === 'string' && r.caption.trim() ? r.caption.trim() : undefined;
  return { alt, caption };
}
