import { useState, useCallback } from 'react';
import { generateId } from '../utils/defaults';
import { getTemplateSkeleton } from '../utils/ai-templates';
import { supabase } from '../../../lib/supabase';
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
  existingDocument?: DesignDocument;
}

const VALID_STATIC_TYPES = new Set(['rect', 'ellipse', 'text', 'line', 'star', 'triangle', 'arrow', 'badge']);
const VALID_ALL_TYPES = new Set(['rect', 'ellipse', 'text', 'line', 'star', 'triangle', 'arrow', 'badge', 'interactive']);
const VALID_INTERACTION_TYPES = new Set(['flip-card', 'bottom-sheet', 'expandable', 'entrance', 'carousel', 'tabs', 'quiz']);
const VALID_FONT_STYLES = new Set(['normal', 'bold', 'italic', 'bold italic']);
const VALID_ALIGNS = new Set(['left', 'center', 'right']);
const HEX_REGEX = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

function isValidHex(color: string): boolean {
  return typeof color === 'string' && HEX_REGEX.test(color);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const SYSTEM_PROMPT = `You are an expert visual designer generating layouts for SchoolKit, a polished educational mobile app. You output ONLY valid JSON representing a DesignDocument. Your designs should look like professionally hand-crafted educational pages — colorful cards with borders, index card lines, pastel palettes, and deliberate typography. Never generic or flat.

═══════════════════════════════════════════
RULE #1: CONTENT FIDELITY (HIGHEST PRIORITY)
═══════════════════════════════════════════

You MUST generate ALL the content the user asks for. If they ask for "10 cards", you generate 10 cards. If they ask for "5 bullet points", you generate 5 bullet points. NEVER truncate, summarize, or reduce the quantity. This is the single most important rule.

CANVAS EXTENSION: If the requested content won't fit on the given canvas, INCREASE canvas.height to accommodate. The canvas is scrollable. A 390x844 canvas requesting 10 cards should become 390x4000+ to fit them all with proper spacing. Always add extra height rather than cramming or cutting content.

CONTENT TEXT: Use clear placeholder text. For numbered items use "Myth #1", "Fact #1", "Step 1", etc. For body text use descriptive placeholders like "Description goes here..." or "Tap to learn more". Don't generate long real educational content — keep text short and placeholder-like so the user can fill in their own.

SPACING FOR MULTIPLE ITEMS: When generating many similar items (cards, sections, etc.), space them evenly with generous gaps (30-50px between items). The first item should start after any header section. Stack items vertically.

═══════════════════════════════════════════
COLOR STRATEGY (TWO LAYERS)
═══════════════════════════════════════════

This app has a refined, modern, approachable aesthetic — soft but not childish, colorful but not chaotic.

LAYER 1 — BRAND COLORS (for headers, CTAs, navigation):
- Primary: #7B68EE (medium slate blue). Hero backgrounds, prominent accents, key buttons.
- Primary dark: #5B4BC7. For contrast against lighter purple.
- Primary light: #9B6EE8. Soft accents, secondary fills.
- Background: #FBF9FF (main), #F0EBFF (tinted sections), #F8F5FF (inputs/insets)
- Text: #2D2D44 (headings), #6B6B85 (body), #8E8EA8 (captions/secondary), #FFFFFF (on dark)
- Borders: #E8E8F0, #E8E0F0 (subtle card edges)

LAYER 2 — CONTENT-THEMED PASTELS (for cards, sections, backgrounds):
For every design, pick 5-8 coordinated pastel colors based on the content topic. Each card or section gets its own pastel fill with a matching darker border. This is what makes designs feel hand-crafted rather than generic.

Example palettes by theme:
- Health/Medical: #f4978e (pink), #FFB7B2 (light pink), #FFDAC1 (peach), #E2F0CB (mint), #B5EAD7 (sage), #C7CEEA (periwinkle), #90E0EF (sky), #CDB4DB (lilac)
- School/Study: #7EC8E3 (sky blue), #95D1BB (sage), #C5A3D6 (soft purple), #F4A97B (warm peach), #F7C59F (light orange), #A8C5F0 (periwinkle)
- Social/Support: #E07A70 (coral), #7AC5D8 (teal), #E0BFA0 (sand), #C2D5A8 (sage), #95D1BB (mint), #AAB3D6 (periwinkle), #B29AC3 (lilac)
- General: mix any 5-8 soft, distinct pastels that feel cohesive

For each card: use the pastel as fill, and use a slightly darker/saturated version of the same hue as the 2-3px border (stroke). Example: fill #B5EAD7, stroke #7BC8A4.

COLOR USAGE:
- Every design needs a "hero color moment" — one large shape or section in a bold brand color or vibrant pastel.
- Balance bold colored sections with generous white/light areas.
- Use 1 primary color + 5-8 pastel accents. Each card should feel like its own color.
- Text on colored card backgrounds: use #2D2D44 (dark) for pastels, #FFFFFF for dark backgrounds.

═══════════════════════════════════════════
TYPOGRAPHY (SPECIFIC SIZES)
═══════════════════════════════════════════

Use fontFamily "Georgia" for display/headlines. Use fontFamily "Arial" for body text and UI labels.

- Page titles: fontSize 32-34, fontStyle "bold", fontFamily "Georgia", lineHeight 1.2. Make key words a different fill color (accent pastel or brand color) for visual interest.
- Section headings: fontSize 20-24, fontStyle "bold", fontFamily "Georgia"
- Body text: fontSize 15-18, fontStyle "normal", fontFamily "Arial", lineHeight 1.5-1.6
- Captions/labels: fontSize 13-15, fill #8E8EA8 or #6B6B85
- Card titles: fontSize 18-24, fontStyle "bold"
- Large display numbers: fontSize 32-40, fontStyle "bold" (for stats, counters)

Use font size contrast dramatically — a 34px title next to 13px caption creates energy.

CORNER RADII: cards 20, buttons 16, small badges/pills 12, full-round for circles.

═══════════════════════════════════════════
CARD-BASED LAYOUT PATTERNS
═══════════════════════════════════════════

These patterns come from SchoolKit's best hand-crafted pages. Use them as building blocks.

TWO-COLUMN GRID (for 390px wide canvas):
- Left card: x=20, width=167
- Right card: x=203, width=167
- Gap between cards: 16px
- Each card: cornerRadius 20, fill (pastel), stroke (darker pastel), strokeWidth 2-3
- Card height: 140-180px depending on content
- Vertical gap between rows: 16-20px

STACKED CARD PATTERN (vertical list):
- Full-width cards: x=20, width=350 (for 390px canvas)
- Vertical spacing: 120-160px between card tops (cards can overlap slightly for depth)
- Each card gets a different pastel from the palette
- Each card: cornerRadius 20, stroke matching fill hue, strokeWidth 2-3

CARD STYLING (apply to ALL cards):
- Border: strokeWidth 2-3, stroke color is a darker shade of the fill color
- Corner radius: 20
- Shadow: shadow:{color:"rgba(0,0,0,0.1)",offsetX:0,offsetY:6,blur:12} — REQUIRED on every card
- Padding: place text children 16-20px inset from card edges

INDEX CARD LINES (signature detail — add to cards):
Place 2-3 thin horizontal rects at the bottom of each card:
- Each line: type "rect", width = card width - 40px (centered), height 2, cornerRadius 1
- Position at bottom of card, spaced 4-6px apart
- Use the card's fill color with decreasing opacity: 0.4, 0.3, 0.2
- Example for a card at y=200, height=160: lines at y=340, y=346, y=352

FULL-WIDTH COLORED SECTIONS:
- Background zone: x=0, width=canvas width, fill=soft pastel at 0.3-0.5 opacity
- Use to create visual "chapters" that break up content
- Place content cards on top of these colored zones

═══════════════════════════════════════════
VISUAL DESIGN PRINCIPLES
═══════════════════════════════════════════

COMPOSITION & LAYOUT:
- Use asymmetric layouts — offset content from center, use the rule of thirds.
- Create clear visual hierarchy: one dominant element (hero shape or large title), supporting elements, then details.
- Use generous negative space. Don't fill every pixel. Let elements breathe.
- Overlap elements for depth: a card slightly overlapping a colored band, text crossing a shape boundary, a circle peeking behind a card.

DEPTH & LAYERING (this is critical — flat designs look amateur):
- Layer 1 (back): Full-bleed or large background shape with a subtle color. A soft tinted rect, or a large ellipse at 0.06 opacity for atmosphere.
- Layer 2: Mid-ground cards with pastel fills, borders, and shadows.
- Layer 3 (front): Text, badges, index card lines, small decorative elements.
- Use opacity (0.04-0.15) on large background shapes to create depth without overwhelming.

DECORATIVE TECHNIQUES (use 2-3 per design):
- Accent bars: thin rounded rects (4-8px tall, 60-120px wide) in accent colors, placed near titles or as dividers.
- Floating circles: large ellipses (100-300px) at very low opacity (0.04-0.1) behind content for atmosphere.
- Badges: pill-shaped labels for categories, tags, status indicators (type "badge").
- Section dividers: full-width colored bands to break content into zones.
- Index card lines: thin rects at bottom of cards (see CARD-BASED LAYOUT PATTERNS above).

═══════════════════════════════════════════
VISUAL EFFECTS GUIDELINES
═══════════════════════════════════════════

- Shadows on ALL cards — REQUIRED, not optional: shadow:{color:"rgba(0,0,0,0.1)",offsetX:0,offsetY:6,blur:12}
- Card borders (2-3px) as a signature detail — every card rect needs a stroke matching its fill hue but darker
- Gradients on hero backgrounds and CTA sections: gradient:{type:"linear",colors:["#7B68EE","#5B4BC7"],angle:135}
- Index card lines at bottom of cards (see CARD-BASED LAYOUT PATTERNS)
- Badges for category labels, status indicators, and tags

AIM FOR 15-40 OBJECTS per design. Content-heavy educational pages need more objects to feel complete — cards, text, lines, badges, and background elements all add up.

═══════════════════════════════════════════
CANVAS & OBJECT TYPES
═══════════════════════════════════════════

CANVAS: The user specifies width and height. All objects must stay within bounds (decorative elements may bleed off edges slightly for cropped effect).

1. rect — Rectangle shape
   Fields: type:"rect", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, fill (hex), stroke (hex or ""), strokeWidth, cornerRadius
   Optional effects: gradient:{type:"linear"|"radial",colors:["#hex1","#hex2"],angle:number}, shadow:{color:string,offsetX:number,offsetY:number,blur:number}

2. ellipse — Ellipse/circle
   Fields: type:"ellipse", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, fill (hex), stroke (hex or ""), strokeWidth
   Optional effects: gradient, shadow (same as rect)

3. text — Text label
   Fields: type:"text", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, text (string), fontSize, fontFamily:"Arial"|"Georgia", fontStyle:"normal"|"bold"|"italic"|"bold italic", fill (hex), align:"left"|"center"|"right", lineHeight
   Optional: shadow (same as rect, useful for text on images)

4. line — Straight line
   Fields: type:"line", id, name, x:0, y:0, width:0, height:0, rotation:0, opacity:1, visible:true, locked:false, points:[x1,y1,x2,y2], stroke (hex), strokeWidth, lineCap:"round", lineJoin:"round"

5. badge — Pill-shaped label
   Fields: type:"badge", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, text (string), fontSize, fontFamily, fontStyle, textColor (hex), fill (hex), cornerRadius, paddingX, paddingY
   Optional: gradient, shadow
   Use for: tags, categories, status labels, counts

6. interactive — Interactive component with grouped children and interaction behavior.
   Fields: type:"interactive", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, interactionType, interactionConfig, groups (array), childIds (string[]), children (static objects with LOCAL coordinates)

   interactionTypes:

   a) "flip-card" — Flips between front/back. GREAT for myth/fact, Q&A, vocabulary, before/after.
      config: { flipDuration:500, flipDirection:"horizontal"|"vertical", defaultSide:"front" }
      groups: [ {role:"front", label:"Front", objectIds:[...]}, {role:"back", label:"Back", objectIds:[...]} ]
      BEST PRACTICES for flip-cards:
      - Front: pastel fill rect + bold title text + badge (e.g. "MYTH" or "Q") + "Tap to flip" hint text
      - Back: white or light fill rect + body text with answer/fact + badge (e.g. "FACT" or "A")
      - Give each flip-card its own pastel from the palette
      - Add index card lines on both front and back
      - Add a 2-3px border (stroke) on the background rects

   b) "bottom-sheet" — Button opens sliding panel(s). GREAT for "learn more" detail, supplementary info.
      config: { sheetHeightPercent:60, backdropOpacity:0.4, slideDuration:300, dismissOnBackdropTap:true }
      groups: [ {role:"trigger", label:"Trigger", objectIds:[...]}, {role:"content", label:"Sheet 1", objectIds:[...]}, {role:"content-1", label:"Sheet 2", objectIds:[...]} ]
      Single content group also works: [ {role:"trigger",...}, {role:"content", label:"Content",...} ]
      Use role "content" for the first sheet, "content-1" for the second, "content-2" for the third, etc. (max 10 content groups).
      Each content group should have its own background rect, title text, and body text as children.
      BEST PRACTICES:
      - Trigger: a card rect with shadow + title text + "Tap to learn more" caption
      - Sheet content: white background + title + body text with generous padding

   c) "expandable" — Collapsible section.
      config: { defaultExpanded:false, expandDuration:300, easing:"ease-in-out" }
      groups: [ {role:"header", label:"Header", objectIds:[...]}, {role:"body", label:"Body", objectIds:[...]} ]

   d) "entrance" — Animated reveal on load/scroll. GREAT for wrapping card sequences.
      config: { animation:"fade-in"|"slide-up"|"scale-up"|"bounce", duration:500, staggerDelay:100, trigger:"on-load" }
      groups: [ {role:"content", label:"Content", objectIds:[...]} ]
      BEST PRACTICES:
      - Wrap groups of related cards in an entrance animation for polished reveal
      - Use staggerDelay:100 so cards animate in one after another
      - "slide-up" and "fade-in" work best for card sequences

   e) "carousel" — Swipeable slides. Supports 2–10 slides.
      config: { autoPlay:false, autoPlayInterval:3000, showDots:true, showArrows:true, transitionDuration:300 }
      groups: [ {role:"slide-0", label:"Slide 1", objectIds:[...]}, {role:"slide-1", label:"Slide 2", objectIds:[...]}, ... ]
      Generate as many slide-N groups as the content requires (min 2, max 10). Each slide group has its own background and text children.
      Use for: image galleries, multi-step instructions, before/after comparisons.

   f) "tabs" — Tabbed content. Supports 2–10 tabs.
      config: { defaultTab:0, tabPosition:"top"|"bottom", tabStyle:"underline"|"pill"|"boxed" }
      groups: [ {role:"tab-0", label:"Tab 1", objectIds:[...]}, {role:"tab-1", label:"Tab 2", objectIds:[...]}, ... ]
      Generate as many tab-N groups as the content requires (min 2, max 10). Each tab group has its own background, header, label, and content text children.
      Use for: categorized content, different views of same topic.

   g) "quiz" — Knowledge check with answer feedback.
      config: { questionText:"...", options:["A","B","C","D"], correctIndex:0, showFeedback:true, feedbackCorrect:"Great!", feedbackIncorrect:"Try again!" }
      groups: [ {role:"question", label:"Question", objectIds:[...]}, {role:"feedback", label:"Feedback", objectIds:[...]} ]
      Use for: knowledge checks, self-assessment, gamified learning.

INTERACTIVE COMPONENT STRATEGY (aim for 2-4 per educational page):
- Educational or informational content → always include at least one interactive component.
- Q&A, myth/fact, or two-sided info → flip-card (with pastel fronts + white backs + badges)
- Dense detail that would clutter → bottom-sheet (use multiple content groups for multi-step info)
- Multiple sections or steps → expandable
- Card sequences or hero content → wrap in entrance animation (staggerDelay: 100ms)
- Image galleries, step-by-step walkthroughs → carousel
- Categorized content → tabs
- Knowledge checks, quizzes → quiz
- COMBINE types: e.g. a grid of flip-cards wrapped in an entrance animation, or bottom-sheets inside tabs

COMPOUND LAYOUT PATTERNS (compose these using primitives):
- Info Card: background rect (pastel fill, darker stroke, shadow) + title text + body text + index card lines + badge
- Stat Counter: large number text + label text + accent bar rect
- Quote Block: large quote mark text + quote body + attribution + accent line
- CTA Block: gradient background rect + headline text + button rect + button text
- Header Section: full-width gradient rect + title (with accent-colored key word) + subtitle + decorative accent bar

═══════════════════════════════════════════
STRUCTURAL RULES
═══════════════════════════════════════════

- Use sequential IDs: "ai_0", "ai_1", "ai_2", etc. (top-level and children).
- Z-order: earlier objects render behind later ones. Background → colored sections → cards → text → badges → index card lines.
- Leave padding (at least 5% of canvas width) on left/right edges, and 20-40px top/bottom.
- Every design must have visual depth — at minimum a tinted background shape + decorative accents behind the main content.
- CANVAS HEIGHT: If the content requires more vertical space, set canvas.height larger than the provided value. The canvas scrolls vertically.
- INTERACTIVE COMPONENT SIZING: Give each interactive component enough height for its children to display comfortably.
- INTERACTIVE COMPONENT WIDTH: All interactive components (bottom-sheet, expandable, carousel, tabs, flip-card, quiz, entrance) MUST be full canvas width: x:0, width equal to canvas width. These components are rendered as full-width blocks — partial widths will look broken.

OUTPUT FORMAT (strict JSON, no markdown, no commentary):
{
  "version": 1,
  "canvas": { "width": <number>, "height": <number>, "background": "<hex>" },
  "objects": [ ... ],
  "assets": {}
}`;

/** Produce compact JSON of an existing design, stripping default values to reduce token count. */
function serializeForPrompt(doc: DesignDocument): string {
  const DEFAULTS: Record<string, unknown> = {
    visible: true,
    locked: false,
    rotation: 0,
    opacity: 1,
  };

  function stripDefaults(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key in DEFAULTS && value === DEFAULTS[key]) continue;
      if (Array.isArray(value)) {
        out[key] = value.map((item) =>
          item && typeof item === 'object' && !Array.isArray(item)
            ? stripDefaults(item as Record<string, unknown>)
            : item,
        );
      } else if (value && typeof value === 'object') {
        out[key] = stripDefaults(value as Record<string, unknown>);
      } else {
        out[key] = value;
      }
    }
    return out;
  }

  const compact = {
    canvas: doc.canvas,
    objects: doc.objects.map((o) => stripDefaults(o as unknown as Record<string, unknown>)),
  };
  return JSON.stringify(compact);
}

