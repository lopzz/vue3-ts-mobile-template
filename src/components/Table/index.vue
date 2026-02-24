<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<script lang="ts" setup>
import { ref, provide, onMounted, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
// 组件

import TableHeader from './components/TableHeader/TableHeader.vue';
import TableBody from './components/TableBody/TableBody.vue';
import Tooltip from './components/Tooltip/Tooltip.vue';
// 类型
import type {
  ColumnDef,
  RowData,
  GridOptions,
  CellRendererComponents,
  TooltipRendererComponents,
  SortChangedEvent,
  ColumnHeaderClickedEvent,
  SelectionChangedEvent,
} from './typings';
// 工具方法

import { GridApi } from './manager/GridApi';

// hooks
import { useTableData } from './hooks/useTableData';
import { useGridApi } from './hooks/useGridApi';
import { performSort, createSortEvent, useSort } from './hooks/useSort';
import { useSelection } from './hooks/useSelection';
import { useTooltip } from './hooks/useTooltip';
import { useScrollSync } from './hooks/useScrollSync';
import { useParentChildComponentResolver } from './hooks/useParentChildComponentResolver';
import { useTableStyle } from './hooks/useTableStyle';
import { useOverflowDetection } from './hooks/useOverflowDetection';

defineOptions({
  name: 'Table',
});

const props = withDefaults(
  defineProps<{
    columnDefs?: Array<ColumnDef>;
    rowData?: Array<RowData>;
    gridOptions?: GridOptions;
    cellRendererComponents?: CellRendererComponents;
    tooltipRendererComponents?: TooltipRendererComponents;
  }>(),
  {
    columnDefs: () => [],
    rowData: () => [],
    gridOptions: () => ({}),
    cellRendererComponents: () => ({}) as CellRendererComponents,
    tooltipRendererComponents: () => ({}) as TooltipRendererComponents,
  },
);

const emits = defineEmits<{
  (e: 'sortChanged', sortChangedEvent: SortChangedEvent): void;
  (e: 'gridReady', gridReadyEvent: { api: GridApi; columnApi: any }): void;
  (e: 'selectionChanged', selectionChangedEvent: SelectionChangedEvent): void;
}>();

// 数据管理
const {
  innerRowData,
  innerGridOptions,
  innerColumnDefs,
  pinnedLeftColumnDefs,
  pinnedRightColumnDefs,
  notPinnedColumnDefs,
} = useTableData(props);

provide<ComputedRef<GridOptions>>('gridOptions', innerGridOptions);
provide<Ref<Array<ColumnDef>>>('columnDefs', innerColumnDefs);
provide<Ref<Array<RowData>>>('rowData', innerRowData);

// -----API管理-----
const { api, gridReady, initializeApi } = useGridApi(
  props,
  emits,
  innerGridOptions,
);
initializeApi();

// -----组件注册-----
const { getParentChildComponentRegistry } = useParentChildComponentResolver();
provide<ComputedRef<CellRendererComponents>>(
  'cellRendererComponents',
  computed(() => {
    const registry = getParentChildComponentRegistry();
    const mergedComponents: CellRendererComponents = {
      ...registry,
      ...props.cellRendererComponents,
    };
    return mergedComponents;
  }),
);
provide<ComputedRef<TooltipRendererComponents>>(
  'tooltipRendererComponents',
  computed(() => {
    const registry = getParentChildComponentRegistry();
    const mergedComponents: TooltipRendererComponents = {
      ...registry,
      ...props.tooltipRendererComponents,
    };
    return mergedComponents;
  }),
);

// -----获取DOM元素-----
const tableRef = ref<HTMLElement | null>(null);
const tableHeaderRef = ref<InstanceType<typeof TableHeader>>();
const tableBodyRef = ref<InstanceType<typeof TableBody>>();
const getHeaderRef = () => tableHeaderRef.value?.headerRef;
const getNotPinnedHeaderRef = () => tableHeaderRef.value?.notPinnedHeaderRef;
const getColsRef = () => tableBodyRef.value?.colsRef;
const getNotPinnedColsRef = () => tableBodyRef.value?.notPinnedColsRef;
const getTableContentContainerRef = () =>
  tableBodyRef.value?.tableContentContainerRef;

// -----表头、表格主体横向滚动同步-----
const { syncHeaderBodyScroll, syncNotPinnedScroll } = useScrollSync({
  headerRef: getHeaderRef,
  notPinnedHeaderRef: getNotPinnedHeaderRef,
  colsRef: getColsRef,
  notPinnedColsRef: getNotPinnedColsRef,
});

// -----排序-----
const { emitSortEvent } = useSort();
const sort = (column: ColumnDef) => {
  if (!column.sortable) return;
  const lastData = [...innerRowData.value];
  const sortResult = performSort({
    data: props.rowData,
    columns: innerColumnDefs.value,
    columnToSort: column,
    api: api.value,
    context: innerGridOptions.value?.context,
  });

  const sortEvent = createSortEvent(
    column,
    sortResult.updatedColumns.find((c) => c.field === column.field)
      ?.sortOrder || '',
    props.rowData,
    sortResult.sortedData,
    lastData,
    innerGridOptions.value?.context,
  );
  emitSortEvent(emits, sortEvent);
  innerRowData.value = sortResult.sortedData;
  innerColumnDefs.value = sortResult.updatedColumns;
};

// -----选择-----
const { handleSelectionChanged, handleHeaderSelectionChanged } = useSelection(
  api,
  emits,
);

// -----tooltip-----
const {
  currentRow,
  currentColumn,
  tooltipCellRef,
  handleLongPressStartTooltip,
  judgeIsScrolling,
  handleLongPressStopTooltip,
  handleClickTooltip,
} = useTooltip(innerGridOptions);

// -----事件-----
const handleHeaderClick = (
  columnHeaderClickedEvent: ColumnHeaderClickedEvent,
) => {
  const { column } = columnHeaderClickedEvent;
  sort(column);
};
const handleCellTouchStart = (
  e: TouchEvent,
  row: RowData,
  column: ColumnDef,
) => {
  handleLongPressStartTooltip(e, row, column);
};

const handleCellTouchMove = (e: TouchEvent) => {
  judgeIsScrolling(e);
};
const handleCellTouchEnd = () => {
  handleLongPressStopTooltip();
};

const handleCellClick = (e: Event, row: RowData, column: ColumnDef) => {
  handleClickTooltip(e, row, column);
};

// 溢出检测
const { judgeOverflow } = useOverflowDetection(getColsRef, getHeaderRef);

// 样式管理
const { tableClasses } = useTableStyle(innerGridOptions, api, tableRef);

onMounted(() => {
  judgeOverflow();
});
</script>

<template>
  <div :class="tableClasses" ref="tableRef">
    <template v-if="gridReady">
      <!-- 表头组件 -->
      <TableHeader
        ref="tableHeaderRef"
        :column-defs="innerColumnDefs"
        :pinned-left-columns="pinnedLeftColumnDefs"
        :not-pinned-columns="notPinnedColumnDefs"
        :pinned-right-columns="pinnedRightColumnDefs"
        @column-header-clicked="handleHeaderClick"
        @selection-changed="handleHeaderSelectionChanged"
        @scroll-header-body="(e) => syncHeaderBodyScroll('header', e)"
        @scroll-not-pinned="(e) => syncNotPinnedScroll('header', e)"
      />
      <!-- 表格主体组件 -->
      <TableBody
        ref="tableBodyRef"
        :row-data="innerRowData"
        :pinned-left-columns="pinnedLeftColumnDefs"
        :not-pinned-columns="notPinnedColumnDefs"
        :pinned-right-columns="pinnedRightColumnDefs"
        @touchstart="handleCellTouchStart"
        @touchmove="handleCellTouchMove"
        @touchend="handleCellTouchEnd"
        @click="handleCellClick"
        @selection-changed="handleSelectionChanged"
        @scroll-header-body="(e) => syncHeaderBodyScroll('content', e)"
        @scroll-not-pinned="(e) => syncNotPinnedScroll('content', e)"
      />
    </template>
    <teleport v-if="gridReady" to="#table-content-container">
      <Tooltip
        v-if="innerGridOptions.tooltipShow"
        ref="tooltipCellRef"
        :row="currentRow"
        :column="currentColumn"
        :content-element-ref="getTableContentContainerRef()!"
      />
    </teleport>
  </div>
</template>

<style lang="less" scoped>
@import './style/index.less';
</style>
