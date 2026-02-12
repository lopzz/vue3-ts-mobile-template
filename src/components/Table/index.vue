<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<script lang="ts" setup>
import {
  ref,
  provide,
  watch,
  onBeforeMount,
  nextTick,
  onMounted,
  computed,
} from 'vue';
import type { Ref, ComputedRef } from 'vue';
// 组件
import HeaderCell from './components/HeaderCell.vue';
import TableCell from './components/TableCell.vue';
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
  HeaderSelectionChangedEvent,
} from './typings';
// 工具方法
import { isNumber, isNull, isUnDef, isFunction } from './config/utils';
import { defaultGridOptions } from './config/defaultConfig';
import { defu } from 'defu';

import { RowManager } from './manager/RowManager';
import { GridApi } from './manager/GridApi';

// hooks
import { useParentChildComponentResolver } from './hooks/useParentChildComponentResolver';

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

const innerRowData: Ref<Array<RowData>> = ref([...props.rowData]);

watch(
  () => props.rowData,
  (newVal) => {
    innerRowData.value = [...newVal];
  },
  {
    immediate: true,
    deep: true,
  },
);

const innerColumnDefs: ComputedRef<Array<ColumnDef>> = computed(
  () => props.columnDefs,
);

const pinnedLeftColumnDefs = computed(() =>
  innerColumnDefs.value.filter((c) => c.pinned === 'left'),
);
const pinnedRightColumnDefs = computed(() =>
  innerColumnDefs.value.filter((c) => c.pinned === 'right'),
);
const notPinnedColumnDefs = computed(() =>
  innerColumnDefs.value.filter((c) => !c.pinned),
);

const innerGridOptions = computed(() => {
  return defu(props.gridOptions, defaultGridOptions);
});

provide<ComputedRef<GridOptions>>('gridOptions', innerGridOptions);
provide<ComputedRef<Array<ColumnDef>>>('columnDefs', innerColumnDefs);
provide<Ref<Array<RowData>>>('rowData', innerRowData);

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

// 列固定
const headerContainerRef = ref();
const colsContainerRef = ref();
const handleScrollNotPinned = (e: Event, type: 'header' | 'content') => {
  if (type === 'header') {
    colsContainerRef.value.scrollLeft = (e.target as HTMLElement).scrollLeft;
  } else if (type === 'content') {
    headerContainerRef.value.scrollLeft = (e.target as HTMLElement).scrollLeft;
  }
};

const tableHeaderRef = ref();
const tableContentScrollContainerRef = ref();
const handleScrollContainer = (e: Event, type: 'header' | 'content') => {
  if (type === 'header') {
    tableContentScrollContainerRef.value.scrollLeft = (
      e.target as HTMLElement
    ).scrollLeft;
  } else if (type === 'content') {
    tableHeaderRef.value.scrollLeft = (e.target as HTMLElement).scrollLeft;
  }
};

const handleClickHeader = (
  columnHeaderClickedEvent: ColumnHeaderClickedEvent,
) => {
  const { column } = columnHeaderClickedEvent;
  if (column.sortable) {
    sort(column);
  }
};

