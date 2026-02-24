<script lang="ts" setup>
import { inject, computed, ref } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import Checkbox from '../Checkbox/Checkbox.vue';

import type {
  ColumnDef,
  GridOptions,
  ColumnHeaderClickedEvent,
  HeaderSelectionChangedEvent,
  GridApi,
} from '../../typings/index';
import { isFunction, isUnDef } from '../../utils/utils.ts';
import { getWidth, getCommonClass } from '../../utils/table.ts';

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
  (
    e: 'selectionChanged',
    selectionChangedEvent: HeaderSelectionChangedEvent,
  ): void;
}>();

const gridOptions: ComputedRef<GridOptions> = inject(
  'gridOptions',
) as ComputedRef<GridOptions>;
const api = inject('api') as Ref<GridApi>;

const getHeaderStyle = (column: ColumnDef) => {
  if (!column.width && headerCellRef.value) {
    headerCellRef.value.classList.remove('text-ellipsis');
    column.width = headerCellRef.value.clientWidth;
    if (column?.ellipsis !== false) {
      headerCellRef.value.classList.add('text-ellipsis');
    }
  }
  const params = {
    column,
    api: api.value,
    context: gridOptions.value?.context,
  };
  const headerStyle =
    (isFunction(column?.headerStyle)
      ? column?.headerStyle?.(params)
      : column?.headerStyle) || {};
  return { ...headerStyle, ...getWidth(column) };
};

const getHeaderClass = (column: ColumnDef) => {
  const params = {
    column,
    api: api.value,
    context: gridOptions.value?.context,
  };
  return {
    ...getCommonClass({ column, isHeader: true }),
    ...((isFunction(column?.headerClass)
      ? column?.headerClass?.(params)
      : column?.headerClass) || {}),
  };
};

const getHeaderValue = (column: ColumnDef) => {
  const params = {
    column,
    api: api.value,
    context: gridOptions.value?.context,
  };
  if (column.headerValueFormatter) return column.headerValueFormatter(params);
  return column.headerName;
};

const handleHeaderClick = (column: ColumnDef) => {
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

const toggleSelection = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  const selectionChangedEvent: HeaderSelectionChangedEvent = {
    type: 'selectionChanged',
    column: props.column,
    checked,
  };
  emits('selectionChanged', selectionChangedEvent);
};
const headerCellRef = ref();
</script>

<template>
  <div
    ref="headerCellRef"
    class="header-cell table-cell"
    :style="getHeaderStyle(column)"
    :class="getHeaderClass(column)"
    @click="handleHeaderClick(column)"
  >
    <template v-if="column.headerCheckboxSelection">
      <Checkbox
        :checked="api.isAllSelected()"
        @change="toggleSelection"
        :indeterminate="api.isIndeterminateSelected()"
      />
    </template>
    <div
      v-else
      class="label"
      :class="{ 'text-ellipsis': column?.ellipsis !== false }"
    >
      {{ getHeaderValue(column) }}
    </div>
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
@import '../../style/index.less';
</style>
