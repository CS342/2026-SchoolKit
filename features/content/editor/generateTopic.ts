// Generate a topic's versions from the author's files: one AI-generated draft per
// version, all saved into one topic. Shared by the new-page modal (several versions at
// once) and the editor's "Add version → From file(s)".
import { generatePage, editPage } from '../ai/client';
import { resolveUploadedImages, type Attachment, type TextAttachment } from '../uploads';
import type { Audience } from '../audience';
import type { ContentDoc } from '../types';
import type { Notice } from '../lint';
import { applyOps } from '../ops';
import { checkFidelity, fidelityNotices, keepSourceNamedGuides } from '../fidelity';
import { loadGuideIndex } from '../../../hooks/useResources';
import { linkListsFromText } from '../linkLists';
import { createTopic, deleteTopic, saveContentPage } from './crud';
import { stashGenerationNotices } from './store';

export interface VersionRequest {
  audience?: Audience;
  attachments: Attachment[];
}

export type VersionResult =
  | { ok: true; pageId: string; doc: ContentDoc }
  | { ok: false; error: string };

export type VersionProgress = 'waiting' | 'generating' | 'done' | 'failed';

const MAX_PARALLEL = 2;

/** At most this many sentences go into one repair request. */
const MAX_REPAIR_ITEMS = 60;

/**
 * Hold a page generated from source files to their exact text. The model is told to
 * keep every sentence and add none of its own, but often shortens or adds intros, so:
 * check the page against the files, ask for one targeted repair (missing sentences
 * verbatim, invented ones removed), keep whichever result is more faithful, and report
 * what's still off for the checks panel.
 */
const textAttachments = (attachments: Attachment[]) =>
  attachments.filter((a): a is TextAttachment => a.kind === 'text' && !!a.text.trim());
/** The text of the author's attached documents (empty when there are none). */
const sourceTexts = (attachments: Attachment[]) => textAttachments(attachments).map((t) => t.text);

async function enforceSourceText(doc: ContentDoc, attachments: Attachment[]): Promise<{ doc: ContentDoc; notices: Notice[] }> {
  const texts = textAttachments(attachments);
  if (!texts.length) return { doc, notices: [] };
  const sources = texts.map((t) => t.text);
  const sourceName = texts.length === 1 ? texts[0].name : 'your files';
  const before = checkFidelity(doc, sources);
  if (!before.missing.length && !before.invented.length) return { doc, notices: [] };

  const list = (items: string[]) => items.slice(0, MAX_REPAIR_ITEMS).map((s, i) => `${i + 1}. «${s}»`).join('\n');
  const instruction = [
    'FIDELITY REPAIR. This page was converted from the attached source and must contain ALL of its text, word for word, and nothing that is not in it. Fix only the problems below; do not reword anything else.',
    before.missing.length
      ? `Missing from the page — add each one EXACTLY as written, in the block for the section it belongs to (per the source), in source order. Put a missing opening paragraph in a richText block right after the hero. Where a block holds a shortened version of a sentence, replace it with the full sentence:\n${list(before.missing)}`
      : '',
    before.invented.length
      ? `Not in the source — remove each (delete the block if nothing else is left in it), or replace it with the matching source text:\n${list(before.invented.map((x) => x.text))}`
      : '',
  ].filter(Boolean).join('\n\n');

  let best = doc;
  let report = before;
  const repair = await editPage(doc, instruction, attachments);
  if (!('error' in repair)) {
    try {
      const repaired = applyOps(doc, repair.ops);
      const after = checkFidelity(repaired, sources);
      const problems = (r: typeof before) => r.missing.length + r.invented.length;
      if (problems(after) < problems(before)) { best = repaired; report = after; }
    } catch {
      // The repair didn't apply cleanly — keep the original and report its problems.
    }
  }
  return { doc: best, notices: fidelityNotices(report, sourceName) };
}

/** Generate one version and save it as a draft — in `topicId`, or a new topic named
 *  after the generated page. */