function buildUserPrompt(request: GenerateRequest, templateSkeleton: string | null): string {
  const lines: string[] = [];
  const isEditMode = !!request.existingDocument;

  lines.push(`Canvas size: ${request.canvas.width}x${request.canvas.height} pixels.`);

  // ── Edit mode: inject existing design ──
  if (isEditMode) {
    const serialized = serializeForPrompt(request.existingDocument!);
    lines.push(`
═══ EDIT MODE ═══
You are EDITING an existing design. Here is the current design JSON:
${serialized}

EDIT RULES:
- Preserve ALL existing objects unless the user explicitly asks to remove or change them.
- Keep existing IDs, positions, sizes, and colors unless the change requires modifying them.
- Only add, remove, or modify what the user's instruction describes.
- Return the COMPLETE design (all objects, not just changed ones).
- You may increase canvas.height if new content requires more space.
═════════════════`);

    lines.push(`Edit instruction: ${request.prompt || 'Improve the design'}`);

    lines.push(`
CRITICAL REMINDERS:
- Return the COMPLETE design JSON including ALL objects (modified and unmodified).
- Only change what the user asked for. Preserve everything else exactly.
- Keep the same visual style, colors, and layout unless the user says otherwise.
- If adding new elements, place them logically relative to existing content.
- You may increase canvas.height if needed to fit new content.
Return ONLY the JSON object.`);

    return lines.join('\n');
  }

  // ── Create mode (original behavior) ──
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
- Start with a header section (title with accent-colored key word + decorative accents), then stack content below.
- Each interactive component needs properly sized children with backgrounds, text, and padding.
- PASTEL PALETTE: Pick 5-8 coordinated pastels based on the content topic. Each card gets its own pastel fill color.
- CARD BORDERS: Every card rect needs strokeWidth 2-3 with a stroke color that's a darker shade of its fill.
- INDEX CARD LINES: Add 2-3 thin rects (height 2, cornerRadius 1) at the bottom of each card with decreasing opacity (0.4, 0.3, 0.2).
- SHADOWS: Every card MUST have shadow:{color:"rgba(0,0,0,0.1)",offsetX:0,offsetY:6,blur:12}. No exceptions.
- ENTRANCE ANIMATIONS: Wrap card sequences in an entrance interactive with staggerDelay:100 for polished reveal.
- TWO-COLUMN GRIDS: For grid layouts on 390px canvas, use left card x=20 w=167, right card x=203 w=167.
- TYPOGRAPHY: Page titles 32-34px bold Georgia, section headings 20-24px bold, body 15-18px Arial, captions 13-15px.
- Use Georgia for headlines, Arial for body text.
- Aim for 15-40 objects — educational pages need more objects to feel content-rich and polished.
Return ONLY the JSON object.`);

  return lines.join('\n');
}

// Process a single static object — used for both
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
    // Sanitize shadow if present
    if (base.shadow && typeof base.shadow === 'object') {
      base.shadow = sanitizeShadow(base.shadow as Record<string, unknown>);
    }
  }

  if (type === 'rect' || type === 'ellipse') {
    if (!isValidHex(base.fill as string)) base.fill = '#7B68EE';
    if (base.stroke && !isValidHex(base.stroke as string)) base.stroke = '';
    base.strokeWidth = base.strokeWidth ?? 0;
    // Sanitize effects
    if (base.gradient && typeof base.gradient === 'object') {
      base.gradient = sanitizeGradient(base.gradient as Record<string, unknown>);
    }
    if (base.shadow && typeof base.shadow === 'object') {
      base.shadow = sanitizeShadow(base.shadow as Record<string, unknown>);
    }
    if (typeof base.blur === 'number') {
      base.blur = clamp(base.blur as number, 0, 20);
    }
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

  if (type === 'star') {
    if (!isValidHex(base.fill as string)) base.fill = '#F59E0B';
    if (base.stroke && !isValidHex(base.stroke as string)) base.stroke = '';
    base.strokeWidth = base.strokeWidth ?? 0;
    base.points = clamp((base.points as number) ?? 5, 3, 12);
    base.innerRadius = clamp((base.innerRadius as number) ?? 0.5, 0.3, 0.9);
    if (base.gradient && typeof base.gradient === 'object') {
      base.gradient = sanitizeGradient(base.gradient as Record<string, unknown>);
    }
    if (base.shadow && typeof base.shadow === 'object') {
      base.shadow = sanitizeShadow(base.shadow as Record<string, unknown>);
    }
  }

  if (type === 'triangle') {
    if (!isValidHex(base.fill as string)) base.fill = '#22C55E';
    if (base.stroke && !isValidHex(base.stroke as string)) base.stroke = '';
    base.strokeWidth = base.strokeWidth ?? 0;
    if (base.gradient && typeof base.gradient === 'object') {
      base.gradient = sanitizeGradient(base.gradient as Record<string, unknown>);
    }
    if (base.shadow && typeof base.shadow === 'object') {
      base.shadow = sanitizeShadow(base.shadow as Record<string, unknown>);
    }
  }

  if (type === 'arrow') {
    if (!isValidHex(base.stroke as string)) base.stroke = '#111111';
    if (!isValidHex(base.fill as string)) base.fill = '#111111';
    base.strokeWidth = base.strokeWidth ?? 3;
    base.pointerLength = base.pointerLength ?? 15;
    base.pointerWidth = base.pointerWidth ?? 12;
    if (!Array.isArray(base.points) || (base.points as number[]).length < 4) {
      base.points = [0, 0, 100, 0];
    }
  }

  if (type === 'badge') {
    if (!isValidHex(base.fill as string)) base.fill = '#7B68EE';
    if (!isValidHex(base.textColor as string)) base.textColor = '#FFFFFF';
    base.text = base.text ?? 'Badge';
    base.fontSize = base.fontSize ?? 14;
    base.fontFamily = base.fontFamily || 'Arial';
    if (!VALID_FONT_STYLES.has(base.fontStyle as string)) base.fontStyle = 'bold';
    base.cornerRadius = base.cornerRadius ?? 18;
    base.paddingX = base.paddingX ?? 16;
    base.paddingY = base.paddingY ?? 8;
    if (base.gradient && typeof base.gradient === 'object') {
      base.gradient = sanitizeGradient(base.gradient as Record<string, unknown>);
    }
    if (base.shadow && typeof base.shadow === 'object') {
      base.shadow = sanitizeShadow(base.shadow as Record<string, unknown>);
    }
  }

  return base;
}

function sanitizeGradient(g: Record<string, unknown>): Record<string, unknown> | null {
  const type = g.type as string;
  if (type !== 'linear' && type !== 'radial') return null;
  const colors = g.colors;
  if (!Array.isArray(colors) || colors.length < 2) return null;
  return {
    type,
    colors: colors.map((c: unknown) => (typeof c === 'string' && isValidHex(c) ? c : '#7B68EE')),
    angle: typeof g.angle === 'number' ? g.angle : 0,
  };
}

function sanitizeShadow(s: Record<string, unknown>): Record<string, unknown> | null {
  return {
    color: typeof s.color === 'string' ? s.color : 'rgba(0,0,0,0.1)',
    offsetX: typeof s.offsetX === 'number' ? s.offsetX : 0,
    offsetY: typeof s.offsetY === 'number' ? s.offsetY : 4,
    blur: typeof s.blur === 'number' ? clamp(s.blur as number, 0, 50) : 12,
  };
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

      // Force interactive components to full canvas width
      const interactiveObj = {
        id: compId,
        type: 'interactive' as const,
        name: raw.name || 'Interactive Component',
        x: 0,
        y: clamp(raw.y ?? 0, -h * 0.5, h * 1.5),
        width: w,
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
        const isEditMode = !!request.existingDocument;

        // Build template skeleton if needed (skip for edit mode)
        let templateSkeleton: string | null = null;
        if (!isEditMode && request.templateId) {
          templateSkeleton = getTemplateSkeleton(
            request.templateId,
            request.canvas.width,
            request.canvas.height,
          );
        }

        const userPrompt = buildUserPrompt(request, templateSkeleton);

        const { data, error: fnError } = await supabase.functions.invoke('generate-design', {
          body: {
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: isEditMode ? 0.4 : 0.7,
            max_tokens: 16384,
            apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
          },
        });

        if (fnError) {
          // Try to read the response body for the actual error message
          let errMsg = 'AI generation failed. Please try again.';
          try {
            if (fnError.context?.json) {
              const body = await fnError.context.json();
              console.error('Edge function error body:', body);
              errMsg = body?.error || errMsg;
            } else {
              console.error('Edge function error:', fnError.message, 'data:', data);
              errMsg = data?.error || fnError?.message || errMsg;
            }
          } catch {
            console.error('Edge function error:', fnError.message);
          }
          throw new Error(errMsg);
        }

        const parsed = (typeof data === 'string' ? JSON.parse(data) : data);

        // Edge function may return { error: "..." } with 200 status
        if (parsed?.error) {
          throw new Error(parsed.error);
        }

        const raw = parsed as DesignDocument;

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
