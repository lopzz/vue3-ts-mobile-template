import type { RowData, ColumnDef } from './table.d.ts';

interface ComparatorParams {
  valueA: number | string;
  valueB: number | string;
  rowA: RowData;
  rowB: RowData;
  column: ColumnDef;
}

export type { ComparatorParams };
