<!-- components/TableBody.vue -->
<script setup lang="ts">
import { ref, inject, watch, nextTick } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import TableCell from './TableCell.vue';
import type {
  ColumnDef,
  RowData,
  SelectionChangedEvent,
  GridOptions,
  GridApi,
} from '../../typings';
import { isFunction } from '../../utils/utils';

interface Props {
  rowData?: Array<RowData>;
  pinnedLeftColumns?: Array<ColumnDef>;
  notPinnedColumns?: Array<ColumnDef>;
  pinnedRightColumns?: Array<ColumnDef>;
}

const props = withDefaults(defineProps<Props>(), {
  rowData: () => [],
  pinnedLeftColumns: () => [],
  notPinnedColumns: () => [],
  pinnedRightColumns: () => [],
});

const emits = defineEmits<{
  (e: 'touchstart', event: TouchEvent, row: RowData, column: ColumnDef): void;
  (e: 'touchmove', event: TouchEvent): void;
  (e: 'touchend', event: TouchEvent): void;
  (e: 'click', event: Event, row: RowData, column: ColumnDef): void;
  (e: 'selectionChanged', event: SelectionChangedEvent): void;
  (e: 'scrollHeaderBody', event: Event): void;
  (e: 'scrollNotPinned', event: Event): void;
}>();

const gridOptions: ComputedRef<GridOptions> = inject(
  'gridOptions',
) as ComputedRef<GridOptions>;
const api = inject('api') as Ref<GridApi>;

// DOM引用 - 用于外部访问
const colsRef = ref<HTMLElement>();
const tableContentRef = ref<HTMLElement>();
const notPinnedColsRef = ref<HTMLElement>();
const tableContentContainerRef = ref<HTMLElement>();
// 计算列类名
const getColumnClasses = (
  index: number,
  columnType: 'left' | 'right' | 'center',
) => {
  const classes: Record<string, boolean> = {};

  if (columnType === 'left') {
    classes['cell-last-left-pinned'] =
      index === props.pinnedLeftColumns!.length - 1;
  } else if (columnType === 'right') {
    classes['cell-first-right-pinned'] = index === 0;
  }

  return classes;
};

// 事件处理
const handleTouchStart = (e: TouchEvent, row: RowData, column: ColumnDef) => {
  emits('touchstart', e, row, column);
};

const handleTouchMove = (e: TouchEvent) => {
  emits('touchmove', e);
};

const handleTouchEnd = (e: TouchEvent) => {
  emits('touchend', e);
};

const handleClick = (e: Event, row: RowData, column: ColumnDef) => {
  emits('click', e, row, column);
};

const handleSelectionChanged = (event: SelectionChangedEvent) => {
  emits('selectionChanged', event);
};

const handleBodyScroll = (e: Event) => {
  emits('scrollHeaderBody', e);
};

const handleNotPinnedScroll = (e: Event) => {
  emits('scrollNotPinned', e);
};

// 行高
const getRowStyle = (row: RowData) => {
  const rowHeight = gridOptions.value.rowHeight;
  const params = {
    row,
    node: api.value.getRowNode(row._id)!,
    api: api.value,
    context: gridOptions.value?.context,
  };
  const height = isFunction(rowHeight) ? rowHeight(params) : rowHeight;
  return {
    height: `${height}px`,
  };
};

const checkNeedBottomBorder = async () => {
  await nextTick();
  if (!colsRef.value || !tableContentRef.value) return;
  if (colsRef.value?.clientHeight !== tableContentRef.value?.clientHeight) {
    const domClass = [
      '.pinned-left-cols-container',
      '.cols-container',
      '.pinned-right-cols-container',
    ];
    domClass.forEach((className) => {
      const tableRows = colsRef.value?.querySelectorAll(
        `${className} .table-row`,
      ) as unknown as HTMLElement[];
      // const tableRows = dom.querySelectorAll('.table-row');
      const lastRow = tableRows[tableRows.length - 1] as HTMLElement;
      if (lastRow) {
        lastRow.style.borderBottom = 'var(--border)';
      }
    });
  }
};

watch(
  () => props.rowData,
  () => {
    checkNeedBottomBorder();
  },
  {
    immediate: true,
  },
);

// 暴露给父组件的ref
defineExpose({
  colsRef,
  notPinnedColsRef,
  tableContentContainerRef,
});
</script>

<template>
  <div
    ref="colsRef"
    class="table-content-scroll-container"
    id="table-content-scroll-container"
    @scroll="handleBodyScroll"
  >
    <div
      id="table-content-container"
      ref="tableContentContainerRef"
      class="table-content-container"
    >
      <div class="table-content" ref="tableContentRef">
        <!-- 左侧固定列 -->
        <div class="pinned-left-cols-container" v-if="pinnedLeftColumns.length">
          <div
            v-for="(row, rowIndex) in rowData"
            :key="row._id || rowIndex"
            class="table-row"
            :style="getRowStyle(row)"
          >
            <TableCell
              v-for="(column, index) in pinnedLeftColumns"
              :key="`cell-left-${column.field || index}`"
              :class="getColumnClasses(index, 'left')"
              :row="row"
              :column="column"
              @touchstart.passive="
                (e: TouchEvent) => handleTouchStart(e, row, column)
              "
              @touchmove.passive="handleTouchMove"
              @touchend.passive="handleTouchEnd"
              @contextmenu.prevent
              @click="(e: Event) => handleClick(e, row, column)"
              @selection-changed="handleSelectionChanged"
            />
          </div>
        </div>

        <!-- 中间滚动列 -->
        <div
          ref="notPinnedColsRef"
          class="cols-container"
          @scroll="handleNotPinnedScroll"
          v-if="notPinnedColumns.length"
        >
          <div
            v-for="(row, rowIndex) in rowData"
            :key="row._id || rowIndex"
            class="table-row"
            :style="getRowStyle(row)"
          >
            <TableCell
              v-for="(column, index) in notPinnedColumns"
              :key="`cell-center-${column.field || index}`"
              :class="getColumnClasses(index, 'center')"
              :row="row"
              :column="column"
              @touchstart.passive="
                (e: TouchEvent) => handleTouchStart(e, row, column)
              "
              @touchmove.passive="handleTouchMove"
              @touchend.passive="handleTouchEnd"
              @contextmenu.prevent
              @click="(e: Event) => handleClick(e, row, column)"
              @selection-changed="handleSelectionChanged"
            />
          </div>
        </div>

        <!-- 右侧固定列 -->
        <div
          class="pinned-right-cols-container"
          v-if="pinnedRightColumns.length"
        >
          <div
            v-for="(row, rowIndex) in rowData"
            :key="row._id || rowIndex"
            class="table-row"
            :style="getRowStyle(row)"
          >
            <TableCell
              v-for="(column, index) in pinnedRightColumns"
              :key="`cell-right-${column.field || index}`"
              :class="getColumnClasses(index, 'right')"
              :row="row"
              :column="column"
              @touchstart.passive="
                (e: TouchEvent) => handleTouchStart(e, row, column)
              "
              @touchmove.passive="handleTouchMove"
              @touchend.passive="handleTouchEnd"
              @contextmenu.prevent
              @click="(e: Event) => handleClick(e, row, column)"
              @selection-changed="handleSelectionChanged"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="less" scoped>
@import '../../style/index.less';
</style>
