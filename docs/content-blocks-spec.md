# Content Pages — Block Model Spec (v1 draft)

Status: **draft for review.** This pins down the two contracts everything else depends on:
the **block vocabulary** (what a page is made of) and the **op model** (how a page is edited,
by a human or the AI). Once these are agreed, the renderer, the Supabase table, the editor, and
the AI prompts all follow.

## 0. Goals & non-goals

**Goals**
- A page is **declarative data**, not code or pixels. The app owns a fixed set of *renderers*;
  the backend supplies an ordered list of *blocks*.
- Every page — generated or hand-edited — is responsive (web + mobile) and on-brand by
  construction. The author cannot produce a broken layout.
- **One data model** serves three surfaces: AI generation, manual editing, and AI re-editing.
- The AI's job is to emit **schema-validated JSON**, never TSX and never coordinates.

**Non-goals (v1)**
- Free pixel placement / overlap (that's the old canvas `designs` model; deliberately dropped).
- Arbitrary nesting. v1 is a **flat, ordered list** of blocks. A couple of blocks own an internal
  `items` array, but blocks do not contain other blocks. (Revisit if a real 2-column need appears.)

---

## 1. Document envelope

```ts
type ColorToken = 'primary' | 'teal' | 'coral' | 'amber' | 'indigo' | 'sky';
type IconName   = string;   // validated at parse time against the Ionicons set

interface ContentDoc {
  schemaVersion: 1;
  title: string;             // page title (also drives the browser/share title)
  accent: ColorToken;        // page-level accent (hero highlight word, spine colors)
  category?: string;         // 'School' | 'Social' | 'Health' | 'Family' | …
  tags: string[];            // powers RecommendationList + search
  blocks: ContentBlock[];    // ordered; this is the page
}
```

Every block carries a **stable `id`** (nanoid, assigned once at creation and never reused). Ids are
how ops and the AI address a specific block or item without ambiguity.

```ts
interface BlockBase { id: string; type: string; }
```

**Color rule:** blocks store a `ColorToken`, never raw hex. The renderer maps token → theme color,
so light/dark and any future palette change stay consistent. (Per-item color is chosen from the
token set, not free-form.)

---

## 2. Block vocabulary

The core twelve block types are defined below. Each maps to one renderer; several are harvested from
the finances page and the existing `features/design-editor` `Preview*` components.

> **Update (block manifest):** block types are now declared once in a central manifest,
> `features/content/registry.ts` (`REGISTRY: Record<BlockType, BlockDef>` — schema, default factory,
> editor field-config, palette metadata, item-array key, TOC heading, layout flag, card summary, and
> AI-prompt fragment per type). Every consumer (zod validator, editor palette/config, the page
> renderer's `BLOCK_RENDERERS`, the AI system prompt) derives from it, so adding a type is one
> manifest entry + one `BLOCK_RENDERERS` entry, both compiler-enforced via `Record<BlockType, …>`.
>
> Beyond the original twelve, the following were added for layout/content variety (manifest +
> renderer only, no schema/op changes): `divider`, `references`, `checklist`, `statGrid`, `gallery`,
> `testimonials`, `columns`, `tabs`, `flipCard`, `comparisonTable` (rows item-array), and `video`
> (YouTube/Vimeo/mp4 embed via `react-native-webview` on native, `<iframe>`/`<video>` on web).

```ts
type ContentBlock =
  | HeroBlock
  | CalloutBlock
  | RichTextBlock
  | QuoteBlock
  | ImageBlock
  | AccordionBlock
  | CardGridBlock
  | StepperBlock
  | LinkListBlock
  | ResourceRefListBlock
  | RecommendationsBlock;
```

### hero
Page title area with an eyebrow pill and an accent-highlighted word.
```ts
interface HeroBlock extends BlockBase {
  type: 'hero';
  eyebrow?: string;
  eyebrowIcon?: IconName;
  titleParts: { text: string; accent?: boolean }[];   // accent:true renders in the page accent color
  subtitle?: string;
}
```

### callout
A single reassurance/notice card: icon + short text, tone-colored.
```ts
interface CalloutBlock extends BlockBase {
  type: 'callout';
  icon: IconName;
  text: string;
  tone?: ColorToken;   // defaults to 'primary'
}
```

### richText
General prose. Body is a constrained markdown subset (paragraphs, **bold**, *italic*, links, bullet
lists). No raw HTML — it's parsed to native `<Text>` runs.
```ts
interface RichTextBlock extends BlockBase { type: 'richText'; heading?: string; markdown: string; }
```

### quote
Pull quote with optional attribution (as used on `finding-support`).
```ts
interface QuoteBlock extends BlockBase { type: 'quote'; text: string; author?: string; }
```

### footnote
Fine print — disclaimers, sources, "not medical advice". Italic, centered, muted caption.
```ts
interface FootnoteBlock extends BlockBase { type: 'footnote'; text: string; }
```

### image
```ts
interface ImageBlock extends BlockBase {
  type: 'image';
  url: string;          // Supabase Storage public URL
  alt: string;          // required for accessibility
  caption?: string;
  aspect?: number;      // width/height; renderer clamps to column width
}
```

### accordion
Tap-to-expand informational cards. (Finances "Where the Costs Come From".)
```ts
interface AccordionItem { id: string; title: string; icon: IconName; color: ColorToken; summary: string; body: string; }
interface AccordionBlock extends BlockBase { type: 'accordion'; heading: string; subheading?: string; items: AccordionItem[]; }
```

### cardGrid
Responsive equal-width card grid (the standardized 3-col + spacer system). (Finances "Support Team".)
```ts
interface CardItem { id: string; title: string; icon: IconName; color: ColorToken; body: string; href?: string; }
interface CardGridBlock extends BlockBase { type: 'cardGrid'; heading: string; subheading?: string; items: CardItem[]; }
```

### stepper
Ordered journey — vertical zigzag on mobile, horizontal stepper on web — each step opening a
detail card (with TTS). (Finances "Step-by-Step Roadmap".)
```ts
interface StepItem { id: string; title: string; icon: IconName; color: ColorToken; detail: string; }
interface StepperBlock extends BlockBase { type: 'stepper'; heading: string; subheading?: string; steps: StepItem[]; }
```

### linkList
External resources/orgs as tappable cards that open in-app browser. (Finances "Organizations".)
```ts
interface LinkItem { id: string; name: string; icon: IconName; color: ColorToken; blurb: string; url: string; display: string; }
interface LinkListBlock extends BlockBase { type: 'linkList'; heading: string; subheading?: string; items: LinkItem[]; }
```

### resourceRefList
References **existing** in-app resources by id — renders live title/icon/bookmark state, optionally
ranked. This is the "top 10 resources for college-bound students" block. It stores ids, not copies,
so it stays correct when a resource changes.
```ts
interface ResourceRefListBlock extends BlockBase {
  type: 'resourceRefList';
  heading: string;
  subheading?: string;
  ranked?: boolean;            // show 1..N numbers
  resourceIds: string[];       // ids into ALL_RESOURCES / content_pages
}
```

### recommendations
The existing tag-based `RecommendationList`. Zero-config; reads the doc's `tags`.
```ts
interface RecommendationsBlock extends BlockBase { type: 'recommendations'; }
```

> **Extensibility:** new capability = new block type + renderer + zod schema, registered in one
> place — now literally one entry in `features/content/registry.ts` plus one in `BLOCK_RENDERERS`.
> The AI's palette is literally the list of registered types (the prompt's block list derives from the
> manifest). Interactive primitives from the old canvas system (`PreviewCarousel`, `PreviewQuiz`,
> `PreviewTabs`, …) have begun landing as block types (`tabs`, `flipCard`, …).

---

## 3. The op / patch model

The single mutation vocabulary. **Both the manual editor and the AI produce ops**, and both are
applied by one pure reducer `applyOps(doc, ops) → doc`. This is what makes generate → hand-tweak →
re-prompt compose cleanly, with free undo/redo (keep an op/snapshot stack).

Two levels of address: **blocks** (top-level) and **items** (the `items`/`steps` arrays inside
accordion / cardGrid / stepper / linkList).

```ts
type Position = number | { after: string } | { before: string };   // index or relative to a block id

type Op =
  // block-level
  | { op: 'insertBlock'; at: Position; block: ContentBlock }
  | { op: 'updateBlock'; id: string; patch: Record<string, unknown> }   // shallow merge of scalar fields
  | { op: 'removeBlock'; id: string }
  | { op: 'moveBlock';   id: string; to: Position }
  // item-level (blocks that own an `items`/`steps` array)
  | { op: 'insertItem'; block: string; at: Position; item: Record<string, unknown> }
  | { op: 'updateItem'; block: string; item: string; patch: Record<string, unknown> }
  | { op: 'removeItem'; block: string; item: string }
  | { op: 'moveItem';   block: string; item: string; to: Position };
```

**Semantics**
- `insert*` mints a new `id` if none supplied. `at`/`to` resolve `{after|before: id}` against current order.
- `update*` is a **shallow merge** of the named fields; it never replaces the whole block/item, so an
  AI edit like *"make the third card blue"* is `{op:'updateItem', block, item, patch:{color:'sky'}}`.
- Every op is validated (§4) **before** apply; an invalid op aborts the whole batch (no partial writes).
- `applyOps` is pure and deterministic → trivial undo (inverse ops or snapshot) and testable.

**Worked edits**
| User says | Op(s) |
|---|---|
| "Add a reassurance note after the title" | `insertBlock`, `at:{after: heroId}`, a `callout` |
| "Make the 3rd resource card blue" | `updateItem`, `patch:{color:'sky'}` |
| "Put grants before insurance" | `moveItem` in the stepper |
| "Shorten every blurb" | N × `updateItem` |
| "Drop the quote" | `removeBlock` |

---

## 4. Validation

- One **zod schema per block** + a `ContentDoc` schema. Parse on **every** boundary: reading a row
  from Supabase, and ingesting AI output (both docs and ops).
- Unknown `type` or `icon` → **drop with a logged warning**, don't throw (forward-compatible: an old
  client can render a newer doc minus the blocks it doesn't know).
- Ops are validated against the *current* doc (referenced ids must exist) before apply.
- Never store or eval executable content. The renderer is the only code path. (This is the security
  reason blocks beat storing TSX/HTML.)

---

## 5. Rendering

```
<ContentPage doc={doc}>          // header (share/download/bookmark) + <ArticleLayout>/<ContentColumn>
  doc.blocks.map(b => <Block key={b.id} block={b} />)

<Block>                          // registry: switch(block.type) → the renderer component
```
- One registry object `{ hero: HeroBlock, accordion: AccordionBlock, … }`; unknown type → `null`.
- Renderers own **behavior** (animations, the stepper's TTS modal, accordion expand). Behavior is
  never in the JSON — the JSON is pure content.
- The finances renderers we already built become these components, moved to `components/content-blocks/`.

---

## 6. Persistence

Mirror the existing `designs` convention (a `doc` JSONB column):

```sql
create table content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text,
  tags text[] default '{}',
  doc jsonb not null,                       -- ContentDoc
  status text not null default 'draft',     -- 'draft' | 'published'
  created_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS: SELECT allowed when status = 'published' (public) or created_by = auth.uid();
--      INSERT/UPDATE restricted to the author/editors.
```
- Add the row types to `lib/database.types.ts` (hand-maintained per its header).
- Images → a Supabase Storage bucket (`content-images`); store the public URL in `ImageBlock.url`.
- Dynamic route `app/page/[slug].tsx` fetches by slug (same pattern as `design-view/[id]`) → `<ContentPage>`.
- `ALL_RESOURCES` entries point their `route` at `/page/<slug>`. (The resource index can later move
  into a table too; not required for v1.)

---

## 7. AI contracts

**Generate** (prompt → page):
```
input:  {
  prompt,                         // the author's request, in their own words
  sources?,                       // pasted text / uploaded handout the AI must ground on (not invent)
  resourceIndex?: {id,title,tags}[],   // existing resources the AI may reference via resourceRefList
  verifiedLinks?: {url,name}[],   // the ONLY external URLs the AI may use (see §11 accuracy)
  playbook,                       // system prompt: design rules + gold-standard exemplars + recipes (§11)
  blockPalette: BlockTypeName[],  // the registered types = the AI's entire capability surface
}
output: ContentDoc               // validated; on failure, one repair round-trip; then a critic pass (§11)
```

**Edit** (instruction → change):
```
input:  { doc, instruction }
output: { summary: string, ops: Op[] }     // validated & applied via applyOps; summary shown to author
```
Edit returns **ops, not a new doc** — cheaper, reviewable as a diff, and it can't clobber untouched
blocks. Generation may internally be "ops from empty doc," but returns the assembled doc.

---

## 8. Editor UX (block-list editor, replaces the canvas)

- Linear stack of blocks; each has a drag handle (**`moveBlock`**), inline field editing
  (**`updateBlock`** / **`updateItem`**), and a delete control (**`removeBlock`**).
- "＋ Add block" palette = the registered block types (**`insertBlock`**).
- Blocks with `items` get an inner add/reorder/delete for their items (item ops).
- An **AI prompt box** that emits ops against the current doc; author sees the `summary`, can accept/undo.
- Undo/redo = op history. Manual and AI edits are the same ops, fully interleavable.

---

## 9. The finances page, expressed in the schema (proof of round-trip)

Abbreviated — shows every current section maps to a block with no loss:

```jsonc
{
  "schemaVersion": 1,
  "title": "Navigating the Finances of Childhood Cancer",
  "accent": "teal",
  "category": "Family",
  "tags": ["finances","money","costs","insurance","grants","family","support"],
  "blocks": [
    { "id":"b1", "type":"hero", "eyebrow":"Family & Finances", "eyebrowIcon":"wallet-outline",
      "titleParts":[{"text":"Navigating the "},{"text":"Finances","accent":true},{"text":" of Childhood Cancer"}] },

    { "id":"b2", "type":"callout", "icon":"heart-outline",
      "text":"A cancer diagnosis is never something a family budgets for. …" },

    { "id":"b3", "type":"accordion", "heading":"Where the Costs Come From",
      "subheading":"Tap a card to see what it includes and one thing that helps.",
      "items":[
        { "id":"c1","title":"Medical bills & co-pays","icon":"medkit-outline","color":"teal",
          "summary":"Treatment, hospital stays, medications, scans, and specialist visits.",
          "body":"Even with insurance, co-pays and deductibles add up. …" }
        /* c2 travel · c3 lost income · c4 everyday extras */
      ] },

    { "id":"b4", "type":"cardGrid", "heading":"Build Your Support Team",
      "subheading":"The people whose job it is to help with money — start here.",
      "items":[ /* Hospital Social Worker · Financial Counselor · School Counselor */ ] },

    { "id":"b5", "type":"stepper", "heading":"Your Step-by-Step Roadmap",
      "subheading":"Tap each step to learn how — and listen along if you'd like.",
      "steps":[ /* 5 steps, each {title, icon, color, detail} */ ] },

    { "id":"b6", "type":"linkList", "heading":"Organizations That Can Help",
      "subheading":"Trusted nonprofits with real financial support. Tap to visit.",
      "items":[ /* Family Reach · Alex's Lemonade · RMHC · LLS · CFAC */ ] },

    { "id":"b7", "type":"recommendations" }
  ]
}
```

---

## 10. Decisions (resolved)

1. **Flat blocks in v1** — no nesting / multi-column containers. ✅
2. **AI edit = ops, not full regen.** ✅
3. **Colors are tokens only** — the AI never emits raw hex. ✅
4. **v1 vocabulary = the 12 core blocks above** (footnote added in Phase 1). Since extended via the
   central manifest with layout/content/media blocks (`divider`, `columns`, `tabs`, `checklist`,
   `statGrid`, `comparisonTable`, `gallery`, `video`, `flipCard`, `references`, `testimonials`). ✅
5. **`resourceRefList` references live resources** (ids, not copies). ✅
6. **`designs` = deprecated as a delivery format.** The block model is the only content-page path
   going forward. We keep existing `designs` code/rows but **do not extend** the canvas; its
   interactive primitives (`PreviewCarousel`/`Quiz`/`Tabs`/…) get harvested into block types later.
   No migration of existing design rows in v1. ✅
7. **Build scope = all blocks** before wiring the table/editor, so the finances page renders
   identically from data on day one. ✅

---

## 11. Authoring for non-technical researchers (fidelity, grounding, safety)

**Context:** the app will be handed to cancer researchers who are **domain experts but non-technical**,
with access to *only* the design editor. The bar: a researcher writing a prompt gets a page of the
**same fidelity** as the hand-built finances page — self-contained, on-brand, accurate — without
touching code. That's a generation-*quality* problem, not just a schema-validity one. What it takes:

**a. Roles: AI = designer/IA, researcher = domain authority.**
The AI owns structure, layout, tone, color/icon, pacing. The researcher owns *truth* — which orgs are
real, what advice is correct, what's appropriate for the audience. Design so the expert's knowledge is
the input and the quality backstop, not the model's guesses.

**b. Grounding beats invention.** The prompt box accepts more than a one-liner: pasted text, an
uploaded handout, or references to existing resources. The AI **restructures the researcher's
material** into blocks rather than inventing facts. "Here's our clinic's financial-aid sheet → make it
a page" is the highest-fidelity, safest path. `resourceRefList` is one grounding mechanism; source
text is the other.

**c. Accuracy & safety guardrails (critical for medical/financial content).**
- **No invented specifics.** External URLs come only from `verifiedLinks` (a curated/confirmed set);
  the AI may not fabricate organizations, links, statistics, or medical/financial claims.
- **Review → publish gate.** Generated pages are `draft`; the researcher previews, edits, and
  explicitly publishes (reuse the existing story-moderation pattern). Human-in-the-loop is the net.
- **Tone & reading level** enforced by the playbook (warm, second-person, plain language).

**d. The generation playbook is a first-class deliverable — it's what transfers *taste*.**
A validator makes JSON *legal*; the playbook makes it *good*. It bundles: the design-system rules,
the web-layout lessons we learned this session (prose vs. grid widths; adapt-don't-port mobile
metaphors; the `asChild`-link style trap), **gold-standard exemplars** (the finances `ContentDoc`,
few-shot), and **per-intent recipes** (educational explainer, ranked resource list, step-by-step
guide → known-good block sequences). "Top 10 resources for college-bound students" resolves to a recipe.

**e. Vocabulary completeness + graceful degradation.** With no code escape hatch, the block set must
cover the fidelity bar, and the AI must **degrade to existing blocks** rather than invent a type. New
need → new block type through the defined extension path (§2), never ad-hoc. Track requests the AI
couldn't satisfy as the backlog for new blocks.

**f. A critic pass.** After generation, a second AI pass (or a checklist the author sees) grades the
draft against a rubric — has an intro/reassurance? sources grounded? not too long? tone consistent?
one clear CTA/next step? — and proposes fix ops. This is the mechanism that makes fidelity *consistent*
rather than luck-of-the-draw.

**g. Non-technical editing UX.** No JSON, no hex. Inline text editing, **pickers** for icon/color
(from the token set), drag-to-reorder, add-from-palette, and a **live preview with a web/mobile
viewport toggle** so the author sees both targets. AI-edit ("make it warmer", "add a scholarships
section") is the *primary* tweak path for this audience; manual editing is the fallback.

**h. Fidelity comes from the loop, not one-shot.** The finances page reached its quality through
iteration (the web-layout and standardization passes). A researcher gets there the same way:
generate → preview → tweak (AI or manual) → re-preview. The op model is what makes that loop cheap and
safe. Set expectations accordingly — the first draft is a strong start, not the finished page.

> This is also the strongest argument for **deprecating the canvas** (§10.6): a non-technical author on
> a freeform canvas will produce off-brand, non-responsive, broken pages. The block model's
> constraints are precisely what make the handoff safe.

---

## 12. Build sequence

Ordered to reach "finances renders identically from JSON" first, then the non-technical authoring loop.

1. **Contracts** — `ContentBlock`/`ContentDoc` types + zod schemas + `applyOps` reducer (+ unit tests).
2. **Renderers (all 12)** — `<ContentPage>` + `<Block>` registry; port the finances section
   components into `components/content-blocks/`, plus `richText`/`quote`/`image`/`resourceRefList`.
3. **Local render proof** — render the finances `ContentDoc` (from a local JSON fixture) and diff it
   visually against the current hardcoded page, web + mobile. Gate: pixel-parity before touching the DB.
4. **Data** — `content_pages` table (+ `status` draft/published) + RLS + `database.types.ts` + Storage
   bucket for images; `app/page/[slug].tsx` fetch route; seed the finances JSON; delete the hardcoded
   `finances-childhood-cancer.tsx` and repoint its resource `route` to `/page/finances-childhood-cancer`.
5. **Manual editor + live preview** — block-list UI on the op model (drag reorder, inline edit,
   token pickers for icon/color, add-block palette) with a **web/mobile preview toggle**. No AI. This
   alone must let a non-technical author build a page. (§11g)
6. **Generation playbook** — the design-rules + exemplars + per-intent recipes prompt asset (§11d).
   This is the fidelity lever; author it against the finances page as the gold standard.
7. **AI generate** — prompt (+ grounded `sources`/`verifiedLinks`) → validated `ContentDoc` → **critic
   pass** (§11f). Draft status; nothing publishes without the author.
8. **AI edit** — instruction → validated ops → `applyOps`.
9. **Review → publish gate** — draft/preview/publish flow (reuse story moderation). (§11c)
10. **Harvest** — bring the canvas interactive primitives across as new block types; retire the
    canvas editor once parity is reached.

---

## 13. Applying Phase 3 to Supabase (manual — needs DB creds)

The block runtime is live and `app/page/[slug].tsx` already fetches from `content_pages`,
falling back to the bundled fixtures (`features/content/fixtures/`) until the table exists.
To make the DB the source of truth:

1. **Push the migration** (needs the DB password):
   ```
   supabase link --project-ref ksixrfrenjvytijdykub
   supabase db push        # applies supabase/migrations/20260728030000_content_pages.sql
   ```
2. **Seed the finances page** — paste `supabase/seed/content_pages.sql` into the Dashboard
   SQL editor, or `psql "$DATABASE_URL" -f supabase/seed/content_pages.sql`. Idempotent (upsert on slug).
3. **Verify**: `/page/finances-childhood-cancer` now serves from `content_pages`; the fixture
   remains only as the offline/unseeded fallback.

Writes are moderator-gated (RLS) — researcher accounts need the `moderator` role
(`set_user_role` RPC or dashboard) to author pages. The seed generator lives at
`scratchpad/gen-seed.js`; regenerate the seed after editing the finances fixture.

**AI (Phase 5)** — deploy the edge function so the in-editor AI works:
`supabase functions deploy generate-content`. It reuses the existing `OPENAI_API_KEY`
secret (shared with generate-design), returns raw JSON, and the client validates with
zod. In the editor: "New page → describe" generates a draft; the "Ask AI" bar edits via
ops. The prompt lives in `features/content/ai/prompt.ts` (mirrors PLAYBOOK.md).

**Deps added this phase:** `zod` (validation), `nanoid`@3 (`/non-secure` ids), `jest`@29 +
`ts-jest` (`npm test`). Install with `--legacy-peer-deps` (pre-existing react-konva peer conflict).
```
