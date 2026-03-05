import type { Position } from './signatureDialog';
// 类型定义
interface Color {
  r: number;
  g: number;
  b: number;
}

interface SignatureConfig {
  page: number;
  x: number;
  y: number;
  maxWidth: number;
  maxHeight: number;
  spacing: number;
}

interface DateConfig {
  page: number;
  x: number;
  y: number;
  fontSize: number;
  color: Color;
  text: string;
  opacity?: number;
}

interface UploadFile {
  file: File;
  status: 'uploading' | 'done' | 'failed';
  message?: string;
}

interface ViewportInfo {
  scale: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  dpr: number;
}

interface AppliedDate {
  page: number;
  x: number;
  y: number;
  text: string;
  config: DateConfig;
  timestamp: number;
}
interface AppliedSignaturePosition {
  signature: any; // 从 SignatureDialog 导入的类型
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface AppliedSignatureData {
  signature: any;
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
  Color,
  SignatureConfig,
  DateConfig,
  UploadFile,
  ViewportInfo,
  AppliedDate,
  AppliedSignaturePosition,
  AppliedSignatureData,
  Position,
};
