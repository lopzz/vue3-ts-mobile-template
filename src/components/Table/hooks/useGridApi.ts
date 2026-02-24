import { ref, provide, nextTick, watch } from 'vue';
import type { Ref } from 'vue';
import { RowManager } from '../manager/RowManager';
import { GridApi } from '../manager/GridApi';
import type { RowData, GridOptions } from '../typings';

export const useGridApi = (
  props: { rowData: RowData[]; gridOptions: GridOptions },
  emit: (event: 'gridReady', payload: { api: GridApi; columnApi: any }) => void,
  innerGridOptions: Ref<GridOptions>,
) => {
  const gridReady = ref(false);
  const api = ref<GridApi>({} as GridApi);

  // 初始化API
  const initializeApi = () => {
    // onBeforeMount(() => {
    // 创建行管理器，建立node和data的映射关系
    const rowManager = new RowManager(
      innerGridOptions.value.getRowId,
      innerGridOptions.value.rowSelection,
    );

    // 创建API
    const gridApi = new GridApi(rowManager);
    api.value = gridApi;

    emit('gridReady', { api: gridApi, columnApi: null });
    api.value.setData([...props.rowData]);

    nextTick(() => {
      gridReady.value = true;
    });
    // });
  };

  // 监听rowData变化
  watch(
    () => props.rowData,
    (newVal) => {
      api.value?.setData([...newVal]);
    },
    {
      deep: true,
    },
  );

  // 提供API给子组件
  provide<Ref<GridApi>>('api', api as Ref<GridApi>);

  return {
    api,
    gridReady,
    initializeApi,
  };
};
