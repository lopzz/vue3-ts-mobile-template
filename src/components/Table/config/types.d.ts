import { DefineComponent } from 'vue';

type Noop = null | undefined;
type StyleProperties = Record<string, string | number>;
type ClassProperties = Record<string, boolean>;
type Context = Record<string, any>;
type ComponentName = string;
type HtmlString = string;

export interface GridParams {
  row?: RowDataItem;
  column: ColumnDef;
  value?: any;
  context?: Context;
}
export type CusTomGridParams = GridParams | Record<any, any>;

// cellRenderer、 tooltipRenderer
export interface RendererComponents {
  [key: string]: DefineComponent;
}

export type CellRendererComponents = RendererComponents;
export type TooltipRendererComponents = RendererComponents;

export interface RendererSelectorResult {
  component: ComponentName;
  params?: any; // 自定义传进组件的参数
}
export type CellRendererSelectorResult = RendererSelectorResult;
export type TooltipRendererSelectorResult = RendererSelectorResult;

// 表头点击
export interface ColumnHeaderClickedEvent {
  column: ColumnDef;
  type: 'columnHeaderClicked';
}

// 排序
export type SortOrder = 'asc' | 'desc' | '';
export interface SortChangedEvent {
  originData: Array<RowDataItem>; // 初始传入的rowData
  lastData: Array<RowDataItem>; // 排序前的rowData
  data: Array<RowDataItem>; // 排序后的rowData
  column: ColumnDef;
  sortOrder: SortOrder;
  type: 'sortChanged';
  context?: Context;
}

export interface ComparatorParams {
  valueA: number | string;
  valueB: number | string;
  rowA: RowDataItem;
  rowB: RowDataItem;
  column: ColumnDef;
}
export interface ColumnDef {
  field: string;
  tooltipField?: string;
  headerName?: string;
  width?: string;
  minWidth?: string;
  ellipsis?: boolean;
  align?: 'left' | 'right' | 'center';
  pinned?: 'left' | 'right';
  sortable?: boolean;
  sortOrder?: SortOrder;
  comparator?: Noop | ((comparatorParams: ComparatorParams) => number);
  valueGetter?: (params: GridParams) => any;
  headerValueFormatter?: (params: GridParams) => any;
  valueFormatter?: (params: GridParams) => any;
  headerStyle?: StyleProperties | ((params: GridParams) => StyleProperties);
  cellStyle?: StyleProperties | ((params: GridParams) => StyleProperties);
  headerClass?: ClassProperties | ((params: GridParams) => ClassProperties);
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
export interface RowDataItem {
  [key: string]: any;
}

export interface GridOptions {
  context?: Context;
  tooltipShow?: boolean;
  tooltipTriggerType?: 'click' | 'longPress';
  tooltipShowDelay?: number;
}
