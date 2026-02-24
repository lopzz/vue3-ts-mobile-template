// hooks/useTableStyle.ts
import { computed, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { isFunction, isString } from '../utils/utils';
import type { GridOptions } from '../typings';

export const useTableStyle = (
  innerGridOptions: ComputedRef<GridOptions>,
  api: Ref<any>,
  tableRef: Ref<HTMLElement | null>,
) => {
  // 监听 border 变化
  const borderStyle = computed(() => {
    const border = innerGridOptions.value.border;

    if (isFunction(border)) {
      const params = {
        api: api.value,
        context: innerGridOptions.value?.context,
      };
      return border(params);
    }

    return border;
  });

  // ✅ 修正：监听 tableRef.value 的变化
  watch(
    [borderStyle, () => tableRef.value], // 改为 .value
    ([newBorderStyle, newTableElement]) => {
      if (newBorderStyle && isString(newBorderStyle) && newTableElement) {
        applyBorderStyle(newTableElement, newBorderStyle);
      }
    },
    { immediate: true },
  );

  // 应用边框样式
  const applyBorderStyle = (element: HTMLElement, style: string) => {
    if (style) {
      element.style.setProperty('--border', style);
    }
  };

  // // 边框样式计算
  // const hasBorder = computed(() => {
  //   const border = innerGridOptions.value.border;
  //   if (isFunction(border)) {
  //     const params = {
  //       api: api.value,
  //       context: innerGridOptions.value?.context,
  //     };
  //     const element = document.querySelector(
  //       '.table.border-table',
  //     ) as HTMLElement;
  //     console.log(33333333, element);

  //     if (element) {
  //       element?.style.setProperty('--border', border(params));
  //     }
  //   }
  //   return !!border;
  // });

  const hasBorder = computed(() => !!borderStyle.value);
  const tableClasses = computed(() => ({
    table: true,
    'scroll-table': true,
    'border-table': !!borderStyle.value,
  }));

  return {
    hasBorder,
    tableClasses,
  };
};
