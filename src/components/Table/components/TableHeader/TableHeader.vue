<!-- components/TableHeader.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import HeaderCell from './HeaderCell.vue';
import type {
  ColumnDef,
  ColumnHeaderClickedEvent,
  HeaderSelectionChangedEvent,
} from '../../typings';

interface Props {
  columnDefs?: Array<ColumnDef>;
  pinnedLeftColumns?: Array<ColumnDef>;
  notPinnedColumns?: Array<ColumnDef>;
  pinnedRightColumns?: Array<ColumnDef>;
}

const props = withDefaults(defineProps<Props>(), {
  columnDefs: () => [],
  pinnedLeftColumns: () => [],
  notPinnedColumns: () => [],
  pinnedRightColumns: () => [],
});

const emits = defineEmits<{
  (e: 'columnHeaderClicked', event: ColumnHeaderClickedEvent): void;
  (e: 'selectionChanged', event: HeaderSelectionChangedEvent): void;
  (e: 'scrollHeaderBody', event: Event): void;
  (e: 'scrollNotPinned', event: Event): void;
}>();

// DOM引用 - 用于外部访问
const headerRef = ref<HTMLElement>();
const notPinnedHeaderRef = ref<HTMLElement>();

// 计算列类名
const getHeaderColumnClasses = (
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
const handleColumnHeaderClick = (event: ColumnHeaderClickedEvent) => {
  emits('columnHeaderClicked', event);
};

const handleHeaderSelection = (event: HeaderSelectionChangedEvent) => {
  emits('selectionChanged', event);
};

const handleHeaderScroll = (e: Event) => {
  emits('scrollHeaderBody', e);
};

const handleNotPinnedScroll = (e: Event) => {
  emits('scrollNotPinned', e);
};

// 暴露给父组件的ref
defineExpose({
  headerRef,
  notPinnedHeaderRef,
});
</script>

<template>
  <div
    ref="headerRef"
    class="table-header table-row"
    @scroll="handleHeaderScroll"
  >
    <!-- 左侧固定列 -->
    <div class="pinned-left-header-container" v-if="pinnedLeftColumns.length">
      <HeaderCell
        v-for="(column, index) in pinnedLeftColumns"
        :key="`header-left-${column.field || index}`"
        :class="getHeaderColumnClasses(index, 'left')"
        :column="column"
        @column-header-clicked="handleColumnHeaderClick"
        @selection-changed="handleHeaderSelection"
      />
    </div>

    <!-- 中间滚动列 -->
    <div
      ref="notPinnedHeaderRef"
      class="header-container"
      @scroll="handleNotPinnedScroll"
      v-if="notPinnedColumns.length"
    >
      <HeaderCell
        v-for="(column, index) in notPinnedColumns"
        :key="`header-center-${column.field || index}`"
        :class="getHeaderColumnClasses(index, 'center')"
        :column="column"
        @column-header-clicked="handleColumnHeaderClick"
        @selection-changed="handleHeaderSelection"
      />
    </div>

    <!-- 右侧固定列 -->
    <div class="pinned-right-header-container" v-if="pinnedRightColumns.length">
      <HeaderCell
        v-for="(column, index) in pinnedRightColumns"
        :key="`header-right-${column.field || index}`"
        :class="getHeaderColumnClasses(index, 'right')"
        :column="column"
        @column-header-clicked="handleColumnHeaderClick"
        @selection-changed="handleHeaderSelection"
      />
    </div>
  </div>
</template>
<style lang="less" scoped>
@import '../../style/index.less';
</style>
