// composables/useSort.ts
import { isNumber, isNull, isUnDef } from '../utils/utils';
import type {
  ColumnDef,
  RowData,
  SortChangedEvent,
  SortOrder,
  GridApi,
  Context,
  RowNode,
} from '../typings';

// 类型定义
export interface SortState {
  sortedData: RowData[];
  updatedColumns: ColumnDef[];
}

export interface SortParams {
  data: RowData[];
  columns: ColumnDef[];
  columnToSort: ColumnDef;
  api: GridApi;
  context?: Context;
  originalRowData?: RowData[];
}

// 纯函数：获取单元格值
export const getCellValue = (
  row: RowData,
  column: ColumnDef,
  api: GridApi,
  context?: Context,
): number | string => {
  if (!api) return row[column.field];

  const params = {
    row,
    column,
    value: row[column.field],
    node: api.getRowNode(row._id) as RowNode,
    api,
    context,
  };

  return column.valueGetter ? column.valueGetter(params) : row[column.field];
};

// 纯函数：创建比较器
export const createComparator = (
  column: ColumnDef,
  sortOrder: SortOrder,
  api: GridApi,
  context?: Context,
): ((rowA: RowData, rowB: RowData) => number) => {
  // 使用自定义比较器
  if (
    !isNull(column.comparator) &&
    !isUnDef(column.comparator) &&
    sortOrder !== ''
  ) {
    return (rowA: RowData, rowB: RowData) => {
      const valueA = getCellValue(rowA, column, api, context);
      const valueB = getCellValue(rowB, column, api, context);
      return column.comparator({
        valueA,
        valueB,
        rowA,
        rowB,
        column,
      });
    };
  }

  // 默认比较器
  return (rowA: RowData, rowB: RowData) => {
    const valueA = getCellValue(rowA, column, api, context);
    const valueB = getCellValue(rowB, column, api, context);

    // 数字比较
    if (isNumber(valueA) && isNumber(valueB)) {
      return sortOrder === 'asc'
        ? Number(valueA) - Number(valueB)
        : Number(valueB) - Number(valueA);
    }

    // 字符串比较
    return sortOrder === 'asc'
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  };
};

// 纯函数：获取下一个排序状态
export const getNextSortOrder = (currentOrder: SortOrder = ''): SortOrder => {
  const orderCycle: Record<SortOrder, SortOrder> = {
    '': 'asc',
    asc: 'desc',
    desc: '',
  };
  return orderCycle[currentOrder];
};

// 纯函数：更新列排序状态
export const updateColumnSortState = (
  columns: ColumnDef[],
  sortedColumn: ColumnDef,
  newSortOrder: SortOrder,
) => {
  columns.forEach((column) => {
    if (column.field === sortedColumn.field) {
      column.sortOrder = newSortOrder;
    } else {
      // 其他列重置排序状态
      if (column.sortOrder !== '') {
        column.sortOrder = '';
      }
    }
  });
};

// 纯函数：排序数据
export const sortData = (
  data: RowData[],
  column: ColumnDef,
  sortOrder: SortOrder,
  api: GridApi,
  context?: Context,
): RowData[] => {
  // 如果没有排序方向或服务端排序，返回原数据
  if (sortOrder === '' || isNull(column.comparator)) {
    return [...data];
  }

  // 创建排序后的数据副本
  const comparator = createComparator(column, sortOrder, api, context);

  return [...data].sort(comparator);
};

// 主排序函数：纯函数，不修改输入参数
export const performSort = (params: SortParams): SortState => {
  const { data, columns, columnToSort, api, context } = params;

  // 计算新的排序状态
  const newSortOrder = getNextSortOrder(columnToSort.sortOrder);

  // 更新列状态
  updateColumnSortState(columns, columnToSort, newSortOrder);

  // 排序数据（不修改原数组）
  const sortedData = sortData(data, columnToSort, newSortOrder, api, context);

  return {
    sortedData,
    updatedColumns: columns,
  };
};

// 纯函数：创建排序事件
export const createSortEvent = (
  column: ColumnDef,
  sortOrder: SortOrder,
  originData: RowData[],
  sortedData: RowData[],
  lastData: RowData[],
  context?: Context,
): SortChangedEvent => {
  return {
    originData,
    lastData,
    data: sortedData,
    column: { ...column, sortOrder },
    sortOrder,
    type: 'sortChanged',
    context,
  };
};

// Vue Composables（副作用封装）
export const useSort = () => {
  // 这个函数只负责副作用（emit事件），不包含排序逻辑
  const emitSortEvent = (
    emit: (event: 'sortChanged', payload: SortChangedEvent) => void,
    event: SortChangedEvent,
  ) => {
    emit('sortChanged', event);
  };

  return {
    emitSortEvent,
  };
};
