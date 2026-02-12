import type { Context, ColumnDef, RowData } from './table.d.ts';
import type { RowNode } from './rowNode.d.ts';
import type { GridApi } from './api';

interface HeaderParams {
  column: ColumnDef;
  api: GridApi;
  context?: Context;
}

interface GridParams {
  row: RowData;
  column: ColumnDef;
  value: any;
  node: RowNode;
  api: GridApi;
  context?: Context;
}

type CusTomGridParams = GridParams & Record<any, any>;

interface RowHeightParams {
  row: RowData;
  node: RowNode;
  api: GridApi;
  context?: Context;
}

interface BorderParams {
  api: GridApi;
  context?: Context;
}

export type {
  HeaderParams,
  GridParams,
  CusTomGridParams,
  RowHeightParams,
  BorderParams,
};
