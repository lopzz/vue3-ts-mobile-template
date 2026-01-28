import { RowData } from './table.d.ts';

interface RowNode {
  id: string;
  data: RowData;
  rowIndex: number; // 原始索引
  displayIndex: number; // 显示索引
  selected: boolean;

  setSelected(selected: boolean, clearSelection?: boolean): void;
  isSelected(): boolean;
  toggleSelected(): void;
  getRowIndex(): number;
  getDisplayIndex(): number;
  getData(): RowData;
  updateData(data: Partial<RowData>): void;
  updateDisplayIndex(newIndex: number): void;
}

export type { RowNode };
