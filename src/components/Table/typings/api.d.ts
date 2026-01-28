import type { RowNode } from './rowNode.d.ts';
import type { RowData } from './table.d.ts';

interface GridApi {
  // 行节点访问
  getRowNode(id: string): RowNode | undefined;
  getRowAtIndex(index: number): RowNode | undefined;
  forEachRow(callback: (row: RowNode, index: number) => void): void;
  getRowCount(): number;

  // 行选择
  getSelectedRows(): RowData[];
  getSelectedNodes(): RowNode[];
  selectAll(): void;
  deselectAll(): void;
  selectNode(node: RowNode, clearSelection?: boolean): void;
  deselectNode(node: RowNode): void;
  toggleNodeSelection(node: RowNode): void;
  isAllSelected(): boolean;

  // 数据操作
  setData(data: RowData[]): void;
  refresh(): void;
}

export type { GridApi };
