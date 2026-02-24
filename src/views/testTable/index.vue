<script setup lang="ts">
import { ref } from 'vue';
// import Table from '@/components/Table copy/index.vue';
import Table from '@/components/Table/index.vue';
import TestCellRenderer from './components/TestCellRenderer.vue';
import TestTooltipRenderer from './components/TestTooltipRenderer.vue';
import type {
  ColumnDef,
  GridOptions,
  SelectionChangedEvent,
} from '@/components/Table/typings';

defineOptions({
  name: 'Home',
  components: {
    Table,
    TestCellRenderer,
    TestTooltipRenderer,
  },
});

const data = [
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
];
const rowData = ref(
  Array.from({ length: 2 }, () => [
    ...data.map((item) => ({ ...item })),
  ]).flat(),
);
const columnDefs = ref<ColumnDef[]>([
  {
    headerName: '',
    field: 'ag-Grid-AutoColumn',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    width: 35,
    align: 'left',
    pinned: 'left',
  },
  {
    field: '',
    headerName: '序号',
    width: '50px',
    valueGetter: (params) => {
      return params.node.rowIndex;
    },
    pinned: 'left',
  },
  {
    field: 'a',
    headerName: '第一列',
    width: '100px',
    sortable: true,
    comparator: ({ valueA, valueB, column }) => {
      const numValueA = Number(valueA);
      const numValueB = Number(valueB);
      return column.sortOrder === 'asc'
        ? numValueA - numValueB
        : numValueB - numValueA;
    },
    cellStyle: (params) => {
      // console.warn(111, params);
      // params.api.forEachRow((row) => {
      //   console.warn('row', row);
      // });
      // params.node.rowIndex % 2 === 0 && params.api.selectNode(params.node);
      return {
        backgroundColor: params.value % 2 === 0 ? 'red' : 'blue',
      };
    },
  },
  {
    field: 'b',
    headerName: '第二列',
    width: '100px',
    ellipsis: false,
    // cellRenderer: 'TestCellRenderer',
  },
  {
    field: 'c',
    width: '100px',
    headerName: '第三列',
    tooltipRendererSelector: () => {
      return {
        component: 'TestTooltipRenderer',
        params: { rateValue: 4 }, // 自定义传入组件的参数
      };
    },
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
    // pinned: 'right',
  },
  {
    field: 'i',
    headerName: '第9列',
    width: '100px',
  },
]);

const gridOptions = ref<GridOptions>({
  tooltipShow: true,
  rowSelection: {
    mode: 'multiple',
    // enableClickSelection: true,
  },
  // rowHeight: (params) => {
  //   // console.warn('rowHeight params', params);
  //   return params.node.rowIndex % 2 === 0 ? 60 : 40;
  // },
  // border: true,
  // border: (params) => {
  //   // console.warn(55555555, params);
  //   return '2px solid purple';
  // },
  context: {
    ccc: 3,
  },
});

const selectionChanged = (selectionChanegedEvent: SelectionChangedEvent) => {
  console.warn(3333, selectionChanegedEvent);
};

const changeColumn = () => {
  columnDefs.value[2]!.cellStyle = (params) => {
    return {
      backgroundColor: params.value % 2 === 0 ? 'yellow' : 'green',
    };
  };
};

const changeRowData = () => {
  const data = {
    a: 4,
    b: 5,
    c: 6,
    d: 3,
    e: 3,
    f: 4,
    g: 5,
    h: 4,
    i: 5,
  };
  rowData.value.push(data);
};
</script>

<template>
  <div class="test-table">
    <van-button @click="changeColumn">改变列定义</van-button>
    <van-button @click="changeRowData">改变数据</van-button>
    <Table
      :row-data="rowData"
      :column-defs="columnDefs"
      :grid-options="gridOptions"
      @selection-changed="selectionChanged"
    />
  </div>
</template>

<style lang="less" scoped>
.test-table {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table {
  // todo 最底下边框重叠问题

  flex: 1;
  min-height: 0;
  max-height: 500px;
  margin: 10px;
}
</style>
