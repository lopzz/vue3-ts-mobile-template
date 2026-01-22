<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<script lang="ts" setup>
import { inject, watch, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';

import type {
  ColumnDef,
  RowDataItem,
  GridOptions,
  CusTomGridParams,
  TooltipRendererComponents,
} from '../../config/types';
import { isFunction } from '../../config/utils';
import { Tooltip } from './tooltip.ts';

const props = withDefaults(
  defineProps<{
    row: RowDataItem;
    column: ColumnDef;
    contentElementRef: ComponentPublicInstance;
  }>(),
  {
    row: () => ({}) as RowDataItem,
    column: () => ({}) as ColumnDef,
    contentElementRef: () => null as unknown as ComponentPublicInstance,
  },
);

const gridOptions: GridOptions = inject('gridOptions') as GridOptions;
const tooltipRendererComponents: TooltipRendererComponents = inject(
  'tooltipRendererComponents',
) as TooltipRendererComponents;

const getTooltipValue = (row: RowDataItem, column: ColumnDef) => {
  let value = row[column.tooltipField || column.field];
  const params = { row, column, value, context: gridOptions.context };
  if (column.valueGetter) {
    value = column.valueGetter(params);
    params.value = column.valueGetter(params);
  }
  if (column.valueFormatter) return column.valueFormatter(params);
  return value;
};

const getTooltipRenderer = (row: RowDataItem, column: ColumnDef) => {
  const value = row[column.tooltipField || column.field];
  const params = { row, column, value, context: gridOptions?.context };
  let rendererType = '';
  if (column?.tooltipRendererSelector) {
    rendererType = 'component';
    return {
      rendererType,
      hasComponent: isFunction(column?.tooltipRendererSelector)
        ? !!column?.tooltipRendererSelector?.(params)
        : !!column?.tooltipRendererSelector,
    };
  }
  if (column?.tooltipRenderer) {
    if (isFunction(column?.tooltipRenderer)) {
      rendererType = 'html';
    } else {
      rendererType = 'component';
    }
  }
  return {
    rendererType,
    hasComponent: isFunction(column?.tooltipRenderer)
      ? !!column?.tooltipRenderer?.(params)
      : !!column?.tooltipRenderer,
  };
};
const getTooltipRendererComponent = (row: RowDataItem, column: ColumnDef) => {
  const value = row[column.tooltipField || column.field];
  const params = { row, column, value, context: gridOptions?.context };
  let componentName: string | undefined = '';
  if (column?.tooltipRendererSelector) {
    componentName = column.tooltipRendererSelector(params)?.component;
    return componentName
      ? tooltipRendererComponents?.[componentName]
      : undefined;
  }
  if (isFunction(column?.tooltipRenderer)) {
    const htmlStr = column?.tooltipRenderer?.(params);
    return htmlStr;
  }
  componentName = column?.tooltipRenderer;
  return componentName ? tooltipRendererComponents?.[componentName] : undefined;
};

const getTooltipRendererParams = (
  row: RowDataItem,
  column: ColumnDef,
): CusTomGridParams => {
  const value = row[column.tooltipField || column.field];
  const params = { row, column, value, context: gridOptions?.context };
  let cellRendererParams = {};
  if (column?.tooltipRendererSelector) {
    cellRendererParams = column.tooltipRendererSelector(params)?.params;
  }
  return { ...params, ...cellRendererParams };
};

let tooltipInstance: Tooltip | null = null;
const tooltipCellRef = ref();
watch(
  [() => props.contentElementRef, () => tooltipCellRef.value],
  ([newContentElementRef, newTooltipCellRef]) => {
    if (newContentElementRef && newTooltipCellRef) {
      tooltipInstance = new Tooltip({
        contentElement: newContentElementRef.$el,
        tooltipElement: newTooltipCellRef,
      });
    }
  },
);

const show = ({ event }: { event: Event }) => {
  tooltipInstance?.show(event.target as HTMLElement);
};

defineExpose({
  show,
});
</script>

<template>
  <div ref="tooltipCellRef" class="custom-tooltip">
    <div class="custom-tooltip-content">
      <div class="custom-tooltip-inner">
        <template v-if="getTooltipRenderer(row, column).hasComponent">
          <component
            :is="getTooltipRendererComponent(row, column)"
            v-if="getTooltipRenderer(row, column).rendererType === 'component'"
            :params="getTooltipRendererParams(row, column)"
          />
          <span v-else v-html="getTooltipRendererComponent(row, column)"></span>
        </template>
        <span v-else>
          {{ getTooltipValue(row, column) }}
        </span>
      </div>
      <div class="custom-tooltip-arrow"></div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '../../style/variables.less';

.custom-tooltip {
  position: absolute;
  z-index: 999;
  visibility: hidden;
  width: max-content;

  &[data-show] {
    visibility: visible;
  }

  .custom-tooltip-inner {
    width: 96px;
    height: 60px;
    background: @tooltip-bg-color;
    border-radius: 4px;
  }

  &-arrow {
    position: absolute;
    left: 50%;
    border-color: transparent;
    border-style: solid;
    border-width: 6px;
    transform: translateX(-50%);

    &.arrow-top {
      border-top-color: @tooltip-bg-color;
    }
  }
}

.custom-tooltip[data-popper-placement^='top'] {
  padding-bottom: 12px;

  .custom-tooltip-arrow {
    bottom: 0;
    border-top-color: @tooltip-bg-color;
  }
}

.custom-tooltip[data-popper-placement^='bottom'] {
  padding-top: 12px;

  .custom-tooltip-arrow {
    top: 0;
    border-bottom-color: @tooltip-bg-color;
  }
}

.custom-tooltip[data-popper-placement^='left'] {
  padding-right: 12px;

  .custom-tooltip-arrow {
    right: 0;
    border-left-color: @tooltip-bg-color;
  }
}

.custom-tooltip[data-popper-placement^='right'] {
  padding-left: 12px;

  .custom-tooltip-arrow {
    left: 0;
    border-right-color: @tooltip-bg-color;
  }
}
</style>
