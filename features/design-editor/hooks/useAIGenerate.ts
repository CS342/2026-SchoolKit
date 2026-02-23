import { useState, useCallback } from 'react';
import { generateId } from '../utils/defaults';
import { getTemplateSkeleton } from '../utils/ai-templates';
import type { DesignDocument, DesignObject } from '../types/document';

export interface GenerateRequest {
  mode: 'structured' | 'prompt';
  canvas: { width: number; height: number };
  structured?: {
    title?: string;
    subtitle?: string;
    bodyText?: string;
    accentColor?: string;
    style?: string;
  };
  prompt?: string;
  templateId?: string;
}

const VALID_STATIC_TYPES = new Set(['rect', 'ellipse', 'text', 'line']);
const VALID_ALL_TYPES = new Set(['rect', 'ellipse', 'text', 'line', 'interactive']);
const VALID_INTERACTION_TYPES = new Set(['flip-card', 'bottom-sheet', 'expandable', 'entrance']);
const VALID_FONT_STYLES = new Set(['normal', 'bold', 'italic', 'bold italic']);
const VALID_ALIGNS = new Set(['left', 'center', 'right']);
const HEX_REGEX = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

function isValidHex(color: string): boolean {
  return typeof color === 'string' && HEX_REGEX.test(color);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const SYSTEM_PROMPT = `You are an expert visual designer generating layouts for SchoolKit, a polished educational mobile app. You output ONLY valid JSON representing a DesignDocument. Your designs should look like they were made by a professional designer — never generic or flat.

═══════════════════════════════════════════
RULE #1: CONTENT FIDELITY (HIGHEST PRIORITY)
═══════════════════════════════════════════

You MUST generate ALL the content the user asks for. If they ask for "10 cards", you generate 10 cards. If they ask for "5 bullet points", you generate 5 bullet points. NEVER truncate, summarize, or reduce the quantity. This is the single most important rule.

CANVAS EXTENSION: If the requested content won't fit on the given canvas, INCREASE canvas.height to accommodate. The canvas is scrollable. A 390x844 canvas requesting 10 cards should become 390x4000+ to fit them all with proper spacing. Always add extra height rather than cramming or cutting content.

CONTENT TEXT: Use clear placeholder text. For numbered items use "Myth #1", "Fact #1", "Step 1", etc. For body text use descriptive placeholders like "Description goes here..." or "Tap to learn more". Don't generate long real educational content — keep text short and placeholder-like so the user can fill in their own.

SPACING FOR MULTIPLE ITEMS: When generating many similar items (cards, sections, etc.), space them evenly with generous gaps (30-50px between items). The first item should start after any header section. Stack items vertically.

═══════════════════════════════════════════
SCHOOLKIT BRAND & THEME
═══════════════════════════════════════════

This app has a refined, modern, approachable aesthetic — soft but not childish, colorful but not chaotic.

COLOR PALETTE (always use these, never arbitrary colors):
- Primary: #7B68EE (medium slate blue). Hero backgrounds, prominent accents, key buttons.
- Primary dark: #5B4BC7. For contrast against lighter purple.
- Primary light: #9B6EE8. Soft accents, secondary fills.
- Background: #FBF9FF (main), #F0EBFF (tinted sections), #F8F5FF (inputs/insets)
- Text: #2D2D44 (headings), #6B6B85 (body), #8E8EA8 (captions/secondary), #FFFFFF (on dark)
- Borders: #E8E8F0, #E8E0F0 (subtle card edges)
- Accent sky: #0EA5E9 (info, highlights) → lighter #38BDF8
- Accent pink: #EC4899 (warm emphasis) → lighter #F472B6
- Accent amber: #F59E0B (warnings, callouts) → lighter #FBBF24
- Accent green: #22C55E (success, positive) → lighter #66D9A6
- White: #FFFFFF. Dark: #1A1A2E (for dark sections or dramatic contrast).

Use dominant + accent pairings — e.g. a large purple header with a small amber accent dot — rather than distributing colors evenly. Create visual hierarchy through color weight.

TYPOGRAPHY:
- Use fontFamily "Georgia" for display/headlines (gives character vs generic sans-serif).
- Use fontFamily "Arial" for body text and UI labels.
- Titles: bold, large (5-7% of canvas width). Make them the visual anchor.
- Subtitles: normal weight, slightly muted color, 60-70% of title size.
- Body: normal weight, generous lineHeight (1.5-1.6), comfortable reading size (2-3% of width).
- Use font size contrast dramatically — a 48px title next to 14px caption creates energy.

CORNER RADII: cards 20-28, buttons 16, small badges/pills 12, full-round for circles.

═══════════════════════════════════════════
VISUAL DESIGN PRINCIPLES
═══════════════════════════════════════════

You are designing for visual impact. Every design should feel intentional, layered, and crafted.

COMPOSITION & LAYOUT:
- Use asymmetric layouts — offset content from center, use the rule of thirds.
- Create clear visual hierarchy: one dominant element (hero shape or large title), supporting elements, then details.
- Use generous negative space. Don't fill every pixel. Let elements breathe.
- Overlap elements for depth: a card slightly overlapping a colored band, text crossing a shape boundary, a circle peeking behind a card.
- Break the grid occasionally: a decorative circle at 50% opacity bleeding off the canvas edge, an accent bar at a slight diagonal.

DEPTH & LAYERING (this is critical — flat designs look amateur):
- Layer 1 (back): Full-bleed or large background shape with a subtle color. A soft tinted rect, or a large ellipse at 0.06 opacity for atmosphere.
- Layer 2: Mid-ground cards, colored panels, accent shapes. Use cornerRadius 20-28.
- Layer 3 (front): Text, small decorative elements (dots, thin lines, small ellipses).
- Use opacity (0.04-0.15) on large background shapes to create depth without overwhelming.
- Add subtle decorative elements: small circles (20-40px) at 0.2-0.4 opacity scattered as "confetti", thin accent lines, pill-shaped badges.

DECORATIVE TECHNIQUES (use 2-3 per design):
- Accent bars: thin rounded rects (4-8px tall, 60-120px wide) in accent colors, placed near titles or as dividers.
- Floating circles: large ellipses (100-300px) at very low opacity (0.04-0.1) behind content for atmosphere. Place them partially off-canvas for a cropped effect.
- Card shadows: simulate with a slightly larger, darker rect (2-4px offset, opacity 0.06-0.12) behind a white card.
- Dot accents: small ellipses (8-16px) in accent colors placed near headings or at grid intersections.
- Gradient simulation: stack 2-3 rects with different opacities of the same hue to simulate a gradient fade.
- Section dividers: full-width colored bands (10-15% of canvas height) to break content into zones.
- Icon-like shapes: combine a circle + small inner rect or ellipse to suggest icons (folder, star, etc.).

COLOR USAGE:
- Every design needs a "hero color moment" — one large shape or section in a bold brand color.
- Balance bold colored sections with generous white/light areas.
- Use 1 primary color, 1 accent color, and neutrals. Don't use more than 2 bright colors.
- For dark sections: use #1A1A2E or #2D2D44 background with white text and a bright accent color for pop.
- Text on colored backgrounds: always white (#FFFFFF) or very light. Never dark text on dark backgrounds.

WHAT MAKES A DESIGN LOOK PROFESSIONAL vs. AMATEUR:
✓ Professional: layered shapes creating depth, generous whitespace, one strong focal point, 2-3 decorative accents, consistent corner radii, thoughtful color hierarchy.
✗ Amateur: flat single-color background, evenly spaced items in a grid, no decorative elements, all text the same size, no visual hierarchy, every element same corner radius of 0.

AIM FOR 12-25 OBJECTS per design. Simple designs with 4-5 objects look empty. Rich, layered designs need decorative elements, background shapes, and visual texture.

═══════════════════════════════════════════
CANVAS & OBJECT TYPES
═══════════════════════════════════════════

CANVAS: The user specifies width and height. All objects must stay within bounds (decorative elements may bleed off edges slightly for cropped effect).

1. rect — Rectangle shape
   Fields: type:"rect", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, fill (hex), stroke (hex or ""), strokeWidth, cornerRadius

2. ellipse — Ellipse/circle
   Fields: type:"ellipse", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, fill (hex), stroke (hex or ""), strokeWidth

3. text — Text label
   Fields: type:"text", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, text (string), fontSize, fontFamily:"Arial"|"Georgia", fontStyle:"normal"|"bold"|"italic"|"bold italic", fill (hex), align:"left"|"center"|"right", lineHeight

4. line — Straight line
   Fields: type:"line", id, name, x:0, y:0, width:0, height:0, rotation:0, opacity:1, visible:true, locked:false, points:[x1,y1,x2,y2], stroke (hex), strokeWidth, lineCap:"round", lineJoin:"round"

5. interactive — Interactive component with grouped children and interaction behavior.
   Fields: type:"interactive", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, interactionType, interactionConfig, groups (array), childIds (string[]), children (rect/ellipse/text/line objects with LOCAL coordinates)

   interactionTypes:

   a) "flip-card" — Flips between front/back.
      config: { flipDuration:500, flipDirection:"horizontal"|"vertical", defaultSide:"front" }
      groups: [ {role:"front", label:"Front", objectIds:[...]}, {role:"back", label:"Back", objectIds:[...]} ]
      Use for: flashcards, Q&A, vocabulary, before/after. Design both sides — front bold and inviting, back informative.

   b) "bottom-sheet" — Button opens a sliding panel.
      config: { sheetHeightPercent:60, backdropOpacity:0.4, slideDuration:300, dismissOnBackdropTap:true }
      groups: [ {role:"trigger", label:"Trigger", objectIds:[...]}, {role:"content", label:"Content", objectIds:[...]} ]
      Use for: "Learn More", supplementary details. Make the trigger button visually prominent with rounded corners and a bold fill.

   c) "expandable" — Collapsible section.
      config: { defaultExpanded:false, expandDuration:300, easing:"ease-in-out" }
      groups: [ {role:"header", label:"Header", objectIds:[...]}, {role:"body", label:"Body", objectIds:[...]} ]
      Use for: FAQ, step-by-step content, categorized info. Style headers as rounded cards.

   d) "entrance" — Animated reveal on load/scroll.
      config: { animation:"fade-in"|"slide-up"|"scale-up"|"bounce", duration:500, staggerDelay:100, trigger:"on-load" }
      groups: [ {role:"content", label:"Content", objectIds:[...]} ]
      Use for: hero sections, card sequences. Makes the design feel alive.

WHEN TO USE INTERACTIVE COMPONENTS:
- Educational or informational content → always include at least one.
- Q&A or two-sided info → flip-card
- Dense detail that would clutter → bottom-sheet
- Multiple sections or steps → expandable
- Card sequences or hero content → entrance animation
- You can combine static and interactive objects freely.

═══════════════════════════════════════════
STRUCTURAL RULES
═══════════════════════════════════════════

- Use sequential IDs: "ai_0", "ai_1", "ai_2", etc. (top-level and children).
- Z-order: earlier objects render behind later ones. Background → decorative → cards → text.
- Leave padding (at least 5% of canvas width) on left/right edges, and 20-40px top/bottom.
- Every design must have visual depth — at minimum a tinted background shape + decorative accents behind the main content.
- CANVAS HEIGHT: If the content requires more vertical space, set canvas.height larger than the provided value. The canvas scrolls vertically. For N stacked items, estimate: header(~120px) + N * (item_height + gap) + footer_padding(~60px).
- INTERACTIVE COMPONENT SIZING: Flip cards should be roughly canvas_width - 40px wide and 180-250px tall. Bottom sheets / expandables should be full-width minus padding. Give each interactive component enough height for its children to display comfortably.

OUTPUT FORMAT (strict JSON, no markdown, no commentary):
{
  "version": 1,
  "canvas": { "width": <number>, "height": <number>, "background": "<hex>" },
  "objects": [ ... ],
  "assets": {}
}`;

function buildUserPrompt(request: GenerateRequest, templateSkeleton: string | null): string {
  const lines: string[] = [];
  lines.push(`Canvas size: ${request.canvas.width}x${request.canvas.height} pixels.`);

  if (templateSkeleton) {
    lines.push(
      `Use this layout skeleton as a starting point. Preserve the general positioning but fill in content, refine colors, and adjust sizes to look polished:`,
    );
    lines.push(templateSkeleton);
  }

  if (request.mode === 'structured' && request.structured) {
    lines.push(`Create a design with the following content:`);
    if (request.structured.title) lines.push(`Title: "${request.structured.title}"`);
    if (request.structured.subtitle) lines.push(`Subtitle: "${request.structured.subtitle}"`);
    if (request.structured.bodyText) lines.push(`Body text: "${request.structured.bodyText}"`);
    if (request.structured.accentColor)
      lines.push(`Use this accent color prominently: ${request.structured.accentColor}`);
    if (request.structured.style)
      lines.push(`Design style: ${request.structured.style} (adapt typography, shapes, and spacing to match this aesthetic)`);
  } else if (request.mode === 'prompt' && request.prompt) {
    lines.push(`Design request: ${request.prompt}`);
  }

  lines.push(`
CRITICAL REMINDERS:
- Generate ALL items the user requested. If they said 10, make 10. If they said 5, make 5. NEVER reduce quantity.
- If the items won't fit, INCREASE canvas.height (the canvas scrolls). Do NOT shrink or skip items.
- Use placeholder text for content ("Myth #1", "Fact #1", "Description goes here...").
- Start with a header section (title + decorative accents), then stack the main content below.
- Each interactive component (flip card, expandable, etc.) needs properly sized children with backgrounds, text, and padding.
- Add visual richness: tinted background rect, decorative floating circles at low opacity, accent bars, dot accents.
- Use Georgia for headlines, Arial for body text.
- Every design needs visual depth — layered shapes, varied opacity, rounded corners.
Return ONLY the JSON object.`);

  return lines.join('\n');
}

// Process a single static object (rect, ellipse, text, line) — used for both
// top-level objects and children inside interactive components.
function processStaticObject(obj: Record<string, unknown>, boundsW: number, boundsH: number): Record<string, unknown> | null {
  const type = obj.type as string;
  if (!VALID_STATIC_TYPES.has(type)) return null;

  const base: Record<string, unknown> = {
    ...obj,
    id: generateId(),
    visible: obj.visible ?? true,
    locked: obj.locked ?? false,
    rotation: obj.rotation ?? 0,
    opacity: clamp((obj.opacity as number) ?? 1, 0, 1),
    x: clamp((obj.x as number) ?? 0, -boundsW * 0.5, boundsW * 1.5),
    y: clamp((obj.y as number) ?? 0, -boundsH * 0.5, boundsH * 1.5),
    width: Math.max((obj.width as number) ?? 10, 1),
    height: Math.max((obj.height as number) ?? 10, 1),
    name: obj.name || `${type}`,
  };

  if (type === 'text') {
    if (!VALID_FONT_STYLES.has(base.fontStyle as string)) base.fontStyle = 'normal';
    if (!VALID_ALIGNS.has(base.align as string)) base.align = 'left';
    if (!isValidHex(base.fill as string)) base.fill = '#111111';
    base.fontFamily = base.fontFamily || 'Arial';
    base.fontSize = base.fontSize || 24;
    base.lineHeight = base.lineHeight || 1.2;
    base.text = base.text ?? '';
  }

  if (type === 'rect' || type === 'ellipse') {
    if (!isValidHex(base.fill as string)) base.fill = '#7B68EE';
    if (base.stroke && !isValidHex(base.stroke as string)) base.stroke = '';
    base.strokeWidth = base.strokeWidth ?? 0;
  }

  if (type === 'rect') {
    base.cornerRadius = base.cornerRadius ?? 0;
  }

  if (type === 'line') {
    if (!isValidHex(base.stroke as string)) base.stroke = '#111111';
    base.strokeWidth = base.strokeWidth ?? 3;
    base.lineCap = base.lineCap || 'round';
    base.lineJoin = base.lineJoin || 'round';
    if (!Array.isArray(base.points) || (base.points as number[]).length < 4) {
      base.points = [0, 0, 100, 0];
    }
  }

  return base;
}

function processAIDocument(raw: DesignDocument): DesignDocument {
  const { canvas, objects } = raw;
  const w = canvas.width;
  const h = canvas.height;

  const processed: DesignObject[] = [];

  for (const obj of objects) {
    if (!VALID_ALL_TYPES.has(obj.type)) continue;

    // Handle interactive components
    if (obj.type === 'interactive') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = obj as any;
      if (!VALID_INTERACTION_TYPES.has(raw.interactionType)) continue;

      const compId = generateId();
      const compW = Math.max(raw.width ?? 300, 1);
      const compH = Math.max(raw.height ?? 200, 1);

      // Process children — they use local coordinates relative to the component
      const rawChildren = Array.isArray(raw.children) ? raw.children : [];
      const processedChildren: Record<string, unknown>[] = [];
      // Map old AI IDs → new IDs for group objectIds
      const idMap = new Map<string, string>();

      for (const child of rawChildren) {
        const oldId = child.id as string;
        const processed = processStaticObject(child as Record<string, unknown>, compW, compH);
        if (processed) {
          if (oldId) idMap.set(oldId, processed.id as string);
          processedChildren.push(processed);
        }
      }

      // Remap group objectIds
      const groups = Array.isArray(raw.groups)
        ? raw.groups.map((g: Record<string, unknown>) => ({
            role: g.role || 'content',
            label: g.label || String(g.role || 'Content'),
            objectIds: Array.isArray(g.objectIds)
              ? (g.objectIds as string[])
                  .map((oldId) => idMap.get(oldId) ?? oldId)
                  .filter((id) => processedChildren.some((c) => c.id === id))
              : [],
          }))
        : [{ role: 'content', label: 'Content', objectIds: processedChildren.map((c) => c.id as string) }];

      const interactiveObj = {
        id: compId,
        type: 'interactive' as const,
        name: raw.name || 'Interactive Component',
        x: clamp(raw.x ?? 0, -w * 0.5, w * 1.5),
        y: clamp(raw.y ?? 0, -h * 0.5, h * 1.5),
        width: compW,
        height: compH,
        rotation: 0,
        opacity: clamp(raw.opacity ?? 1, 0, 1),
        visible: true,
        locked: false,
        interactionType: raw.interactionType,
        interactionConfig: raw.interactionConfig || {},
        groups,
        childIds: processedChildren.map((c) => c.id as string),
        children: processedChildren,
      };

      processed.push(interactiveObj as unknown as DesignObject);
      continue;
    }

    // Static objects
    const result = processStaticObject(obj as unknown as Record<string, unknown>, w, h);
    if (result) {
      processed.push(result as unknown as DesignObject);
    }
  }

  const hasInteractive = processed.some((o) => o.type === 'interactive');

  return {
    version: hasInteractive ? 2 : 1,
    canvas: {
      width: w,
      height: h,
      background: isValidHex(canvas.background) ? canvas.background : '#FFFFFF',
    },
    objects: processed,
    assets: {},
  };
}

export interface UseAIGenerateReturn {
  generate: (request: GenerateRequest) => Promise<DesignDocument | null>;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAIGenerate(): UseAIGenerateReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const generate = useCallback(
    async (request: GenerateRequest): Promise<DesignDocument | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error(
            'OpenAI API key not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.',
          );
        }

        // Build template skeleton if needed
        let templateSkeleton: string | null = null;
        if (request.templateId) {
          templateSkeleton = getTemplateSkeleton(
            request.templateId,
            request.canvas.width,
            request.canvas.height,
          );
        }

        const userPrompt = buildUserPrompt(request, templateSkeleton);

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 16384,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error('OpenAI error:', res.status, errBody);
          throw new Error('AI generation failed. Please try again.');
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('Empty response from AI.');
        }

        const raw = JSON.parse(content) as DesignDocument;

        if (!raw.canvas || !Array.isArray(raw.objects)) {
          throw new Error('AI returned an invalid design structure.');
        }

        return processAIDocument(raw);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return { generate, isGenerating, error, clearError };
}
