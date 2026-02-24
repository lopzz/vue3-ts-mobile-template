import type { Ref } from 'vue';
import type {
  SelectionChangedEvent,
  HeaderSelectionChangedEvent,
  GridApi,
} from '../typings';

export const useSelection = (
  api: Ref<GridApi>,
  emit: (event: 'selectionChanged', payload: SelectionChangedEvent) => void,
) => {
  // 处理行选择变化
  const handleSelectionChanged = (
    selectionChangedEvent: SelectionChangedEvent,
  ) => {
    emit('selectionChanged', selectionChangedEvent);
  };

  // 处理表头全选/取消全选
  const handleHeaderSelectionChanged = (
    headerSelectionChangedEvent: HeaderSelectionChangedEvent,
  ) => {
    const { column, checked } = headerSelectionChangedEvent;
    if (!column.checkboxSelection) return;

    // 全选或取消全选
    if (checked) {
      api.value.selectAll();
    } else {
      api.value.deselectAll();
    }

    const selectionChangedEvent: SelectionChangedEvent = {
      type: 'selectionChanged',
      selectedNodes: api.value.getSelectedNodes(),
      selectedData: api.value.getSelectedRows(),
      selectionCount: api.value.getSelectedRows().length,
    };

    emit('selectionChanged', selectionChangedEvent);
  };

  return {
    handleSelectionChanged,
    handleHeaderSelectionChanged,
  };
};
