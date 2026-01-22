<script lang="ts" setup>
import { inject, computed } from 'vue';
import type {
  ColumnDef,
  GridOptions,
  ColumnHeaderClickedEvent,
} from '../config/types';
import { isFunction, isUnDef } from '../config/utils.ts';
import { getWidth, getCommonClass } from '../config/table';

const props = withDefaults(
  defineProps<{
    column?: ColumnDef;
  }>(),
  {
    column: () => ({}) as ColumnDef,
  },
);

const emits = defineEmits<{
  (
    e: 'columnHeaderClicked',
    columnHeaderClickedEvent: ColumnHeaderClickedEvent,
  ): void;
}>();

const gridOptions: GridOptions = inject('gridOptions') as GridOptions;

const getHeaderStyle = (column: ColumnDef) => {
  const params = { column, context: gridOptions?.context };
  const headerStyle =
    (isFunction(column?.headerStyle)
      ? column?.headerStyle?.(params)
      : column?.headerStyle) || {};
  return { ...headerStyle, ...getWidth(column) };
};

const getHeaderClass = (column: ColumnDef) => {
  const params = { column, context: gridOptions?.context };
  return {
    ...getCommonClass({ column, isHeader: true }),
    ...((isFunction(column?.headerClass)
      ? column?.headerClass?.(params)
      : column?.headerClass) || {}),
  };
};

const getHeaderValue = (column: ColumnDef) => {
  const params = { column, context: gridOptions?.context };
  if (column.headerValueFormatter) return column.headerValueFormatter(params);
  return column.headerName;
};

const handleClickHeader = (column: ColumnDef) => {
  const columnHeaderClickedEvent: ColumnHeaderClickedEvent = {
    column,
    type: 'columnHeaderClicked',
  };
  emits('columnHeaderClicked', columnHeaderClickedEvent);
};
const noSort = computed(
  () => props.column.sortOrder === '' || isUnDef(props.column.sortOrder),
);
const ascSort = computed(() => props.column.sortOrder === 'asc');
const descSort = computed(() => props.column.sortOrder === 'desc');
</script>

<template>
  <div
    class="header-cell table-cell"
    :class="getHeaderClass(column)"
    :style="getHeaderStyle(column)"
    @click="handleClickHeader(column)"
  >
    <div>{{ getHeaderValue(column) }}</div>
    <div v-if="column.sortable" class="sort-container">
      <div
        class="sort-icon-none"
        :class="[{ hidden: descSort || ascSort }]"
      ></div>
      <div
        class="sort-icon-asc"
        :class="[{ hidden: descSort || noSort }]"
      ></div>
      <div
        class="sort-icon-desc"
        :class="[{ hidden: ascSort || noSort }]"
      ></div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '../style/index.less';
</style>
