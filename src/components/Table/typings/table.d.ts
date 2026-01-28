import type {
  StyleProperties,
  ClassProperties,
  ComponentName,
  HtmlString,
  Noop,
} from './utils.d.ts';
import type { SortOrder } from './sort.d.ts';
import type { ComparatorParams } from './comparator.d.ts';
import type { HeaderParams, GridParams, RowHeightParams } from './params.d.ts';
import type { CellRendererSelectorResult } from './renderer.d.ts';

type Context = Record<string, any>;

interface ColumnDef {
  field: string;
  tooltipField?: string;
  headerName?: string;
  width?: string | number;
  minWidth?: string | number;
  ellipsis?: boolean;
  align?: 'left' | 'right' | 'center';
  pinned?: 'left' | 'right';
  sortable?: boolean;
  sortOrder?: SortOrder;
  checkboxSelection?: boolean;
  headerCheckboxSelection?: boolean;
  comparator?: Noop | ((comparatorParams: ComparatorParams) => number);
  valueGetter?: (params: GridParams) => any;
  headerValueFormatter?: (params: HeaderParams) => any;
  valueFormatter?: (params: GridParams) => any;
  headerStyle?: StyleProperties | ((params: HeaderParams) => StyleProperties);
  cellStyle?: StyleProperties | ((params: GridParams) => StyleProperties);
  headerClass?: ClassProperties | ((params: HeaderParams) => ClassProperties);
  cellClass?: ClassProperties | ((params: GridParams) => ClassProperties);
  cellRenderer?: ComponentName | ((params: GridParams) => HtmlString | Noop);
  cellRendererSelector?: (
    params: GridParams,
  ) => CellRendererSelectorResult | Noop;
  tooltipRenderer?: ComponentName | ((params: GridParams) => HtmlString | Noop);
  tooltipRendererSelector?: (
    params: GridParams,
  ) => CellRendererSelectorResult | Noop;
}
interface RowData {
  // _id: string; // 内部id
  [key: string]: any;
}

interface GridOptions {
  context?: Context;
  tooltipShow?: boolean;
  tooltipTriggerType?: 'click' | 'longPress';
  tooltipShowDelay?: number;
  // 行选择
  getRowId?: (data: RowData) => string;
  rowHeight?: number | ((params: RowHeightParams) => number);
  rowSelection?: RowSelectionOptions;
  border?: boolean | ((params: BorderParams) => string);
}

// 表头点击
interface ColumnHeaderClickedEvent {
  column: ColumnDef;
  type: 'columnHeaderClicked';
}

export type {
  Context,
  ColumnDef,
  RowData,
  GridOptions,
  ColumnHeaderClickedEvent,
};