// 排序
const sort = (column: ColumnDef) => {
  resetOtherColumnSort(column);
  // 切换排序方向
  if (column.sortOrder === 'asc') {
    column.sortOrder = 'desc';
  } else if (column.sortOrder === 'desc') {
    column.sortOrder = '';
  } else {
    column.sortOrder = 'asc';
  }

  const defaultSortFunc = (rowA: RowData, rowB: RowData) => {
    const paramsRowA = {
      row: rowA,
      column,
      value: rowA[column.field],
      node: api.value.getRowNode(rowA._id)!,
      api: api.value,
      context: innerGridOptions.value?.context,
    };
    const paramsRowB = {
      row: rowB,
      column,
      value: rowB[column.field],
      node: api.value.getRowNode(rowB._id)!,
      api: api.value,
      context: innerGridOptions.value?.context,
    };
    const valueA = column.valueGetter
      ? column.valueGetter(paramsRowA)
      : rowA[column.field];
    const valueB = column.valueGetter
      ? column.valueGetter(paramsRowB)
      : rowB[column.field];
    // 检查值是否为数字
    if (isNumber(valueA) && isNumber(valueB)) {
      // 如果是数字，转换为数字进行比较
      return column.sortOrder === 'asc'
        ? Number(valueA) - Number(valueB)
        : Number(valueB) - Number(valueA);
    }
    // 如果不是数字，转换为字符串进行比较
    return column.sortOrder === 'asc'
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  };
  const lastData = [...innerRowData.value];
  // 根据排序方向对 rowData 进行排序
  const serverSort = isNull(column.comparator);
  if (!serverSort) {
    if (['asc', 'desc'].includes(column.sortOrder)) {
      const comparator = column.comparator
        ? (rowA: RowData, rowB: RowData) =>
            column.comparator!({
              valueA: rowA[column.field],
              valueB: rowB[column.field],
              rowA,
              rowB,
              column,
            })
        : defaultSortFunc;
      innerRowData.value.sort(comparator);
    } else {
      innerRowData.value = [...props.rowData];
    }
  }
  const sortChangedEvent: SortChangedEvent = {
    originData: props.rowData,
    lastData,
    data: innerRowData.value,
    column,
    sortOrder: column.sortOrder,
    type: 'sortChanged',
    context: innerGridOptions.value?.context,
  };
  emits('sortChanged', sortChangedEvent);
};

const resetOtherColumnSort = (notResetColumn: ColumnDef) => {
  innerColumnDefs.value.forEach((column) => {
    if (column.field !== notResetColumn.field) {
      if (!isUnDef(column.sortOrder)) {
        column.sortOrder = '';
      }
    }
  });
};

// 行选择
const selectionChanged = (selectionChangedEvent: SelectionChangedEvent) => {
  emits('selectionChanged', selectionChangedEvent);
};

const headerSelectionChanged = (
  headerSelectionChangedEvent: HeaderSelectionChangedEvent,
) => {
  const { column, checked } = headerSelectionChangedEvent;
  if (!column.checkboxSelection) return;
  // 全选或取消全选
  if (checked) {
    api.value.selectAll();
  } else {
    api.value.deselectAll();
  }
  const selectionChangedEvent: SelectionChangedEvent = {
    type: 'selectionChanged',
    selectedNodes: api.value.getSelectedNodes(),
    selectedData: api.value.getSelectedRows(),
    selectionCount: api.value.getSelectedRows().length,
  };
  emits('selectionChanged', selectionChangedEvent);
};

// tooltip
const currentRow: Ref<RowData> = ref({});
const currentColumn: Ref<ColumnDef> = ref({} as ColumnDef);
const tooltipCellRef = ref();
const tableContentContainerRef = ref();
const showTooltip = (e: Event, row: RowData, column: ColumnDef) => {
  if (!tooltipCellRef.value) return;
  currentRow.value = row;
  currentColumn.value = column;
  tooltipCellRef.value.show({ event: e, row, column });
};
let pressTimer: number | null = null;
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStartCell = (
  e: TouchEvent,
  row: RowData,
  column: ColumnDef,
) => {
  if (innerGridOptions.value.tooltipTriggerType !== 'longPress') return;
  if (!e.touches[0]) return;
  // 记录触摸开始位置和时间
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  pressTimer = setTimeout(() => {
    showTooltip(e, row, column);
  }, innerGridOptions.value.tooltipShowDelay || 200); // 最小长按事件为200ms
};
const handleTouchMoveCell = (e: TouchEvent) => {
  if (!e.touches[0]) return;
  const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
  const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
  // 如果移动超过阈值，标记为移动
  if (deltaX > 5 || deltaY > 5) {
    clearTimeout(pressTimer as number);
  }
};
const handleTouchEndCell = () => {
  if (innerGridOptions.value.tooltipTriggerType !== 'longPress') return;
  clearTimeout(pressTimer as number);
};

