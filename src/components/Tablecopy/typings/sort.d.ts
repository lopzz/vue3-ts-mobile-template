import type { Context, RowData, ColumnDef } from './table.d.ts';

// 排序
type SortOrder = 'asc' | 'desc' | '';
interface SortChangedEvent {
  originData: Array<RowData>; // 初始传入的rowData
  lastData: Array<RowData>; // 排序前的rowData
  data: Array<RowData>; // 排序后的rowData
  column: ColumnDef;
  sortOrder: SortOrder;
  type: 'sortChanged';
  context?: Context;
}

export type { SortOrder, SortChangedEvent };
