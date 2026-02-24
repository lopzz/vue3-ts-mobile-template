import { onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';
import type { RowData, ColumnDef, GridOptions } from '../typings';

export const useTooltip = (innerGridOptions: Ref<GridOptions>) => {
  const currentRow = ref<RowData>({});
  const currentColumn = ref<ColumnDef>({} as ColumnDef);
  const tooltipCellRef = ref<any>(null);

  let pressTimer: number | null = null;
  let touchStartX = 0;
  let touchStartY = 0;

  // 显示tooltip
  const showTooltip = (e: Event, row: RowData, column: ColumnDef) => {
    if (!tooltipCellRef.value) return;
    currentRow.value = row;
    currentColumn.value = column;
    tooltipCellRef.value.show({ event: e, row, column });
  };

  const setTimeoutShowTooltip = (
    e: Event,
    row: RowData,
    column: ColumnDef,
    tooltipShowDelay: number,
  ) => {
    pressTimer = setTimeout(() => {
      showTooltip(e, row, column);
    }, tooltipShowDelay); // 最小长按事件为200ms
  };

  // 触摸开始
  const handleLongPressStartTooltip = (
    e: TouchEvent,
    row: RowData,
    column: ColumnDef,
  ) => {
    if (
      !innerGridOptions.value.tooltipShow ||
      innerGridOptions.value.tooltipTriggerType !== 'longPress'
    ) {
      return;
    }
    if (!e.touches[0]) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    setTimeoutShowTooltip(
      e,
      row,
      column,
      innerGridOptions.value.tooltipShowDelay || 200,
    );
  };

  // 触摸移动
  const judgeIsScrolling = (e: TouchEvent) => {
    if (!e.touches[0]) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

    if (deltaX > 5 || deltaY > 5) {
      clearTimeout(pressTimer as number);
    }
  };

  // 触摸结束
  const handleLongPressStopTooltip = () => {
    if (
      !innerGridOptions.value.tooltipShow ||
      innerGridOptions.value.tooltipTriggerType !== 'longPress'
    ) {
      return;
    }
    clearTimeout(pressTimer as number);
  };

  // 点击单元格
  const handleClickTooltip = (e: Event, row: RowData, column: ColumnDef) => {
    if (
      !innerGridOptions.value.tooltipShow ||
      innerGridOptions.value.tooltipTriggerType !== 'click'
    ) {
      return;
    }
    setTimeoutShowTooltip(
      e,
      row,
      column,
      innerGridOptions.value.tooltipShowDelay || 0,
    );
  };

  onUnmounted(() => {
    clearTimeout(pressTimer as number);
  });

  return {
    currentRow,
    currentColumn,
    tooltipCellRef,
    showTooltip,
    handleLongPressStartTooltip,
    judgeIsScrolling,
    handleLongPressStopTooltip,
    handleClickTooltip,
  };
};