async function generateVersion(
  prompt: string,
  version: VersionRequest,
  opts: { topicId?: string; layoutFrom?: ContentDoc; userId?: string },
): Promise<VersionResult & { topicId?: string }> {
  // An audience the author set (even "everyone") is final; with none set, the AI's
  // suggestion is kept.
  const audienceOpt = 'audience' in version ? { audience: version.audience } : {};
  const res = await generatePage(prompt, version.attachments, [], { ...audienceOpt, layoutFrom: opts.layoutFrom });
  if ('error' in res) return { ok: false, error: res.error };
  const checked = await enforceSourceText(res.doc, version.attachments);
  // Link lists left in Text blocks become External links blocks, so every version of a
  // topic shows its outside links the same way.
  let doc = linkListsFromText(checked.doc);
  // From files, SchoolKit guide lists only hold guides the files name.
  const sources = sourceTexts(version.attachments);
  if (sources.length && doc.blocks.some((b) => b.type === 'resourceRefList')) {
    const guides = await loadGuideIndex();
    doc = keepSourceNamedGuides(doc, sources, new Map(guides.map((g) => [g.id, g.title])));
  }
  if (opts.userId && version.attachments.length) {
    doc = (await resolveUploadedImages(doc, version.attachments, opts.userId)).output;
  }
  const saved = await saveContentPage(null, doc, 'draft', opts.topicId);
  if ('error' in saved) return { ok: false, error: saved.error };
  // What generation had to leave out, and any text that still doesn't match the source,
  // shows in the editor's checks panel ([id].tsx).
  stashGenerationNotices(saved.id, [...checked.notices, ...res.notices]);
  return { ok: true, pageId: saved.id, doc, topicId: saved.topicId };
}

/**
 * Generate `versions` into one topic. Without `topicId`, the topic is created first
 * (named `topicName`) or, with no name, from the first page generated. With
 * `matchLayout`, every version mirrors the structure of `layoutFrom` — or, if none is
 * given, of the first version generated — so the versions look alike. Versions after the
 * first run a couple at a time. A failed version doesn't stop the others; its result
 * carries the error so the caller can retry just that one (pass the returned topicId).
 */
export async function generateTopicVersions({
  prompt, versions, topicId, topicName, matchLayout, layoutFrom, userId, onProgress,
}: {
  prompt: string;
  versions: VersionRequest[];
  topicId?: string;
  topicName?: string;
  matchLayout: boolean;
  layoutFrom?: ContentDoc;
  userId?: string;
  onProgress?: (index: number, state: VersionProgress) => void;
}): Promise<{ topicId?: string; results: VersionResult[] }> {
  const results: VersionResult[] = versions.map(() => ({ ok: false, error: 'Not generated.' }));
  let topic = topicId;
  let createdTopic = false;
  if (!topic && topicName?.trim()) {
    const t = await createTopic(topicName);
    if ('error' in t) return { results: versions.map(() => ({ ok: false, error: t.error })) };
    topic = t.id;
    createdTopic = true;
  }
  let reference = matchLayout ? layoutFrom : undefined;
  versions.forEach((_, i) => onProgress?.(i, 'waiting'));

  const run = async (i: number) => {
    onProgress?.(i, 'generating');
    const res = await generateVersion(prompt, versions[i], { topicId: topic, layoutFrom: reference, userId });
    results[i] = res.ok ? { ok: true, pageId: res.pageId, doc: res.doc } : res;
    onProgress?.(i, res.ok ? 'done' : 'failed');
    return res;
  };

  // Generate one at a time until a version succeeds: it settles the topic (when none
  // was given) and becomes the layout reference for the rest.
  let next = 0;
  while (next < versions.length && (!topic || (matchLayout && !reference))) {
    const res = await run(next++);
    if (res.ok) {
      topic = topic ?? res.topicId;
      if (matchLayout && !reference) reference = res.doc;
    }
  }

  // The rest, a couple at a time.
  const queue = Array.from({ length: versions.length - next }, (_, k) => next + k);
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, async () => {
    for (let i = queue.shift(); i !== undefined; i = queue.shift()) await run(i);
  }));

  // Don't leave behind an empty topic made for versions that all failed.
  if (createdTopic && topic && !results.some((r) => r.ok)) {
    await deleteTopic(topic);
    return { results };
  }
  return { topicId: topic, results };
}
