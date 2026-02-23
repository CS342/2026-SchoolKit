import { createRect, createText, createEllipse, createLine } from './defaults';
import type { DesignObject } from '../types/document';

export function createInfoCard(cx: number, cy: number): DesignObject[] {
  const w = 320;
  const h = 200;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const bg = createRect({
    name: 'Card Background',
    x, y, width: w, height: h,
    fill: '#FFFFFF', cornerRadius: 20, stroke: '#E8E8F0', strokeWidth: 1,
    shadow: { color: 'rgba(0,0,0,0.08)', offsetX: 0, offsetY: 4, blur: 16 },
  });
  const icon = createEllipse({
    name: 'Icon Circle',
    x: x + 24, y: y + 24, width: 48, height: 48,
    fill: '#7B68EE', stroke: '', strokeWidth: 0,
  });
  const title = createText({
    name: 'Card Title',
    x: x + 84, y: y + 28, width: w - 108, height: 28,
    text: 'Info Card Title', fontSize: 20, fontStyle: 'bold', fill: '#2D2D44', align: 'left',
  });
  const body = createText({
    name: 'Card Body',
    x: x + 24, y: y + 90, width: w - 48, height: 80,
    text: 'Add a description here. This card works great for key facts or important callouts.',
    fontSize: 15, fill: '#6B6B85', align: 'left', lineHeight: 1.5,
  });

  return [bg, icon, title, body];
}

export function createStatCounter(cx: number, cy: number): DesignObject[] {
  const x = cx - 80;
  const y = cy - 50;

  const number = createText({
    name: 'Stat Number',
    x, y, width: 160, height: 50,
    text: '42', fontSize: 48, fontStyle: 'bold', fill: '#7B68EE', align: 'center',
  });
  const label = createText({
    name: 'Stat Label',
    x, y: y + 54, width: 160, height: 24,
    text: 'Active Users', fontSize: 14, fill: '#8E8EA8', align: 'center',
  });
  const bar = createRect({
    name: 'Accent Bar',
    x: cx - 30, y: y + 84, width: 60, height: 4,
    fill: '#7B68EE', cornerRadius: 2, stroke: '', strokeWidth: 0,
  });

  return [number, label, bar];
}

export function createNumberedList(cx: number, cy: number, count: number): DesignObject[] {
  const w = 320;
  const startX = cx - w / 2;
  const startY = cy - (count * 44 + 30) / 2;
  const objects: DesignObject[] = [];

  const title = createText({
    name: 'List Title',
    x: startX, y: startY, width: w, height: 28,
    text: 'Numbered List', fontSize: 20, fontStyle: 'bold', fill: '#2D2D44', align: 'left',
  });
  objects.push(title);

  for (let i = 0; i < count; i++) {
    const numBg = createEllipse({
      name: `Number ${i + 1} Badge`,
      x: startX, y: startY + 40 + i * 44, width: 28, height: 28,
      fill: '#7B68EE', stroke: '', strokeWidth: 0,
    });
    const numText = createText({
      name: `Number ${i + 1}`,
      x: startX + 2, y: startY + 44 + i * 44, width: 24, height: 20,
      text: String(i + 1), fontSize: 14, fontStyle: 'bold', fill: '#FFFFFF', align: 'center',
    });
    const itemText = createText({
      name: `Item ${i + 1} Text`,
      x: startX + 40, y: startY + 44 + i * 44, width: w - 40, height: 20,
      text: `List item ${i + 1} goes here`, fontSize: 15, fill: '#6B6B85', align: 'left',
    });
    objects.push(numBg, numText, itemText);
  }

  return objects;
}

export function createQuoteBlock(cx: number, cy: number): DesignObject[] {
  const w = 300;
  const x = cx - w / 2;
  const y = cy - 60;

  const quoteMark = createText({
    name: 'Quote Mark',
    x, y, width: 60, height: 50,
    text: '\u201C', fontSize: 64, fontStyle: 'bold', fill: '#7B68EE', align: 'left',
  });
  const quoteBody = createText({
    name: 'Quote Body',
    x: x + 8, y: y + 40, width: w - 16, height: 60,
    text: 'The best way to predict the future is to create it.',
    fontSize: 18, fontStyle: 'italic', fill: '#2D2D44', align: 'left', lineHeight: 1.5,
  });
  const attribution = createText({
    name: 'Attribution',
    x: x + 8, y: y + 108, width: w - 16, height: 20,
    text: '— Peter Drucker', fontSize: 14, fill: '#8E8EA8', align: 'left',
  });
  const accentLine = createLine({
    name: 'Accent Line',
    points: [x, y + 4, x, y + 128],
    stroke: '#7B68EE', strokeWidth: 4,
  });

  return [quoteMark, quoteBody, attribution, accentLine];
}

