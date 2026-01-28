<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<script lang="ts" setup>
import { inject } from 'vue';
import type { Ref } from 'vue';
import Checkbox from './Checkbox/Checkbox.vue';
import type {
  ColumnDef,
  RowData,
  GridOptions,
  CusTomGridParams,
  CellRendererComponents,
  SelectionChangedEvent,
} from '../typings';
import { isFunction } from '../config/utils';
import { getWidth, getCommonClass } from '../config/table';
import { GridApi } from '../manager/GridApi';

const props = withDefaults(
  defineProps<{
    row: RowData;
    column: ColumnDef;
  }>(),
  {
    row: () => ({}) as RowData,
    column: () => ({}) as ColumnDef,
  },
);

const emits = defineEmits<{
  (e: 'selectionChanged', selectionChangedEvent: SelectionChangedEvent): void;
}>();

const gridOptions: GridOptions = inject('gridOptions') as GridOptions;
const cellRendererComponents: CellRendererComponents = inject(
  'cellRendererComponents',
) as CellRendererComponents;
const api = inject('api') as Ref<GridApi>;

const getCellStyle = (row: RowData, column: ColumnDef) => {
  const value = row[column.field];
  const params = {
    row,
    column,
    value,
    node: api.value.getRowNode(row._id)!,
    api: api.value,

    context: gridOptions?.context,
  };
  const cellStyle =
    (isFunction(column?.cellStyle)
      ? column?.cellStyle?.(params)
      : column?.cellStyle) || {};
  return { ...cellStyle, ...getWidth(column) };
};

const getCellClass = (row: RowData, column: ColumnDef) => {
  const value = row[column.field];
  const params = {
    row,
    column,
    value,
    node: api.value.getRowNode(row._id)!,
    api: api.value,

    context: gridOptions?.context,
  };
  return {
    ...getCommonClass({ column, isHeader: false }),
    ...((isFunction(column?.cellClass)
      ? column?.cellClass?.(params)
      : column?.cellClass) || {}),
  };
};

const getCellValue = (row: RowData, column: ColumnDef) => {
  let value = row[column.field];
  const params = {
    row,
    column,
    value,
    node: api.value.getRowNode(row._id)!,
    api: api.value,
    context: gridOptions?.context,
  };
  if (column.valueGetter) {
    value = column.valueGetter(params);
    params.value = column.valueGetter(params);
  }
  if (column.valueFormatter) return column.valueFormatter(params);
  return value;
};

const getCellRenderer = (row: RowData, column: ColumnDef) => {
  const value = row[column.field];
  const params = {
    row,
    column,
    value,
    node: api.value.getRowNode(row._id)!,
    api: api.value,

    context: gridOptions?.context,
  };
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
const getCellRendererComponent = (row: RowData, column: ColumnDef) => {
  const value = row[column.field];
  const params = {
    row,
    column,
    value,
    node: api.value.getRowNode(row._id)!,
    api: api.value,

    context: gridOptions?.context,
  };
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
  row: RowData,
  column: ColumnDef,
): CusTomGridParams => {
  const value = row[column.field];
  const params = {
    row,
    column,
    value,
    node: api.value.getRowNode(row._id)!,
    api: api.value,

    context: gridOptions?.context,
  };
  let cellRendererParams = {};
  if (column?.cellRendererSelector) {
    cellRendererParams = column.cellRendererSelector(params)?.params;
  }
  return { ...params, ...cellRendererParams };
};

const toggleSelection = (e: Event) => {
  if (gridOptions.rowSelection?.enableClickSelection) {
    return;
  }
  const checked = (e.target as HTMLInputElement).checked;
  const rowNode = api.value.getRowNode(props.row._id);
  if (!rowNode) return;
  if (checked) {
    api.value.selectNode(rowNode, false);
  } else {
    api.value.deselectNode(rowNode);
  }
  emitsSelectionChanged();
};

const handleClickCell = (row: RowData) => {
  // 行选择
  if (gridOptions.rowSelection?.enableClickSelection) {
    const rowNode = api.value.getRowNode(row._id);
    if (!rowNode) return;
    if (rowNode.isSelected()) {
      api.value.deselectNode(rowNode);
    } else {
      api.value.selectNode(rowNode, false);
    }
    emitsSelectionChanged();
  }
};

const emitsSelectionChanged = () => {
  emits('selectionChanged', {
    type: 'selectionChanged',
    selectedNodes: api.value.getSelectedNodes(),
    selectedData: api.value.getSelectedRows(),
    selectionCount: api.value.getSelectedRows().length,
  });
};
</script>

<template>
  <div
    class="pinned-left table-cell"
    :class="getCellClass(row, column)"
    :style="getCellStyle(row, column)"
    @click="handleClickCell(row)"
  >
    <template v-if="getCellRenderer(row, column).hasComponent">
      <component
        :is="getCellRendererComponent(row, column)"
        v-if="getCellRenderer(row, column).cellRendererType === 'component'"
        :params="getCellRendererParams(row, column)"
      />
      <span v-else v-html="getCellRendererComponent(row, column)"></span>
    </template>
    <template v-else-if="column.checkboxSelection">
      <Checkbox
        :checked="api.getRowNode(row._id)?.isSelected()"
        @change="toggleSelection"
      />
    </template>
    <span v-else>
      {{ getCellValue(row, column) }}
    </span>
  </div>
</template>

<style lang="less" scoped></style>
