<script setup lang="ts">
import { ref } from 'vue';
import Content from './components/Content.vue';
import Table from '@/components/Table/index.vue';
import type { ColumnDef } from '@/components/table/config/types.d.ts';

defineOptions({ name: 'Home' });

const rowData = ref([
  {
    a: 1,
    b: 2,
    c: 3,
    d: 3,
    e: 3,
    f: 4,
    g: 5,
    h: 4,
    i: 5,
  },
  {
    a: 4,
    b: 5,
    c: 6,
    d: 3,
    e: 3,
    f: 4,
    g: 5,
    h: 4,
    i: 5,
  },
]);
const columnDefs = ref<ColumnDef[]>([
  {
    field: 'a',
    headerName: '第一列',
    width: '100px',
    sortable: true,
    comparator: ({ valueA, valueB, column }) => {
      return column.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    },
    pinned: 'left',
  },
  {
    field: 'b',
    headerName: '第二列',
    pinned: 'left',
    width: '100px',
  },
  {
    field: 'c',
    width: '100px',
    headerName: '第三列',
  },
  {
    field: 'd',
    headerName: '第四列',
    width: '100px',
  },
  {
    field: 'e',
    width: '100px',
    headerName: '第五列',
  },
  {
    field: 'f',
    width: '100px',
    headerName: '第6列',
  },
  {
    field: 'g',
    headerName: '第7列',
    width: '100px',
  },
  {
    field: 'h',
    headerName: '第8列',
    width: '100px',
  },
  {
    field: 'i',
    headerName: '第9列',
    width: '100px',
    pinned: 'right',
  },
]);

const gridOptions = ref({
  tooltipShow: false,
});
</script>

<template>
  <van-nav-bar title="审计管理移动应用" safe-area-inset-top />
  sd
  <Table
    :row-data="rowData"
    :column-defs="columnDefs"
    :grid-options="gridOptions"
  />
  <Content :collapse="true" :scroll-to-active="false" />
</template>

<style lang="less" scoped>
.aa {
  color: red;
  background: blue;

  &:hover {
    color: blue;
  }

  &:active {
    color: green;
  }

  :deep(.aa) {
    color: yellow;
  }
}
</style>