const handleClickCell = (e: Event, row: RowData, column: ColumnDef) => {
  // tooltip
  if (innerGridOptions.value.tooltipTriggerType === 'click') {
    const timer = setTimeout(() => {
      showTooltip(e, row, column);
      clearTimeout(timer);
    }, innerGridOptions.value.tooltipShowDelay);
  }
};

// 行高
const getRowStyle = (row: RowData) => {
  const rowHeight = innerGridOptions.value.rowHeight;
  const params = {
    row,
    node: api.value.getRowNode(row._id)!,
    api: api.value,
    context: innerGridOptions.value?.context,
  };
  const height = isFunction(rowHeight) ? rowHeight(params) : rowHeight;
  return {
    height: `${height}px`,
  };
};

// 表格边框
const hasBorder = () => {
  const border = innerGridOptions.value.border;
  if (isFunction(border)) {
    const params = {
      api: api.value,
      context: innerGridOptions.value?.context,
    };
    // 设置css变量值
    const element = document.querySelector(
      '.table.border-table',
    ) as HTMLElement;
    element && element.style.setProperty('--border', border(params));
  }
  if (border) return true;
};

// 判断表格是否出现纵向滚动条，如果有则给最后一列加上滚动条宽度
const judgeOverflow = async () => {
  await nextTick();
  await nextTick();
  const element = tableContentScrollContainerRef.value;
  // 判断逻辑
  if (element.scrollHeight > element.clientHeight) {
    const headerCellElements = document.querySelectorAll('.header-cell');
    const lastHeaderCellElement = headerCellElements[
      headerCellElements.length - 1
    ] as HTMLElement;
    if (lastHeaderCellElement) {
      lastHeaderCellElement.style.width = `calc(${getComputedStyle(lastHeaderCellElement).width} + 8px)`;
    }
  }
};

// 准备表格api，建立node和data的映射关系
const gridReady = ref(false);
const api = ref<GridApi>({} as GridApi);
provide<Ref<GridApi>>('api', api as Ref<GridApi>);
onBeforeMount(() => {
  // 创建行管理器
  const rowManager = new RowManager(
    innerGridOptions.value.getRowId,
    innerGridOptions.value.rowSelection,
  );

  // 创建API
  const gridApi = new GridApi(rowManager);
  api.value = gridApi;
  emits('gridReady', { api: gridApi, columnApi: null });
  api.value.setData([...props.rowData]);
  nextTick(() => {
    gridReady.value = true;
  });
});

onMounted(() => {
  judgeOverflow();
});

watch(
  () => props.rowData,
  (newVal) => {
    api.value.setData([...newVal]);
  },
  {
    deep: true,
  },
);
</script>

