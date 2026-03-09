import type { SignatureConfig } from './pdfSignature';
// 类型定义
type RequiredSignatureConfig = Required<SignatureConfig>;

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: number;
  type: string;
  color: string;
  width: number;
  opacity: number;
  points: Point[];
}

interface StrokeHistoryItem {
  type: 'add' | 'remove';
  stroke: Stroke;
  index: number;
}

interface Signature {
  id: number;
  strokes: Stroke[];
  width: number;
  height: number;
  strokeCount: number;
  pointCount: number;
}

interface CanvasMouseEvent extends MouseEvent {
  touches?: never;
  changedTouches?: never;
}

interface CanvasTouchEvent extends TouchEvent {
  clientX?: never;
  clientY?: never;
}

type CanvasEvent = CanvasMouseEvent | CanvasTouchEvent;

interface Position {
  signature: Signature;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  index: number;
}

interface AppliedSignature {
  signature: Signature;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
  originalIndex: number;
}

export {
  RequiredSignatureConfig,
  Point,
  Stroke,
  StrokeHistoryItem,
  Signature,
  CanvasMouseEvent,
  CanvasTouchEvent,
  CanvasEvent,
  Position,
  AppliedSignature,
};