export function createCTABlock(cx: number, cy: number): DesignObject[] {
  const w = 340;
  const h = 160;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const bg = createRect({
    name: 'CTA Background',
    x, y, width: w, height: h,
    fill: '#7B68EE', cornerRadius: 20, stroke: '', strokeWidth: 0,
    gradient: { type: 'linear', colors: ['#7B68EE', '#5B4BC7'], angle: 135 },
  });
  const headline = createText({
    name: 'CTA Headline',
    x: x + 24, y: y + 24, width: w - 48, height: 32,
    text: 'Ready to get started?', fontSize: 24, fontStyle: 'bold', fill: '#FFFFFF', align: 'left',
  });
  const btnBg = createRect({
    name: 'Button Background',
    x: x + 24, y: y + 90, width: 140, height: 44,
    fill: '#FFFFFF', cornerRadius: 22, stroke: '', strokeWidth: 0,
  });
  const btnText = createText({
    name: 'Button Text',
    x: x + 24, y: y + 100, width: 140, height: 24,
    text: 'Learn More', fontSize: 16, fontStyle: 'bold', fill: '#7B68EE', align: 'center',
  });

  return [bg, headline, btnBg, btnText];
}

export function createHeaderSection(cx: number, cy: number): DesignObject[] {
  const w = 390; // full canvas width
  const h = 160;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const bg = createRect({
    name: 'Header Background',
    x, y, width: w, height: h,
    fill: '#7B68EE', cornerRadius: 0, stroke: '', strokeWidth: 0,
    gradient: { type: 'linear', colors: ['#7B68EE', '#9B6EE8'], angle: 90 },
  });
  const title = createText({
    name: 'Header Title',
    x: x + 24, y: y + 36, width: w - 48, height: 40,
    text: 'Section Title', fontSize: 32, fontStyle: 'bold', fill: '#FFFFFF', align: 'left',
  });
  const subtitle = createText({
    name: 'Header Subtitle',
    x: x + 24, y: y + 82, width: w - 48, height: 24,
    text: 'A brief description of this section', fontSize: 16, fill: 'rgba(255,255,255,0.8)', align: 'left',
  });
  const decorLine = createLine({
    name: 'Decorative Line',
    points: [x + 24, y + 120, x + 84, y + 120],
    stroke: '#FBBF24', strokeWidth: 3,
  });

  return [bg, title, subtitle, decorLine];
}

export function createIconGrid(cx: number, cy: number, cols: number, rows: number): DesignObject[] {
  const cellW = 80;
  const cellH = 80;
  const gap = 16;
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const startX = cx - totalW / 2;
  const startY = cy - totalH / 2;
  const objects: DesignObject[] = [];

  const iconColors = ['#7B68EE', '#0EA5E9', '#22C55E', '#F59E0B', '#EC4899', '#6366F1'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cellX = startX + c * (cellW + gap);
      const cellY = startY + r * (cellH + gap);
      const color = iconColors[idx % iconColors.length];

      const circle = createEllipse({
        name: `Icon ${idx + 1}`,
        x: cellX + (cellW - 44) / 2, y: cellY, width: 44, height: 44,
        fill: color, stroke: '', strokeWidth: 0,
      });
      const label = createText({
        name: `Label ${idx + 1}`,
        x: cellX, y: cellY + 50, width: cellW, height: 20,
        text: `Item ${idx + 1}`, fontSize: 12, fill: '#6B6B85', align: 'center',
      });
      objects.push(circle, label);
    }
  }

  return objects;
}

export function createImageCaption(cx: number, cy: number): DesignObject[] {
  const w = 300;
  const imgH = 200;
  const x = cx - w / 2;
  const y = cy - (imgH + 60) / 2;

  const placeholder = createRect({
    name: 'Image Placeholder',
    x, y, width: w, height: imgH,
    fill: '#F0F0F0', cornerRadius: 12, stroke: '#E8E8F0', strokeWidth: 1,
  });
  const caption = createText({
    name: 'Caption',
    x, y: y + imgH + 12, width: w, height: 20,
    text: 'Image caption goes here', fontSize: 14, fill: '#8E8EA8', align: 'center',
  });
  const divider = createLine({
    name: 'Divider',
    points: [x + 40, y + imgH + 40, x + w - 40, y + imgH + 40],
    stroke: '#E8E8F0', strokeWidth: 1,
  });

  return [placeholder, caption, divider];
}
