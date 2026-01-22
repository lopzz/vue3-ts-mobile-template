<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<script lang="ts" setup>
import { inject } from 'vue';
import type {
  ColumnDef,
  RowDataItem,
  GridOptions,
  CusTomGridParams,
  CellRendererComponents,
} from '../config/types';
import { isFunction } from '../config/utils';
import { getWidth, getCommonClass } from '../config/table';

withDefaults(
  defineProps<{
    row: RowDataItem;
    column: ColumnDef;
  }>(),
  {
    row: () => ({}) as RowDataItem,
    column: () => ({}) as ColumnDef,
  },
);

const gridOptions: GridOptions = inject('gridOptions') as GridOptions;
const cellRendererComponents: CellRendererComponents = inject(
  'cellRendererComponents',
) as CellRendererComponents;

const getCellStyle = (row: RowDataItem, column: ColumnDef) => {
  const value = row[column.field];
  const params = { row, column, value, context: gridOptions?.context };
  const cellStyle =
    (isFunction(column?.cellStyle)
      ? column?.cellStyle?.(params)
      : column?.cellStyle) || {};
  return { ...cellStyle, ...getWidth(column) };
};

const getCellClass = (row: RowDataItem, column: ColumnDef) => {
  const value = row[column.field];
  const params = { row, column, value, context: gridOptions?.context };
  return {
    ...getCommonClass({ column, isHeader: false }),
    ...((isFunction(column?.cellClass)
      ? column?.cellClass?.(params)
      : column?.cellClass) || {}),
  };
};

const getCellValue = (row: RowDataItem, column: ColumnDef) => {
  let value = row[column.field];
  const params = { row, column, value, context: gridOptions?.context };
  if (column.valueGetter) {
    value = column.valueGetter(params);
    params.value = column.valueGetter(params);
  }
  if (column.valueFormatter) return column.valueFormatter(params);
  return value;
};

const getCellRenderer = (row: RowDataItem, column: ColumnDef) => {
  const value = row[column.field];
  const params = { row, column, value, context: gridOptions?.context };
  let cellRendererType = '';
  if (column?.cellRendererSelector) {
    cellRendererType = 'component';
    return {
      cellRendererType,
      hasComponent: isFunction(column?.cellRendererSelector)
        ? !!column?.cellRendererSelector?.(params)
        : !!column?.cellRendererSelector,
    };
  }
  if (column?.cellRenderer) {
    if (isFunction(column?.cellRenderer)) {
      cellRendererType = 'html';
    } else {
      cellRendererType = 'component';
    }
  }
  return {
    cellRendererType,
    hasComponent: isFunction(column?.cellRenderer)
      ? !!column?.cellRenderer?.(params)
      : !!column?.cellRenderer,
  };
};
const getCellRendererComponent = (row: RowDataItem, column: ColumnDef) => {
  const value = row[column.field];
  const params = { row, column, value, context: gridOptions?.context };
  let componentName: string | undefined = '';
  if (column?.cellRendererSelector) {
    componentName = column.cellRendererSelector(params)?.component;
    return componentName ? cellRendererComponents?.[componentName] : undefined;
  }
  if (isFunction(column?.cellRenderer)) {
    const htmlStr = column?.cellRenderer?.(params);
    return htmlStr;
  }
  componentName = column?.cellRenderer;
  return componentName ? cellRendererComponents?.[componentName] : undefined;
};

const getCellRendererParams = (
  row: RowDataItem,
  column: ColumnDef,
): CusTomGridParams => {
  const value = row[column.field];
  const params = { row, column, value, context: gridOptions?.context };
  let cellRendererParams = {};
  if (column?.cellRendererSelector) {
    cellRendererParams = column.cellRendererSelector(params)?.params;
  }
  return { ...params, ...cellRendererParams };
};
</script>

<template>
  <div
    class="pinned-left table-cell"
    :class="getCellClass(row, column)"
    :style="getCellStyle(row, column)"
  >
    <template v-if="getCellRenderer(row, column).hasComponent">
      <component
        :is="getCellRendererComponent(row, column)"
        v-if="getCellRenderer(row, column).cellRendererType === 'component'"
        :params="getCellRendererParams(row, column)"
      />
      <span v-else v-html="getCellRendererComponent(row, column)"></span>
    </template>
    <span v-else>
      {{ getCellValue(row, column) }}
    </span>
  </div>
</template>
