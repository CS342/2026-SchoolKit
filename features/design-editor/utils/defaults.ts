import type {
  RectObject,
  EllipseObject,
  TextObject,
  ImageObject,
  LineObject,
  StarObject,
  TriangleObject,
  ArrowObject,
  BadgeObject,
  StrokeDashPreset,
} from '../types/document';

export function getDashArray(preset: StrokeDashPreset | undefined, strokeWidth: number): number[] | undefined {
  switch (preset) {
    case 'dashed':   return [strokeWidth * 4, strokeWidth * 2];
    case 'dotted':   return [strokeWidth, strokeWidth * 2];
    case 'dash-dot': return [strokeWidth * 4, strokeWidth * 2, strokeWidth, strokeWidth * 2];
    default:         return undefined; // 'solid' or undefined
  }
}

let counter = 0;

export function generateId(): string {
  counter += 1;
  return `obj_${Date.now()}_${counter}`;
}

export function createRect(overrides?: Partial<RectObject>): RectObject {
  return {
    id: generateId(),
    type: 'rect',
    name: 'Rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#7B68EE',
    stroke: '',
    strokeWidth: 0,
    cornerRadius: 0,
    gradient: null,
    shadow: null,
    blur: 0,
    dash: 'solid',
    lineCap: 'butt',
    lineJoin: 'miter',
    ...overrides,
  };
}

export function createEllipse(overrides?: Partial<EllipseObject>): EllipseObject {
  return {
    id: generateId(),
    type: 'ellipse',
    name: 'Ellipse',
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#0EA5E9',
    stroke: '',
    strokeWidth: 0,
    gradient: null,
    shadow: null,
    blur: 0,
    dash: 'solid',
    lineCap: 'butt',
    lineJoin: 'miter',
    ...overrides,
  };
}

export function createText(overrides?: Partial<TextObject>): TextObject {
  return {
    id: generateId(),
    type: 'text',
    name: 'Text',
    x: 100,
    y: 100,
    width: 300,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Type here...',
    fontSize: 32,
    fontFamily: 'Arial',
    fontStyle: 'normal',
    fill: '#111111',
    align: 'left',
    lineHeight: 1.2,
    shadow: null,
    letterSpacing: 0,
    textDecoration: '',
    verticalAlign: 'top',
    padding: 0,
    fontVariant: 'normal',
    stroke: '',
    strokeWidth: 0,
    ...overrides,
  };
}

export function createImage(
  assetId: string,
  src: string,
  name: string,
  overrides?: Partial<ImageObject>,
): ImageObject {
  return {
    id: generateId(),
    type: 'image',
    name,
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    assetId,
    src,
    ...overrides,
  };
}

export function createLine(overrides?: Partial<LineObject>): LineObject {
  return {
    id: generateId(),
    type: 'line',
    name: 'Line',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    points: [100, 100, 300, 100],
    stroke: '#111111',
    strokeWidth: 3,
    lineCap: 'round',
    lineJoin: 'round',
    dash: 'solid',
    ...overrides,
  };
}

export function createStar(overrides?: Partial<StarObject>): StarObject {
  return {
    id: generateId(),
    type: 'star',
    name: 'Star',
    x: 100,
    y: 100,
    width: 120,
    height: 120,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    points: 5,
    innerRadius: 0.5,
    fill: '#F59E0B',
    stroke: '',
    strokeWidth: 0,
    gradient: null,
    shadow: null,
    dash: 'solid',
    lineCap: 'butt',
    lineJoin: 'miter',
    ...overrides,
  };
}

export function createTriangle(overrides?: Partial<TriangleObject>): TriangleObject {
  return {
    id: generateId(),
    type: 'triangle',
    name: 'Triangle',
    x: 100,
    y: 100,
    width: 150,
    height: 130,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#22C55E',
    stroke: '',
    strokeWidth: 0,
    gradient: null,
    shadow: null,
    dash: 'solid',
    lineCap: 'butt',
    lineJoin: 'miter',
    ...overrides,
  };
}

export function createArrow(overrides?: Partial<ArrowObject>): ArrowObject {
  return {
    id: generateId(),
    type: 'arrow',
    name: 'Arrow',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    points: [100, 100, 300, 100],
    stroke: '#111111',
    strokeWidth: 3,
    pointerLength: 15,
    pointerWidth: 12,
    fill: '#111111',
    dash: 'solid',
    lineCap: 'butt',
    lineJoin: 'miter',
    ...overrides,
  };
}

export function createBadge(overrides?: Partial<BadgeObject>): BadgeObject {
  return {
    id: generateId(),
    type: 'badge',
    name: 'Badge',
    x: 100,
    y: 100,
    width: 120,
    height: 36,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Badge',
    fontSize: 14,
    fontFamily: 'Arial',
    fontStyle: 'bold',
    textColor: '#FFFFFF',
    fill: '#7B68EE',
    cornerRadius: 18,
    paddingX: 16,
    paddingY: 8,
    gradient: null,
    shadow: null,
    letterSpacing: 0,
    textDecoration: '',
    align: 'center',
    verticalAlign: 'middle',
    ...overrides,
  };
}