<template>
  <div class="scroll-table table" :class="{ 'border-table': hasBorder() }">
    <template v-if="gridReady">
      <div
        ref="tableHeaderRef"
        class="table-header table-row"
        @scroll="(e) => handleScrollContainer(e, 'header')"
      >
        <div class="pinned-left-header-container">
          <!-- Render pinned left columns -->
          <HeaderCell
            v-for="(column, index) in pinnedLeftColumnDefs"
            :key="`header-left-${index}`"
            :class="{
              'cell-last-left-pinned':
                index === pinnedLeftColumnDefs.length - 1,
            }"
            :column="column"
            @column-header-clicked="handleClickHeader"
            @selection-changed="headerSelectionChanged"
          />
        </div>
        <div
          ref="headerContainerRef"
          class="header-container"
          @scroll="(e) => handleScrollNotPinned(e, 'header')"
        >
          <!-- Render unpinned columns -->
          <HeaderCell
            v-for="(column, index) in notPinnedColumnDefs"
            :key="`header-center-${index}`"
            :column="column"
            @column-header-clicked="handleClickHeader"
            @selection-changed="headerSelectionChanged"
          />
        </div>
        <div class="pinned-right-header-container">
          <!-- Render pinned right columns -->
          <HeaderCell
            v-for="(column, index) in pinnedRightColumnDefs"
            :key="`header-right-${index}`"
            :class="{ 'cell-first-right-pinned': index === 0 }"
            :column="column"
            @column-header-clicked="handleClickHeader"
            @selection-changed="headerSelectionChanged"
          />
        </div>
      </div>
      <div
        ref="tableContentScrollContainerRef"
        class="table-content-scroll-container"
        @scroll="(e) => handleScrollContainer(e, 'content')"
      >
        <div
          id="table-content-container"
          ref="tableContentContainerRef"
          class="table-content-container"
        >
          <div class="table-content">
            <div class="pinned-left-cols-container">
              <div
                v-for="(row, rowIndex) in innerRowData"
                :key="rowIndex"
                class="table-row"
                :style="getRowStyle(row)"
              >
                <!-- Render pinned left columns -->
                <TableCell
                  v-for="(column, index) in pinnedLeftColumnDefs"
                  :key="`cell-left-${index}`"
                  :class="{
                    'cell-last-left-pinned':
                      index === pinnedLeftColumnDefs.length - 1,
                  }"
                  :row="row"
                  :column="column"
                  @touchstart.passive="
                    (e: TouchEvent) => handleTouchStartCell(e, row, column)
                  "
                  @touchmove.passive="(e: TouchEvent) => handleTouchMoveCell(e)"
                  @touchend.passive="(e: TouchEvent) => handleTouchEndCell()"
                  @contextmenu.prevent
                  @click="(e: Event) => handleClickCell(e, row, column)"
                  @selection-changed="selectionChanged"
                />
              </div>
            </div>
            <div
              ref="colsContainerRef"
              class="cols-container"
              @scroll="(e) => handleScrollNotPinned(e, 'content')"
            >
              <div
                v-for="(row, rowIndex) in innerRowData"
                :key="rowIndex"
                class="table-row"
                :style="getRowStyle(row)"
              >
                <!-- Render unpinned columns -->
                <TableCell
                  v-for="(column, index) in notPinnedColumnDefs"
                  :key="`cell-center-${index}`"
                  :row="row"
                  :column="column"
                  @touchstart.passive="
                    (e: TouchEvent) => handleTouchStartCell(e, row, column)
                  "
                  @touchmove.passive="(e: TouchEvent) => handleTouchMoveCell(e)"
                  @touchend.passive="(e: TouchEvent) => handleTouchEndCell()"
                  @contextmenu.prevent
                  @click="(e: Event) => handleClickCell(e, row, column)"
                  @selection-changed="selectionChanged"
                />
              </div>
            </div>
            <div class="pinned-right-cols-container">
              <div
                v-for="(row, rowIndex) in innerRowData"
                :key="rowIndex"
                class="table-row"
                :style="getRowStyle(row)"
              >
                <!-- Render pinned right columns -->
                <TableCell
                  v-for="(column, index) in pinnedRightColumnDefs"
                  :key="`cell-right-${index}`"
                  :class="{ 'cell-first-right-pinned': index === 0 }"
                  :row="row"
                  :column="column"
                  @touchstart.passive="
                    (e: TouchEvent) => handleTouchStartCell(e, row, column)
                  "
                  @touchmove.passive="(e: TouchEvent) => handleTouchMoveCell(e)"
                  @touchend.passive="(e: TouchEvent) => handleTouchEndCell()"
                  @contextmenu.prevent
                  @click="(e: Event) => handleClickCell(e, row, column)"
                  @selection-changed="selectionChanged"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <teleport v-if="gridReady" to="#table-content-container">
      <Tooltip
        v-if="innerGridOptions.tooltipShow"
        ref="tooltipCellRef"
        :row="currentRow"
        :column="currentColumn"
        :content-element-ref="tableContentContainerRef"
      />
    </teleport>
  </div>
</template>

<style lang="less" scoped>
@import './style/index.less';
</style>
