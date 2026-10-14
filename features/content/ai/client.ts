// Client for the content AI. Invokes the generate-content edge function (which
// proxies OpenAI server-side), then validates the result with the same zod parser
// the rest of the app uses. generatePage → a full ContentDoc; editPage → validated
// ops the editor applies via applyOps.
import { supabase } from '../../../lib/supabase';
import { ALL_RESOURCES } from '../../../constants/resources';
import type { ContentDoc, Op } from '../types';
import { buildGenerateMessages, buildEditMessages, ResourceRef, VerifiedLink, ChatMessage } from './prompt';
import { parseGenerateResult, parseEditResult } from './parse';
import type { Attachment } from '../uploads';

const resourceIndex = (): ResourceRef[] => ALL_RESOURCES.map((r) => ({ id: r.id, title: r.title, tags: r.tags }));

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

export async function generatePage(prompt: string, attachments: Attachment[] = [], links: VerifiedLink[] = []): Promise<{ doc: ContentDoc; warnings: string[] } | { error: string }> {
  const res = await invoke(buildGenerateMessages(prompt, resourceIndex(), links, attachments), 0.6);
  if ('error' in res) return { error: res.error };
  const parsed = parseGenerateResult(res.result);
  if (!parsed.doc) return { error: parsed.errors.join('; ') || 'The AI returned a page we could not read.' };
  return { doc: parsed.doc, warnings: parsed.warnings };
}

export async function editPage(doc: ContentDoc, instruction: string, attachments: Attachment[] = [], links: VerifiedLink[] = []): Promise<{ summary: string; ops: Op[] } | { error: string }> {
  const res = await invoke(buildEditMessages(doc, instruction, resourceIndex(), links, attachments), 0.4);
  if ('error' in res) return { error: res.error };
  const parsed = parseEditResult(res.result, doc);
  if (parsed.errors.length) return { error: `The AI suggested a change we couldn't apply: ${parsed.errors[0]}` };
  if (!parsed.ops.length) return { error: 'The AI didn\'t suggest any changes to make.' };
  return { summary: parsed.summary, ops: parsed.ops };
}
