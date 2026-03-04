import type { DesignDocument } from '../types/document';

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  skeleton: (width: number, height: number) => DesignDocument;
}

// Standard shadow for all cards
const SHADOW = { color: 'rgba(0,0,0,0.1)', offsetX: 0, offsetY: 6, blur: 12 };

// Helper: create index card lines at the bottom of a card
function indexLines(
  startId: number,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  fillColor: string,
) {
  const lineW = cardW - 40;
  const lineX = cardX + 20;
  return [
    {
      id: `ai_${startId}`, type: 'rect' as const, name: 'Index Line 1',
      x: lineX, y: cardY + cardH - 22, width: lineW, height: 2,
      rotation: 0, opacity: 0.4, visible: true, locked: false,
      fill: fillColor, stroke: '', strokeWidth: 0, cornerRadius: 1,
    },
    {
      id: `ai_${startId + 1}`, type: 'rect' as const, name: 'Index Line 2',
      x: lineX, y: cardY + cardH - 16, width: lineW, height: 2,
      rotation: 0, opacity: 0.3, visible: true, locked: false,
      fill: fillColor, stroke: '', strokeWidth: 0, cornerRadius: 1,
    },
  ];
}

export const AI_TEMPLATES: AITemplate[] = [
  // ───────────────────────────────────────────────
  // 1. Pastel Card Grid
  // ───────────────────────────────────────────────
  {
    id: 'pastel-card-grid',
    name: 'Pastel Card Grid',
    description: 'Two-column grid of pastel cards with borders, shadows, and index card lines',
    skeleton: (w, h) => {
      const pastels = ['#B5EAD7', '#FFDAC1', '#C7CEEA', '#FFB7B2'];
      const borders = ['#7BC8A4', '#E0A87A', '#9BA3C7', '#E08A84'];
      const cardW = Math.round((w - 56) / 2);
      const leftX = 20;
      const rightX = w - 20 - cardW;
      const cardH = 170;
      const row1Y = 140;
      const row2Y = row1Y + cardH + 16;

      const objects: Record<string, unknown>[] = [
        // Background
        {
          id: 'ai_0', type: 'rect', name: 'Background',
          x: 0, y: 0, width: w, height: Math.max(h, row2Y + cardH + 60),
          rotation: 0, opacity: 0.5, visible: true, locked: false,
          fill: '#F0EBFF', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        // Floating ellipse
        {
          id: 'ai_1', type: 'ellipse', name: 'Floating Ellipse',
          x: w * 0.5, y: row1Y + 40, width: 260, height: 260,
          rotation: 0, opacity: 0.06, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0,
        },
        // Title
        {
          id: 'ai_2', type: 'text', name: 'Title',
          x: 20, y: 30, width: w - 40, height: 44,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: 34, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        },
        // Subtitle
        {
          id: 'ai_3', type: 'text', name: 'Subtitle',
          x: 20, y: 80, width: w - 40, height: 24,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#6B6B85', align: 'left' as const, lineHeight: 1.5,
        },
        // Accent bar
        {
          id: 'ai_4', type: 'rect', name: 'Accent Bar',
          x: 20, y: 115, width: 60, height: 4,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 2,
        },
      ];

      let idCounter = 5;
      const positions = [
        { x: leftX, y: row1Y },
        { x: rightX, y: row1Y },
        { x: leftX, y: row2Y },
        { x: rightX, y: row2Y },
      ];

      for (let i = 0; i < 4; i++) {
        const pos = positions[i];
        // Card rect
        objects.push({
          id: `ai_${idCounter++}`, type: 'rect', name: `Card ${i + 1}`,
          x: pos.x, y: pos.y, width: cardW, height: cardH,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: pastels[i], stroke: borders[i], strokeWidth: 2, cornerRadius: 20,
          shadow: SHADOW,
        });
        // Card title
        objects.push({
          id: `ai_${idCounter++}`, type: 'text', name: `Card ${i + 1} Title`,
          x: pos.x + 16, y: pos.y + 16, width: cardW - 32, height: 28,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{CARD_${i + 1}_TITLE}}`, fontSize: 18, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        });
        // Card body
        objects.push({
          id: `ai_${idCounter++}`, type: 'text', name: `Card ${i + 1} Body`,
          x: pos.x + 16, y: pos.y + 50, width: cardW - 32, height: 80,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{CARD_${i + 1}_BODY}}`, fontSize: 14, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#444444', align: 'left' as const, lineHeight: 1.5,
        });
        // Index lines
        const lines = indexLines(idCounter, pos.x, pos.y, cardW, cardH, borders[i]);
        objects.push(...lines);
        idCounter += 2;
      }

      return {
        version: 1,
        canvas: { width: w, height: Math.max(h, row2Y + cardH + 60), background: '#FFFFFF' },
        objects: objects as unknown as DesignDocument['objects'],
        assets: {},
      };
    },
  },

  // ───────────────────────────────────────────────
  // 2. Myth vs Fact Cards
  // ───────────────────────────────────────────────
  {
    id: 'myth-fact-cards',
    name: 'Myth vs Fact',
    description: 'Interactive flip cards for myth/fact or Q&A content',
    skeleton: (w, h) => {
      const pastels = ['#f4978e', '#FFDAC1', '#B5EAD7'];
      const borders = ['#D06B62', '#D09A7A', '#7BC8A4'];
      const flipH = 200;
      const headerH = 130;
      const startY = headerH + 20;
      const totalH = Math.max(h, startY + 3 * (flipH + 20) + 40);

      const topLevel: Record<string, unknown>[] = [
        // Gradient header
        {
          id: 'ai_0', type: 'rect', name: 'Header BG',
          x: 0, y: 0, width: w, height: headerH,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 0,
          gradient: { type: 'linear', colors: ['#7B68EE', '#5B4BC7'], angle: 135 },
        },
        // Title
        {
          id: 'ai_1', type: 'text', name: 'Title',
          x: 20, y: 30, width: w - 40, height: 44,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: 34, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#FFFFFF', align: 'left' as const, lineHeight: 1.2,
        },
        // Subtitle
        {
          id: 'ai_2', type: 'text', name: 'Subtitle',
          x: 20, y: 80, width: w - 40, height: 24,
          rotation: 0, opacity: 0.8, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#FFFFFF', align: 'left' as const, lineHeight: 1.5,
        },
      ];

      // 3 flip-card interactives
      for (let i = 0; i < 3; i++) {
        const cardY = startY + i * (flipH + 20);
        const pastel = pastels[i % pastels.length];
        const border = borders[i % borders.length];

        // Front children (local coords)
        const frontChildren = [
          {
            id: 'ai_0', type: 'rect', name: 'Front BG',
            x: 20, y: 0, width: w - 40, height: flipH,
            rotation: 0, opacity: 1, visible: true, locked: false,
            fill: pastel, stroke: border, strokeWidth: 2, cornerRadius: 20,
            shadow: SHADOW,
          },
          {
            id: 'ai_1', type: 'badge', name: 'Myth Badge',
            x: 36, y: 16, width: 60, height: 28,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: 'MYTH', fontSize: 12, fontFamily: 'Arial', fontStyle: 'bold' as const,
            textColor: '#FFFFFF', fill: border, cornerRadius: 14, paddingX: 12, paddingY: 6,
          },
          {
            id: 'ai_2', type: 'text', name: 'Front Title',
            x: 36, y: 54, width: w - 72, height: 80,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: `{{MYTH_${i + 1}}}`, fontSize: 20, fontFamily: 'Georgia',
            fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.3,
          },
          {
            id: 'ai_3', type: 'text', name: 'Tap Hint',
            x: 36, y: flipH - 36, width: w - 72, height: 20,
            rotation: 0, opacity: 0.5, visible: true, locked: false,
            text: 'Tap to flip', fontSize: 13, fontFamily: 'Arial',
            fontStyle: 'normal' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1,
          },
          // Index lines (local)
          {
            id: 'ai_4', type: 'rect', name: 'Index Line',
            x: 40, y: flipH - 22, width: w - 120, height: 2,
            rotation: 0, opacity: 0.4, visible: true, locked: false,
            fill: border, stroke: '', strokeWidth: 0, cornerRadius: 1,
          },
          {
            id: 'ai_5', type: 'rect', name: 'Index Line 2',
            x: 40, y: flipH - 16, width: w - 120, height: 2,
            rotation: 0, opacity: 0.3, visible: true, locked: false,
            fill: border, stroke: '', strokeWidth: 0, cornerRadius: 1,
          },
        ];

        // Back children (local coords)
        const backChildren = [
          {
            id: 'ai_6', type: 'rect', name: 'Back BG',
            x: 20, y: 0, width: w - 40, height: flipH,
            rotation: 0, opacity: 1, visible: true, locked: false,
            fill: '#FFFFFF', stroke: '#4CAF50', strokeWidth: 2, cornerRadius: 20,
            shadow: SHADOW,
          },
          {
            id: 'ai_7', type: 'badge', name: 'Fact Badge',
            x: 36, y: 16, width: 60, height: 28,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: 'FACT', fontSize: 12, fontFamily: 'Arial', fontStyle: 'bold' as const,
            textColor: '#FFFFFF', fill: '#4CAF50', cornerRadius: 14, paddingX: 12, paddingY: 6,
          },
          {
            id: 'ai_8', type: 'text', name: 'Back Text',
            x: 36, y: 54, width: w - 72, height: 110,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: `{{FACT_${i + 1}}}`, fontSize: 16, fontFamily: 'Arial',
            fontStyle: 'normal' as const, fill: '#333333', align: 'left' as const, lineHeight: 1.5,
          },
          {
            id: 'ai_9', type: 'rect', name: 'Index Line',
            x: 40, y: flipH - 22, width: w - 120, height: 2,
            rotation: 0, opacity: 0.4, visible: true, locked: false,
            fill: '#4CAF50', stroke: '', strokeWidth: 0, cornerRadius: 1,
          },
          {
            id: 'ai_10', type: 'rect', name: 'Index Line 2',
            x: 40, y: flipH - 16, width: w - 120, height: 2,
            rotation: 0, opacity: 0.3, visible: true, locked: false,
            fill: '#4CAF50', stroke: '', strokeWidth: 0, cornerRadius: 1,
          },
        ];

        const allChildren = [...frontChildren, ...backChildren];

        topLevel.push({
          id: `ai_${3 + i}`, type: 'interactive', name: `Flip Card ${i + 1}`,
          x: 0, y: cardY, width: w, height: flipH,
          rotation: 0, opacity: 1, visible: true, locked: false,
          interactionType: 'flip-card',
          interactionConfig: { flipDuration: 500, flipDirection: 'horizontal', defaultSide: 'front' },
          groups: [
            { role: 'front', label: 'Front', objectIds: ['ai_0', 'ai_1', 'ai_2', 'ai_3', 'ai_4', 'ai_5'] },
            { role: 'back', label: 'Back', objectIds: ['ai_6', 'ai_7', 'ai_8', 'ai_9', 'ai_10'] },
          ],
          childIds: allChildren.map((c) => c.id),
          children: allChildren,
        });
      }

      return {
        version: 2,
        canvas: { width: w, height: totalH, background: '#FBF9FF' },
        objects: topLevel as unknown as DesignDocument['objects'],
        assets: {},
      };
    },
  },

  // ───────────────────────────────────────────────
  // 3. Stacked Info Cards
  // ───────────────────────────────────────────────
  {
    id: 'stacked-info-cards',
    name: 'Stacked Info Cards',
    description: 'Vertical stack of colorful info cards with shadows and badges',
    skeleton: (w, h) => {
      const pastels = ['#C7CEEA', '#FFDAC1', '#B5EAD7', '#FFB7B2'];
      const borders = ['#9BA3C7', '#D09A7A', '#7BC8A4', '#E08A84'];
      const cardW = w - 40;
      const cardH = 150;
      const startY = 130;
      const gap = cardH + 20;
      const totalH = Math.max(h, startY + 4 * gap + 20);

      const objects: Record<string, unknown>[] = [
        // Background
        {
          id: 'ai_0', type: 'rect', name: 'Background',
          x: 0, y: 0, width: w, height: totalH,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#FBF9FF', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        // Title
        {
          id: 'ai_1', type: 'text', name: 'Title',
          x: 20, y: 30, width: w - 40, height: 44,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: 32, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        },
        // Accent bar
        {
          id: 'ai_2', type: 'rect', name: 'Accent Bar',
          x: 20, y: 85, width: 60, height: 4,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 2,
        },
        // Subtitle
        {
          id: 'ai_3', type: 'text', name: 'Subtitle',
          x: 20, y: 96, width: w - 40, height: 24,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#6B6B85', align: 'left' as const, lineHeight: 1.5,
        },
        // Floating ellipse
        {
          id: 'ai_4', type: 'ellipse', name: 'Floating Ellipse',
          x: w - 120, y: startY + 60, width: 200, height: 200,
          rotation: 0, opacity: 0.05, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0,
        },
      ];

      let idCounter = 5;
      for (let i = 0; i < 4; i++) {
        const cardY = startY + i * gap;
        // Card
        objects.push({
          id: `ai_${idCounter++}`, type: 'rect', name: `Card ${i + 1}`,
          x: 20, y: cardY, width: cardW, height: cardH,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: pastels[i], stroke: borders[i], strokeWidth: 2, cornerRadius: 20,
          shadow: SHADOW,
        });
        // Badge
        objects.push({
          id: `ai_${idCounter++}`, type: 'badge', name: `Badge ${i + 1}`,
          x: cardW - 60, y: cardY + 14, width: 70, height: 26,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{TAG_${i + 1}}}`, fontSize: 11, fontFamily: 'Arial', fontStyle: 'bold' as const,
          textColor: '#FFFFFF', fill: borders[i], cornerRadius: 13, paddingX: 10, paddingY: 5,
        });
        // Card title
        objects.push({
          id: `ai_${idCounter++}`, type: 'text', name: `Card ${i + 1} Title`,
          x: 36, y: cardY + 16, width: cardW - 100, height: 28,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{CARD_${i + 1}_TITLE}}`, fontSize: 20, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        });
        // Card body
        objects.push({
          id: `ai_${idCounter++}`, type: 'text', name: `Card ${i + 1} Body`,
          x: 36, y: cardY + 48, width: cardW - 52, height: 60,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{CARD_${i + 1}_BODY}}`, fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#444444', align: 'left' as const, lineHeight: 1.5,
        });
        // Index lines
        const lines = indexLines(idCounter, 20, cardY, cardW, cardH, borders[i]);
        objects.push(...lines);
        idCounter += 2;
      }

      return {
        version: 1,
        canvas: { width: w, height: totalH, background: '#FFFFFF' },
        objects: objects as unknown as DesignDocument['objects'],
        assets: {},
      };
    },
  },

  // ───────────────────────────────────────────────
  // 4. Hero Announcement
  // ───────────────────────────────────────────────
  {
    id: 'hero-announcement',
    name: 'Hero Announcement',
    description: 'Bold hero section with gradient background and call-to-action',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#FFFFFF' },
      objects: [
        // Gradient BG
        {
          id: 'ai_0', type: 'rect', name: 'Gradient BG',
          x: 0, y: 0, width: w, height: h * 0.65,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 0,
          gradient: { type: 'linear', colors: ['#7B68EE', '#9B6EE8'], angle: 135 },
        },
        // Decorative ellipse
        {
          id: 'ai_1', type: 'ellipse', name: 'Decorative Ellipse',
          x: w * 0.55, y: -40, width: 280, height: 280,
          rotation: 0, opacity: 0.08, visible: true, locked: false,
          fill: '#FFFFFF', stroke: '', strokeWidth: 0,
        },
        // Headline
        {
          id: 'ai_2', type: 'text', name: 'Headline',
          x: 30, y: h * 0.12, width: w - 60, height: h * 0.2,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: 34, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#FFFFFF', align: 'center' as const, lineHeight: 1.2,
        },
        // Body text
        {
          id: 'ai_3', type: 'text', name: 'Body',
          x: 40, y: h * 0.34, width: w - 80, height: h * 0.12,
          rotation: 0, opacity: 0.9, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: 18, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#FFFFFF', align: 'center' as const, lineHeight: 1.5,
        },
        // Accent divider
        {
          id: 'ai_4', type: 'rect', name: 'Divider',
          x: w * 0.4, y: h * 0.49, width: w * 0.2, height: 2,
          rotation: 0, opacity: 0.5, visible: true, locked: false,
          fill: '#FFFFFF', stroke: '', strokeWidth: 0, cornerRadius: 1,
        },
        // CTA button
        {
          id: 'ai_5', type: 'rect', name: 'CTA Button',
          x: w * 0.2, y: h * 0.54, width: w * 0.6, height: 50,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#FFFFFF', stroke: '', strokeWidth: 0, cornerRadius: 25,
          shadow: SHADOW,
        },
        // CTA text
        {
          id: 'ai_6', type: 'text', name: 'CTA Text',
          x: w * 0.2, y: h * 0.555, width: w * 0.6, height: 30,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{CTA_TEXT}}', fontSize: 16, fontFamily: 'Arial',
          fontStyle: 'bold' as const, fill: '#7B68EE', align: 'center' as const, lineHeight: 1.2,
        },
        // Bottom section BG
        {
          id: 'ai_7', type: 'rect', name: 'Bottom Section',
          x: 0, y: h * 0.65, width: w, height: h * 0.35,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#FBF9FF', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        // Bottom text
        {
          id: 'ai_8', type: 'text', name: 'Bottom Title',
          x: 30, y: h * 0.7, width: w - 60, height: 30,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BOTTOM_TITLE}}', fontSize: 22, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        },
        // Bottom body
        {
          id: 'ai_9', type: 'text', name: 'Bottom Body',
          x: 30, y: h * 0.76, width: w - 60, height: h * 0.15,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BOTTOM_BODY}}', fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#6B6B85', align: 'left' as const, lineHeight: 1.5,
        },
        // Bottom accent bar
        {
          id: 'ai_10', type: 'rect', name: 'Bottom Accent',
          x: 30, y: h * 0.93, width: 50, height: 4,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 2,
        },
      ] as DesignDocument['objects'],
      assets: {},
    }),
  },

  // ───────────────────────────────────────────────
  // 5. Topic Carousel
  // ───────────────────────────────────────────────
  {
    id: 'topic-carousel',
    name: 'Topic Carousel',
    description: 'Swipeable carousel for multi-topic or step-by-step content',
    skeleton: (w, h) => {
      const pastels = ['#C7CEEA', '#B5EAD7', '#FFDAC1'];
      const borders = ['#9BA3C7', '#7BC8A4', '#D09A7A'];
      const carouselH = 380;
      const headerH = 130;
      const totalH = Math.max(h, headerH + carouselH + 80);

      // Build 3 slides' children (local coords)
      const slideChildren: Record<string, unknown>[] = [];
      const slideGroups: { role: string; label: string; objectIds: string[] }[] = [];
      let childId = 0;

      for (let i = 0; i < 3; i++) {
        const ids: string[] = [];
        // Slide BG
        const bgId = `ai_${childId++}`;
        slideChildren.push({
          id: bgId, type: 'rect', name: `Slide ${i + 1} BG`,
          x: 20, y: 10, width: w - 40, height: carouselH - 20,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: pastels[i], stroke: borders[i], strokeWidth: 2, cornerRadius: 20,
          shadow: SHADOW,
        });
        ids.push(bgId);

        // Badge
        const badgeId = `ai_${childId++}`;
        slideChildren.push({
          id: badgeId, type: 'badge', name: `Slide ${i + 1} Badge`,
          x: 36, y: 26, width: 80, height: 28,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `Step ${i + 1}`, fontSize: 12, fontFamily: 'Arial', fontStyle: 'bold' as const,
          textColor: '#FFFFFF', fill: borders[i], cornerRadius: 14, paddingX: 14, paddingY: 6,
        });
        ids.push(badgeId);

        // Slide title
        const titleId = `ai_${childId++}`;
        slideChildren.push({
          id: titleId, type: 'text', name: `Slide ${i + 1} Title`,
          x: 36, y: 70, width: w - 72, height: 36,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{SLIDE_${i + 1}_TITLE}}`, fontSize: 24, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        });
        ids.push(titleId);

        // Slide body
        const bodyId = `ai_${childId++}`;
        slideChildren.push({
          id: bodyId, type: 'text', name: `Slide ${i + 1} Body`,
          x: 36, y: 120, width: w - 72, height: 200,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{SLIDE_${i + 1}_BODY}}`, fontSize: 16, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#444444', align: 'left' as const, lineHeight: 1.5,
        });
        ids.push(bodyId);

        // Index lines
        const line1Id = `ai_${childId++}`;
        slideChildren.push({
          id: line1Id, type: 'rect', name: 'Index Line',
          x: 40, y: carouselH - 42, width: w - 120, height: 2,
          rotation: 0, opacity: 0.4, visible: true, locked: false,
          fill: borders[i], stroke: '', strokeWidth: 0, cornerRadius: 1,
        });
        ids.push(line1Id);

        const line2Id = `ai_${childId++}`;
        slideChildren.push({
          id: line2Id, type: 'rect', name: 'Index Line 2',
          x: 40, y: carouselH - 36, width: w - 120, height: 2,
          rotation: 0, opacity: 0.3, visible: true, locked: false,
          fill: borders[i], stroke: '', strokeWidth: 0, cornerRadius: 1,
        });
        ids.push(line2Id);

        slideGroups.push({ role: `slide-${i}`, label: `Slide ${i + 1}`, objectIds: ids });
      }

      return {
        version: 2,
        canvas: { width: w, height: totalH, background: '#FBF9FF' },
        objects: [
          // Tinted header
          {
            id: 'ai_0', type: 'rect', name: 'Header BG',
            x: 0, y: 0, width: w, height: headerH,
            rotation: 0, opacity: 0.5, visible: true, locked: false,
            fill: '#F0EBFF', stroke: '', strokeWidth: 0, cornerRadius: 0,
          },
          // Title
          {
            id: 'ai_1', type: 'text', name: 'Title',
            x: 20, y: 30, width: w - 40, height: 44,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: '{{TITLE}}', fontSize: 32, fontFamily: 'Georgia',
            fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
          },
          // Subtitle
          {
            id: 'ai_2', type: 'text', name: 'Subtitle',
            x: 20, y: 80, width: w - 40, height: 24,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: '{{SUBTITLE}}', fontSize: 15, fontFamily: 'Arial',
            fontStyle: 'normal' as const, fill: '#6B6B85', align: 'left' as const, lineHeight: 1.5,
          },
          // Carousel interactive
          {
            id: 'ai_3', type: 'interactive', name: 'Carousel',
            x: 0, y: headerH + 10, width: w, height: carouselH,
            rotation: 0, opacity: 1, visible: true, locked: false,
            interactionType: 'carousel',
            interactionConfig: { autoPlay: false, autoPlayInterval: 3000, showDots: true, showArrows: true, transitionDuration: 300 },
            groups: slideGroups,
            childIds: slideChildren.map((c) => c.id as string),
            children: slideChildren,
          },
        ] as DesignDocument['objects'],
        assets: {},
      };
    },
  },

  // ───────────────────────────────────────────────
  // 6. Tabbed Content
  // ───────────────────────────────────────────────
  {
    id: 'tabbed-content',
    name: 'Tabbed Content',
    description: 'Organized content in tabs for categorized information',
    skeleton: (w, h) => {
      const pastels = ['#E2F0CB', '#C7CEEA', '#FFB7B2'];
      const borders = ['#A8C57A', '#9BA3C7', '#E08A84'];
      const tabH = 450;
      const headerH = 120;
      const totalH = Math.max(h, headerH + tabH + 60);

      // Build 3 tabs' children
      const tabChildren: Record<string, unknown>[] = [];
      const tabGroups: { role: string; label: string; objectIds: string[] }[] = [];
      let childId = 0;

      for (let i = 0; i < 3; i++) {
        const ids: string[] = [];

        // Tab BG
        const bgId = `ai_${childId++}`;
        tabChildren.push({
          id: bgId, type: 'rect', name: `Tab ${i + 1} BG`,
          x: 16, y: 60, width: w - 32, height: tabH - 70,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: pastels[i], stroke: borders[i], strokeWidth: 2, cornerRadius: 20,
          shadow: SHADOW,
        });
        ids.push(bgId);

        // Tab title
        const titleId = `ai_${childId++}`;
        tabChildren.push({
          id: titleId, type: 'text', name: `Tab ${i + 1} Title`,
          x: 32, y: 80, width: w - 64, height: 30,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{TAB_${i + 1}_TITLE}}`, fontSize: 20, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        });
        ids.push(titleId);

        // Badge
        const badgeId = `ai_${childId++}`;
        tabChildren.push({
          id: badgeId, type: 'badge', name: `Tab ${i + 1} Badge`,
          x: 32, y: 118, width: 80, height: 26,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{TAB_${i + 1}_TAG}}`, fontSize: 11, fontFamily: 'Arial', fontStyle: 'bold' as const,
          textColor: '#FFFFFF', fill: borders[i], cornerRadius: 13, paddingX: 10, paddingY: 5,
        });
        ids.push(badgeId);

        // Tab body
        const bodyId = `ai_${childId++}`;
        tabChildren.push({
          id: bodyId, type: 'text', name: `Tab ${i + 1} Body`,
          x: 32, y: 155, width: w - 64, height: 250,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: `{{TAB_${i + 1}_BODY}}`, fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#444444', align: 'left' as const, lineHeight: 1.5,
        });
        ids.push(bodyId);

        // Index lines
        const l1 = `ai_${childId++}`;
        tabChildren.push({
          id: l1, type: 'rect', name: 'Index Line',
          x: 36, y: tabH - 38, width: w - 100, height: 2,
          rotation: 0, opacity: 0.4, visible: true, locked: false,
          fill: borders[i], stroke: '', strokeWidth: 0, cornerRadius: 1,
        });
        ids.push(l1);

        const l2 = `ai_${childId++}`;
        tabChildren.push({
          id: l2, type: 'rect', name: 'Index Line 2',
          x: 36, y: tabH - 32, width: w - 100, height: 2,
          rotation: 0, opacity: 0.3, visible: true, locked: false,
          fill: borders[i], stroke: '', strokeWidth: 0, cornerRadius: 1,
        });
        ids.push(l2);

        tabGroups.push({ role: `tab-${i}`, label: `{{TAB_${i + 1}_LABEL}}`, objectIds: ids });
      }

      return {
        version: 2,
        canvas: { width: w, height: totalH, background: '#FBF9FF' },
        objects: [
          // Title
          {
            id: 'ai_0', type: 'text', name: 'Title',
            x: 20, y: 30, width: w - 40, height: 44,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: '{{TITLE}}', fontSize: 32, fontFamily: 'Georgia',
            fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
          },
          // Accent bar
          {
            id: 'ai_1', type: 'rect', name: 'Accent Bar',
            x: 20, y: 82, width: 60, height: 4,
            rotation: 0, opacity: 1, visible: true, locked: false,
            fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 2,
          },
          // Tabs interactive
          {
            id: 'ai_2', type: 'interactive', name: 'Tabs',
            x: 0, y: headerH, width: w, height: tabH,
            rotation: 0, opacity: 1, visible: true, locked: false,
            interactionType: 'tabs',
            interactionConfig: { defaultTab: 0, tabPosition: 'top', tabStyle: 'pill' },
            groups: tabGroups,
            childIds: tabChildren.map((c) => c.id as string),
            children: tabChildren,
          },
        ] as DesignDocument['objects'],
        assets: {},
      };
    },
  },

  // ───────────────────────────────────────────────
  // 7. Quote Spotlight
  // ───────────────────────────────────────────────
  {
    id: 'quote-spotlight',
    name: 'Quote Spotlight',
    description: 'Large quote with attribution, decorative marks, and accent colors',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#1A1A2E' },
      objects: [
        // Tinted overlay
        {
          id: 'ai_0', type: 'rect', name: 'Tinted Overlay',
          x: 0, y: 0, width: w, height: h,
          rotation: 0, opacity: 0.05, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        // Decorative ellipse
        {
          id: 'ai_1', type: 'ellipse', name: 'Decorative Ellipse',
          x: -60, y: h * 0.6, width: 240, height: 240,
          rotation: 0, opacity: 0.06, visible: true, locked: false,
          fill: '#9B6EE8', stroke: '', strokeWidth: 0,
        },
        // Large quote mark
        {
          id: 'ai_2', type: 'text', name: 'Quote Mark',
          x: w * 0.05, y: h * 0.08, width: w * 0.3, height: h * 0.2,
          rotation: 0, opacity: 0.12, visible: true, locked: false,
          text: '\u201C', fontSize: 120, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#9B6EE8', align: 'left' as const, lineHeight: 1,
        },
        // Badge
        {
          id: 'ai_3', type: 'badge', name: 'Inspiration Badge',
          x: w * 0.5 - 50, y: h * 0.15, width: 100, height: 28,
          rotation: 0, opacity: 0.7, visible: true, locked: false,
          text: 'Inspiration', fontSize: 11, fontFamily: 'Arial', fontStyle: 'bold' as const,
          textColor: '#FFFFFF', fill: '#9B6EE8', cornerRadius: 14, paddingX: 14, paddingY: 6,
        },
        // Quote text
        {
          id: 'ai_4', type: 'text', name: 'Quote Text',
          x: 30, y: h * 0.28, width: w - 60, height: h * 0.35,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{QUOTE}}', fontSize: 28, fontFamily: 'Georgia',
          fontStyle: 'italic' as const, fill: '#FFFFFF', align: 'center' as const, lineHeight: 1.5,
        },
        // Accent divider
        {
          id: 'ai_5', type: 'rect', name: 'Divider',
          x: w * 0.38, y: h * 0.67, width: w * 0.24, height: 2,
          rotation: 0, opacity: 0.6, visible: true, locked: false,
          fill: '#9B6EE8', stroke: '', strokeWidth: 0, cornerRadius: 1,
        },
        // Attribution
        {
          id: 'ai_6', type: 'text', name: 'Attribution',
          x: 30, y: h * 0.72, width: w - 60, height: h * 0.08,
          rotation: 0, opacity: 0.7, visible: true, locked: false,
          text: '{{ATTRIBUTION}}', fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#FFFFFF', align: 'center' as const, lineHeight: 1.3,
        },
        // Small decorative ellipse top-right
        {
          id: 'ai_7', type: 'ellipse', name: 'Small Ellipse',
          x: w - 100, y: -30, width: 160, height: 160,
          rotation: 0, opacity: 0.04, visible: true, locked: false,
          fill: '#FFFFFF', stroke: '', strokeWidth: 0,
        },
      ] as DesignDocument['objects'],
      assets: {},
    }),
  },

  // ───────────────────────────────────────────────
  // 8. Learn More Sheet
  // ───────────────────────────────────────────────
  {
    id: 'learn-more-sheet',
    name: 'Learn More Sheet',
    description: 'Trigger card with expandable bottom sheet for detail content',
    skeleton: (w, h) => {
      const sheetH = 400;
      const headerH = 120;
      const triggerCardH = 140;

      // Bottom sheet children (local coords)
      const children: Record<string, unknown>[] = [
        // Trigger: card rect
        {
          id: 'ai_0', type: 'rect', name: 'Trigger Card',
          x: 20, y: 0, width: w - 40, height: triggerCardH,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#C7CEEA', stroke: '#9BA3C7', strokeWidth: 2, cornerRadius: 20,
          shadow: SHADOW,
        },
        // Trigger: badge
        {
          id: 'ai_1', type: 'badge', name: 'Trigger Badge',
          x: w - 100, y: 14, width: 60, height: 26,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: 'Info', fontSize: 11, fontFamily: 'Arial', fontStyle: 'bold' as const,
          textColor: '#FFFFFF', fill: '#9BA3C7', cornerRadius: 13, paddingX: 10, paddingY: 5,
        },
        // Trigger: title
        {
          id: 'ai_2', type: 'text', name: 'Trigger Title',
          x: 36, y: 20, width: w - 130, height: 30,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TRIGGER_TITLE}}', fontSize: 20, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        },
        // Trigger: caption
        {
          id: 'ai_3', type: 'text', name: 'Trigger Caption',
          x: 36, y: 56, width: w - 72, height: 50,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TRIGGER_CAPTION}}', fontSize: 14, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#6B6B85', align: 'left' as const, lineHeight: 1.4,
        },
        // Trigger: tap hint
        {
          id: 'ai_4', type: 'text', name: 'Tap Hint',
          x: 36, y: triggerCardH - 32, width: w - 72, height: 20,
          rotation: 0, opacity: 0.5, visible: true, locked: false,
          text: 'Tap to learn more', fontSize: 13, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1,
        },
        // Trigger: index lines
        {
          id: 'ai_5', type: 'rect', name: 'Index Line',
          x: 40, y: triggerCardH - 22, width: w - 120, height: 2,
          rotation: 0, opacity: 0.4, visible: true, locked: false,
          fill: '#9BA3C7', stroke: '', strokeWidth: 0, cornerRadius: 1,
        },
        {
          id: 'ai_6', type: 'rect', name: 'Index Line 2',
          x: 40, y: triggerCardH - 16, width: w - 120, height: 2,
          rotation: 0, opacity: 0.3, visible: true, locked: false,
          fill: '#9BA3C7', stroke: '', strokeWidth: 0, cornerRadius: 1,
        },

        // Content: white bg
        {
          id: 'ai_7', type: 'rect', name: 'Sheet BG',
          x: 0, y: 0, width: w, height: 400,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#FFFFFF', stroke: '#E8E8F0', strokeWidth: 1, cornerRadius: 20,
        },
        // Content: accent bar
        {
          id: 'ai_8', type: 'rect', name: 'Sheet Accent',
          x: 20, y: 24, width: 50, height: 4,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 2,
        },
        // Content: title
        {
          id: 'ai_9', type: 'text', name: 'Sheet Title',
          x: 20, y: 40, width: w - 40, height: 30,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{SHEET_TITLE}}', fontSize: 20, fontFamily: 'Georgia',
          fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
        },
        // Content: body
        {
          id: 'ai_10', type: 'text', name: 'Sheet Body',
          x: 20, y: 80, width: w - 40, height: 280,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{SHEET_BODY}}', fontSize: 15, fontFamily: 'Arial',
          fontStyle: 'normal' as const, fill: '#444444', align: 'left' as const, lineHeight: 1.6,
        },
      ];

      return {
        version: 2,
        canvas: { width: w, height: Math.max(h, headerH + sheetH + 100), background: '#FBF9FF' },
        objects: [
          // Title
          {
            id: 'ai_0', type: 'text', name: 'Title',
            x: 20, y: 30, width: w - 40, height: 44,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: '{{TITLE}}', fontSize: 32, fontFamily: 'Georgia',
            fontStyle: 'bold' as const, fill: '#2D2D44', align: 'left' as const, lineHeight: 1.2,
          },
          // Subtitle
          {
            id: 'ai_1', type: 'text', name: 'Subtitle',
            x: 20, y: 80, width: w - 40, height: 24,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: '{{SUBTITLE}}', fontSize: 15, fontFamily: 'Arial',
            fontStyle: 'normal' as const, fill: '#6B6B85', align: 'left' as const, lineHeight: 1.5,
          },
          // Floating ellipse
          {
            id: 'ai_2', type: 'ellipse', name: 'Decorative Ellipse',
            x: w - 100, y: 10, width: 160, height: 160,
            rotation: 0, opacity: 0.05, visible: true, locked: false,
            fill: '#7B68EE', stroke: '', strokeWidth: 0,
          },
          // Bottom sheet
          {
            id: 'ai_3', type: 'interactive', name: 'Bottom Sheet',
            x: 0, y: headerH, width: w, height: sheetH,
            rotation: 0, opacity: 1, visible: true, locked: false,
            interactionType: 'bottom-sheet',
            interactionConfig: { sheetHeightPercent: 60, backdropOpacity: 0.4, slideDuration: 300, dismissOnBackdropTap: true },
            groups: [
              { role: 'trigger', label: 'Trigger', objectIds: ['ai_0', 'ai_1', 'ai_2', 'ai_3', 'ai_4', 'ai_5', 'ai_6'] },
              { role: 'content', label: 'Content', objectIds: ['ai_7', 'ai_8', 'ai_9', 'ai_10'] },
            ],
            childIds: children.map((c) => c.id as string),
            children,
          },
          // Supporting text
          {
            id: 'ai_4', type: 'text', name: 'Supporting Text',
            x: 20, y: headerH + sheetH + 20, width: w - 40, height: 40,
            rotation: 0, opacity: 1, visible: true, locked: false,
            text: '{{SUPPORTING_TEXT}}', fontSize: 14, fontFamily: 'Arial',
            fontStyle: 'normal' as const, fill: '#8E8EA8', align: 'left' as const, lineHeight: 1.5,
          },
          // Bottom accent bar
          {
            id: 'ai_5', type: 'rect', name: 'Bottom Accent',
            x: 20, y: headerH + sheetH + 70, width: 40, height: 4,
            rotation: 0, opacity: 1, visible: true, locked: false,
            fill: '#7B68EE', stroke: '', strokeWidth: 0, cornerRadius: 2,
          },
        ] as DesignDocument['objects'],
        assets: {},
      };
    },
  },
];

export function getTemplateSkeleton(
  templateId: string,
  width: number,
  height: number,
): string | null {
  const template = AI_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;
  return JSON.stringify(template.skeleton(width, height), null, 2);
}
