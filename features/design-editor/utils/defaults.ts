import type {
  RectObject,
  EllipseObject,
  TextObject,
  ImageObject,
  LineObject,
} from '../types/document';

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
    ...overrides,
  };
}
