import { ref, watch, computed } from 'vue';
import { defu } from 'defu';
import { defaultGridOptions } from '../config/defaultConfig';
import type {
  ColumnDef,
  RowData,
  GridOptions,
  CellRendererComponents,
  TooltipRendererComponents,
} from '../typings';

export const useTableData = (props: {
  columnDefs: ColumnDef[];
  rowData: RowData[];
  gridOptions: GridOptions;
  cellRendererComponents: CellRendererComponents;
  tooltipRendererComponents: TooltipRendererComponents;
}) => {
  // 响应式数据
  const innerRowData = ref<RowData[]>([...props.rowData]);
  const innerColumnDefs = computed(() => props.columnDefs);

  // 计算固定列和滚动列
  const pinnedLeftColumnDefs = computed(() =>
    innerColumnDefs.value.filter((c) => c.pinned === 'left'),
  );
  const pinnedRightColumnDefs = computed(() =>
    innerColumnDefs.value.filter((c) => c.pinned === 'right'),
  );
  const notPinnedColumnDefs = computed(() =>
    innerColumnDefs.value.filter((c) => !c.pinned),
  );

  // 合并gridOptions
  const innerGridOptions = computed(() => {
    return defu(props.gridOptions, defaultGridOptions);
  });

  // 监听rowData变化
  watch(
    () => props.rowData,
    (newVal) => {
      innerRowData.value = [...newVal];
    },
    {
      immediate: true,
      deep: true,
    },
  );

  return {
    innerRowData,
    innerColumnDefs,
    pinnedLeftColumnDefs,
    pinnedRightColumnDefs,
    notPinnedColumnDefs,
    innerGridOptions,
  };
};
