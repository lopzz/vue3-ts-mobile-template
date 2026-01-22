<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<script lang="ts" setup>
import { ref, provide, watch, onMounted } from 'vue';
import type { Ref } from 'vue';
// 组件
import HeaderCell from './components/HeaderCell.vue';
import TableCell from './components/TableCell.vue';
import Tooltip from './components/Tooltip/Tooltip.vue';
// 类型
import type {
  ColumnDef,
  RowDataItem,
  GridOptions,
  CellRendererComponents,
  TooltipRendererComponents,
  SortChangedEvent,
  ColumnHeaderClickedEvent,
} from './config/types';
// 工具方法
import { isNumber, isNull, isUnDef } from './config/utils';
import { defaultGridOptions } from './config/defaultConfig';
import { defu } from 'defu';

const props = withDefaults(
  defineProps<{
    columnDefs?: Array<ColumnDef>;
    rowData?: Array<RowDataItem>;
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
}>();

const innerRowData: Ref<Array<RowDataItem>> = ref([...props.rowData]);
watch(
  () => props.rowData,
  (newVal) => {
    innerRowData.value = [...newVal];
  },
);

const innerColumnDefs: Ref<Array<ColumnDef>> = ref([...props.columnDefs]);
const pinnedLeftColumnDefs = ref(
  innerColumnDefs.value.filter((c) => c.pinned === 'left'),
);
const pinnedRightColumnDefs = ref(
  innerColumnDefs.value.filter((c) => c.pinned === 'right'),
);
const notPinnedColumnDefs = ref(innerColumnDefs.value.filter((c) => !c.pinned));
watch(
  () => props.columnDefs,
  (newVal) => {
    innerColumnDefs.value = [...newVal];
  },
);
watch(
  () => innerColumnDefs.value,
  (newVal) => {
    pinnedLeftColumnDefs.value = newVal.filter((c) => c.pinned === 'left');
    pinnedRightColumnDefs.value = newVal.filter((c) => c.pinned === 'right');
    notPinnedColumnDefs.value = newVal.filter((c) => !c.pinned);
  },
  {
    deep: true,
  },
);

const innerGridOptions = defu(props.gridOptions, defaultGridOptions);

provide<GridOptions>('gridOptions', innerGridOptions);
provide<Array<ColumnDef>>('columnDefs', innerColumnDefs.value);
provide<Array<RowDataItem>>('rowData', innerRowData.value);
provide<CellRendererComponents>(
  'cellRendererComponents',
  props.cellRendererComponents,
);
provide<TooltipRendererComponents>(
  'tooltipRendererComponents',
  props.tooltipRendererComponents,
);

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

  const defaultSortFunc = (rowA: RowDataItem, rowB: RowDataItem) => {
    const paramsRowA = {
      row: rowA,
      column,
      value: rowA[column.field],
      context: innerGridOptions?.context,
    };
    const paramsRowB = {
      row: rowB,
      column,
      value: rowB[column.field],
      context: innerGridOptions?.context,
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
        ? (rowA: RowDataItem, rowB: RowDataItem) =>
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
    context: innerGridOptions?.context,
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

// toolip
const currentRow: Ref<RowDataItem> = ref({});
const currentColumn: Ref<ColumnDef> = ref({} as ColumnDef);
const tooltipCellRef = ref();
const showTooltip = (e: Event, row: RowDataItem, column: ColumnDef) => {
  if (!tooltipCellRef.value) return;
  currentRow.value = row;
  currentColumn.value = column;
  tooltipCellRef.value.show({ event: e, row, column });
};
let pressTimer: number | null = null;

const handleTouchStartCell = (
  e: Event,
  row: RowDataItem,
  column: ColumnDef,
) => {
  if (innerGridOptions.tooltipTriggerType !== 'longPress') return;
  pressTimer = setTimeout(() => {
    showTooltip(e, row, column);
  }, innerGridOptions.tooltipShowDelay || 200); // 最小长按事件为200ms
};

const handleTouchEndCell = () => {
  if (innerGridOptions.tooltipTriggerType !== 'longPress') return;
  clearTimeout(pressTimer as number);
};

const handleClickCell = (e: Event, row: RowDataItem, column: ColumnDef) => {
  if (innerGridOptions.tooltipTriggerType !== 'click') return;
  const timer = setTimeout(() => {
    showTooltip(e, row, column);
    clearTimeout(timer);
  }, innerGridOptions.tooltipShowDelay);
};

const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const tableContentContainerRef = ref();
</script>

<template>
  <div class="scroll-table table">
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
            'cell-last-left-pinned': index === pinnedLeftColumnDefs.length - 1,
          }"
          :column="column"
          @column-header-clicked="handleClickHeader"
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
        <div v-if="innerRowData.length" class="table-content">
          <div class="pinned-left-cols-container">
            <div
              v-for="(row, rowIndex) in innerRowData"
              :key="rowIndex"
              class="table-row"
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
                @touchstart="(e: Event) => handleTouchStartCell(e, row, column)"
                @touchend="(e: Event) => handleTouchEndCell()"
                @contextmenu.prevent
                @click="(e: Event) => handleClickCell(e, row, column)"
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
            >
              <!-- Render unpinned columns -->
              <TableCell
                v-for="(column, index) in notPinnedColumnDefs"
                :key="`cell-center-${index}`"
                :row="row"
                :column="column"
                @touchstart="(e: Event) => handleTouchStartCell(e, row, column)"
                @touchend="(e: Event) => handleTouchEndCell()"
                @contextmenu.prevent
                @click="(e: Event) => handleClickCell(e, row, column)"
              />
            </div>
          </div>
          <div class="pinned-right-cols-container">
            <div
              v-for="(row, rowIndex) in innerRowData"
              :key="rowIndex"
              class="table-row"
            >
              <!-- Render pinned right columns -->
              <TableCell
                v-for="(column, index) in pinnedRightColumnDefs"
                :key="`cell-right-${index}`"
                :class="{ 'cell-first-right-pinned': index === 0 }"
                :row="row"
                :column="column"
                @touchstart="(e: Event) => handleTouchStartCell(e, row, column)"
                @touchend="(e: Event) => handleTouchEndCell()"
                @contextmenu.prevent
                @click="(e: Event) => handleClickCell(e, row, column)"
              />
            </div>
          </div>
        </div>
        <div v-else class="u-p-t-40">
          <custom-empty :size="180" />
        </div>
      </div>
    </div>
  </div>
  <teleport v-if="mounted" to="#table-content-container">
    <Tooltip
      v-if="innerGridOptions.tooltipShow"
      ref="tooltipCellRef"
      :row="currentRow"
      :column="currentColumn"
      :content-element-ref="tableContentContainerRef"
    />
  </teleport>
</template>

<style lang="less" scoped>
@import './style/index.less';
</style>
