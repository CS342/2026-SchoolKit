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

const VALID_TYPES = new Set(['rect', 'ellipse', 'text', 'line']);
const VALID_FONT_STYLES = new Set(['normal', 'bold', 'italic', 'bold italic']);
const VALID_ALIGNS = new Set(['left', 'center', 'right']);
const HEX_REGEX = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

function isValidHex(color: string): boolean {
  return typeof color === 'string' && HEX_REGEX.test(color);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const SYSTEM_PROMPT = `You are a design layout generator. You output ONLY valid JSON representing a DesignDocument.

CANVAS: The user will specify canvas width and height. All objects must stay within these bounds.

AVAILABLE OBJECT TYPES:

1. rect — Rectangle shape
   Required fields: type:"rect", id (string), name (string), x, y, width, height (numbers), rotation:0, opacity:1, visible:true, locked:false, fill (hex color), stroke (hex or ""), strokeWidth (number), cornerRadius (number)

2. ellipse — Ellipse/circle
   Required fields: type:"ellipse", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, fill (hex), stroke (hex or ""), strokeWidth

3. text — Text label
   Required fields: type:"text", id, name, x, y, width, height, rotation:0, opacity:1, visible:true, locked:false, text (string content), fontSize (number), fontFamily:"Arial", fontStyle:"normal"|"bold"|"italic"|"bold italic", fill (hex), align:"left"|"center"|"right", lineHeight:1.2

4. line — Straight line
   Required fields: type:"line", id, name, x:0, y:0, width:0, height:0, rotation:0, opacity:1, visible:true, locked:false, points:[x1,y1,x2,y2], stroke (hex), strokeWidth, lineCap:"round", lineJoin:"round"

DESIGN RULES:
- Use sequential IDs: "ai_0", "ai_1", "ai_2", etc.
- Objects earlier in the array render BEHIND later objects (z-order).
- Place background shapes first, then accent elements, then text on top.
- Ensure text is readable: use dark text on light backgrounds, light text on dark backgrounds.
- Use harmonious color palettes. Keep to 3-5 colors.
- Leave padding/margins around edges (at least 5% of canvas dimensions).
- Text fontSize should be proportional to canvas size (titles: 4-6% of width, body: 2-3%).
- Make designs visually appealing with layered shapes, accent bars, and decorative elements.

OUTPUT FORMAT (strict JSON, no markdown):
{
  "version": 1,
  "canvas": { "width": <number>, "height": <number>, "background": "<hex>" },
  "objects": [ ...array of objects... ],
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

  lines.push(
    `Generate a complete, visually appealing design document. Include background shapes, accent elements, and properly positioned text. Return ONLY the JSON object.`,
  );

  return lines.join('\n');
}

function processAIDocument(raw: DesignDocument): DesignDocument {
  const { canvas, objects } = raw;
  const w = canvas.width;
  const h = canvas.height;

  const processed: DesignObject[] = [];

  for (const obj of objects) {
    if (!VALID_TYPES.has(obj.type)) continue;

    const base = {
      ...obj,
      id: generateId(),
      visible: obj.visible ?? true,
      locked: obj.locked ?? false,
      rotation: obj.rotation ?? 0,
      opacity: clamp(obj.opacity ?? 1, 0, 1),
      x: clamp(obj.x ?? 0, -w * 0.5, w * 1.5),
      y: clamp(obj.y ?? 0, -h * 0.5, h * 1.5),
      width: Math.max(obj.width ?? 10, 1),
      height: Math.max(obj.height ?? 10, 1),
      name: obj.name || `${obj.type} ${processed.length + 1}`,
    };

    if (obj.type === 'text') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textObj = base as any;
      if (!VALID_FONT_STYLES.has(textObj.fontStyle)) {
        textObj.fontStyle = 'normal';
      }
      if (!VALID_ALIGNS.has(textObj.align)) {
        textObj.align = 'left';
      }
      if (!isValidHex(textObj.fill)) {
        textObj.fill = '#111111';
      }
      textObj.fontFamily = textObj.fontFamily || 'Arial';
      textObj.fontSize = textObj.fontSize || 24;
      textObj.lineHeight = textObj.lineHeight || 1.2;
      textObj.text = textObj.text || '';
    }

    if (obj.type === 'rect' || obj.type === 'ellipse') {
      const shapeObj = base as Record<string, unknown>;
      if (!isValidHex(shapeObj.fill as string)) {
        shapeObj.fill = '#7B68EE';
      }
      if (shapeObj.stroke && !isValidHex(shapeObj.stroke as string)) {
        shapeObj.stroke = '';
      }
      shapeObj.strokeWidth = shapeObj.strokeWidth ?? 0;
    }

    if (obj.type === 'rect') {
      const rectObj = base as Record<string, unknown>;
      rectObj.cornerRadius = rectObj.cornerRadius ?? 0;
    }

    if (obj.type === 'line') {
      const lineObj = base as Record<string, unknown>;
      if (!isValidHex(lineObj.stroke as string)) {
        lineObj.stroke = '#111111';
      }
      lineObj.strokeWidth = lineObj.strokeWidth ?? 3;
      lineObj.lineCap = lineObj.lineCap || 'round';
      lineObj.lineJoin = lineObj.lineJoin || 'round';
      if (!Array.isArray(lineObj.points) || lineObj.points.length < 4) {
        lineObj.points = [0, 0, 100, 0];
      }
    }

    processed.push(base as DesignObject);
  }

  return {
    version: 1,
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
            max_tokens: 4096,
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
