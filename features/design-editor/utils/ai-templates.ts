import type { DesignDocument } from '../types/document';

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  skeleton: (width: number, height: number) => DesignDocument;
}

export const AI_TEMPLATES: AITemplate[] = [
  {
    id: 'title-slide',
    name: 'Title Slide',
    description: 'Large centered title with subtitle and accent bar',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#FFFFFF' },
      objects: [
        {
          id: 'ai_0', type: 'rect', name: 'Background',
          x: 0, y: 0, width: w, height: h,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#F0F4FF', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        {
          id: 'ai_1', type: 'rect', name: 'Accent Bar',
          x: w * 0.1, y: h * 0.45, width: w * 0.08, height: h * 0.003,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 4,
        },
        {
          id: 'ai_2', type: 'text', name: 'Title',
          x: w * 0.1, y: h * 0.25, width: w * 0.8, height: h * 0.2,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: Math.round(w * 0.05),
          fontFamily: 'Arial', fontStyle: 'bold' as const, fill: '#1A1A2E',
          align: 'left' as const, lineHeight: 1.2,
        },
        {
          id: 'ai_3', type: 'text', name: 'Subtitle',
          x: w * 0.1, y: h * 0.52, width: w * 0.7, height: h * 0.12,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: Math.round(w * 0.025),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#555555',
          align: 'left' as const, lineHeight: 1.4,
        },
      ],
      assets: {},
    }),
  },
  {
    id: 'info-card',
    name: 'Info Card',
    description: 'Header section with body text and colored footer',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#FFFFFF' },
      objects: [
        {
          id: 'ai_0', type: 'rect', name: 'Header BG',
          x: 0, y: 0, width: w, height: h * 0.35,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        {
          id: 'ai_1', type: 'text', name: 'Title',
          x: w * 0.08, y: h * 0.08, width: w * 0.84, height: h * 0.15,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: Math.round(w * 0.04),
          fontFamily: 'Arial', fontStyle: 'bold' as const, fill: '#FFFFFF',
          align: 'left' as const, lineHeight: 1.2,
        },
        {
          id: 'ai_2', type: 'text', name: 'Subtitle',
          x: w * 0.08, y: h * 0.22, width: w * 0.84, height: h * 0.1,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: Math.round(w * 0.022),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#FFFFFFCC',
          align: 'left' as const, lineHeight: 1.3,
        },
        {
          id: 'ai_3', type: 'text', name: 'Body',
          x: w * 0.08, y: h * 0.42, width: w * 0.84, height: h * 0.4,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BODY_TEXT}}', fontSize: Math.round(w * 0.02),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#333333',
          align: 'left' as const, lineHeight: 1.5,
        },
        {
          id: 'ai_4', type: 'rect', name: 'Footer',
          x: 0, y: h * 0.9, width: w, height: h * 0.1,
          rotation: 0, opacity: 0.15, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
      ],
      assets: {},
    }),
  },
  {
    id: 'bullet-points',
    name: 'Bullet Points',
    description: 'Title with 3-4 bullet text items and markers',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#FFFFFF' },
      objects: [
        {
          id: 'ai_0', type: 'rect', name: 'BG',
          x: 0, y: 0, width: w, height: h,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#FAFBFF', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        {
          id: 'ai_1', type: 'rect', name: 'Side Accent',
          x: 0, y: 0, width: w * 0.015, height: h,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        {
          id: 'ai_2', type: 'text', name: 'Title',
          x: w * 0.08, y: h * 0.08, width: w * 0.84, height: h * 0.12,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: Math.round(w * 0.04),
          fontFamily: 'Arial', fontStyle: 'bold' as const, fill: '#1A1A2E',
          align: 'left' as const, lineHeight: 1.2,
        },
        {
          id: 'ai_3', type: 'ellipse', name: 'Bullet 1',
          x: w * 0.08, y: h * 0.28, width: w * 0.015, height: w * 0.015,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0,
        },
        {
          id: 'ai_4', type: 'text', name: 'Point 1',
          x: w * 0.12, y: h * 0.26, width: w * 0.78, height: h * 0.1,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BULLET_1}}', fontSize: Math.round(w * 0.022),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#333333',
          align: 'left' as const, lineHeight: 1.4,
        },
        {
          id: 'ai_5', type: 'ellipse', name: 'Bullet 2',
          x: w * 0.08, y: h * 0.44, width: w * 0.015, height: w * 0.015,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0,
        },
        {
          id: 'ai_6', type: 'text', name: 'Point 2',
          x: w * 0.12, y: h * 0.42, width: w * 0.78, height: h * 0.1,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BULLET_2}}', fontSize: Math.round(w * 0.022),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#333333',
          align: 'left' as const, lineHeight: 1.4,
        },
        {
          id: 'ai_7', type: 'ellipse', name: 'Bullet 3',
          x: w * 0.08, y: h * 0.6, width: w * 0.015, height: w * 0.015,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0,
        },
        {
          id: 'ai_8', type: 'text', name: 'Point 3',
          x: w * 0.12, y: h * 0.58, width: w * 0.78, height: h * 0.1,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BULLET_3}}', fontSize: Math.round(w * 0.022),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#333333',
          align: 'left' as const, lineHeight: 1.4,
        },
      ],
      assets: {},
    }),
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Left text area with right accent panel',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#FFFFFF' },
      objects: [
        {
          id: 'ai_0', type: 'rect', name: 'Right Panel',
          x: w * 0.55, y: 0, width: w * 0.45, height: h,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        {
          id: 'ai_1', type: 'text', name: 'Title',
          x: w * 0.06, y: h * 0.12, width: w * 0.42, height: h * 0.15,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: Math.round(w * 0.035),
          fontFamily: 'Arial', fontStyle: 'bold' as const, fill: '#1A1A2E',
          align: 'left' as const, lineHeight: 1.2,
        },
        {
          id: 'ai_2', type: 'rect', name: 'Divider',
          x: w * 0.06, y: h * 0.3, width: w * 0.06, height: 3,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 2,
        },
        {
          id: 'ai_3', type: 'text', name: 'Body Left',
          x: w * 0.06, y: h * 0.36, width: w * 0.42, height: h * 0.5,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BODY_TEXT}}', fontSize: Math.round(w * 0.018),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#444444',
          align: 'left' as const, lineHeight: 1.5,
        },
        {
          id: 'ai_4', type: 'text', name: 'Right Heading',
          x: w * 0.6, y: h * 0.15, width: w * 0.35, height: h * 0.12,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: Math.round(w * 0.028),
          fontFamily: 'Arial', fontStyle: 'bold' as const, fill: '#FFFFFF',
          align: 'left' as const, lineHeight: 1.2,
        },
      ],
      assets: {},
    }),
  },
  {
    id: 'quote-card',
    name: 'Quote Card',
    description: 'Large quote text with attribution and decorative elements',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#1A1A2E' },
      objects: [
        {
          id: 'ai_0', type: 'rect', name: 'BG Accent',
          x: 0, y: 0, width: w, height: h,
          rotation: 0, opacity: 0.05, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        {
          id: 'ai_1', type: 'text', name: 'Quote Mark',
          x: w * 0.08, y: h * 0.08, width: w * 0.2, height: h * 0.2,
          rotation: 0, opacity: 0.15, visible: true, locked: false,
          text: '\u201C', fontSize: Math.round(w * 0.15),
          fontFamily: 'Georgia', fontStyle: 'bold' as const, fill: '{{ACCENT_COLOR}}',
          align: 'left' as const, lineHeight: 1,
        },
        {
          id: 'ai_2', type: 'text', name: 'Quote Text',
          x: w * 0.1, y: h * 0.25, width: w * 0.8, height: h * 0.4,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: Math.round(w * 0.032),
          fontFamily: 'Georgia', fontStyle: 'italic' as const, fill: '#FFFFFF',
          align: 'center' as const, lineHeight: 1.5,
        },
        {
          id: 'ai_3', type: 'rect', name: 'Divider',
          x: w * 0.42, y: h * 0.68, width: w * 0.16, height: 2,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 1,
        },
        {
          id: 'ai_4', type: 'text', name: 'Attribution',
          x: w * 0.1, y: h * 0.73, width: w * 0.8, height: h * 0.1,
          rotation: 0, opacity: 0.7, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: Math.round(w * 0.02),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#FFFFFF',
          align: 'center' as const, lineHeight: 1.3,
        },
      ],
      assets: {},
    }),
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Bold banner with headline and call-to-action',
    skeleton: (w, h) => ({
      version: 1,
      canvas: { width: w, height: h, background: '#FFFFFF' },
      objects: [
        {
          id: 'ai_0', type: 'rect', name: 'BG',
          x: 0, y: 0, width: w, height: h,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '{{ACCENT_COLOR}}', stroke: '', strokeWidth: 0, cornerRadius: 0,
        },
        {
          id: 'ai_1', type: 'rect', name: 'Banner Shape',
          x: w * 0.05, y: h * 0.05, width: w * 0.9, height: h * 0.9,
          rotation: 0, opacity: 0.15, visible: true, locked: false,
          fill: '#FFFFFF', stroke: '', strokeWidth: 0, cornerRadius: Math.round(w * 0.03),
        },
        {
          id: 'ai_2', type: 'text', name: 'Headline',
          x: w * 0.1, y: h * 0.2, width: w * 0.8, height: h * 0.25,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{TITLE}}', fontSize: Math.round(w * 0.055),
          fontFamily: 'Arial', fontStyle: 'bold' as const, fill: '#FFFFFF',
          align: 'center' as const, lineHeight: 1.15,
        },
        {
          id: 'ai_3', type: 'text', name: 'Details',
          x: w * 0.15, y: h * 0.48, width: w * 0.7, height: h * 0.15,
          rotation: 0, opacity: 0.9, visible: true, locked: false,
          text: '{{SUBTITLE}}', fontSize: Math.round(w * 0.022),
          fontFamily: 'Arial', fontStyle: 'normal' as const, fill: '#FFFFFF',
          align: 'center' as const, lineHeight: 1.4,
        },
        {
          id: 'ai_4', type: 'rect', name: 'CTA Button',
          x: w * 0.3, y: h * 0.7, width: w * 0.4, height: h * 0.1,
          rotation: 0, opacity: 1, visible: true, locked: false,
          fill: '#FFFFFF', stroke: '', strokeWidth: 0, cornerRadius: Math.round(h * 0.05),
        },
        {
          id: 'ai_5', type: 'text', name: 'CTA Text',
          x: w * 0.3, y: h * 0.72, width: w * 0.4, height: h * 0.07,
          rotation: 0, opacity: 1, visible: true, locked: false,
          text: '{{BODY_TEXT}}', fontSize: Math.round(w * 0.02),
          fontFamily: 'Arial', fontStyle: 'bold' as const, fill: '{{ACCENT_COLOR}}',
          align: 'center' as const, lineHeight: 1.2,
        },
      ],
      assets: {},
    }),
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
