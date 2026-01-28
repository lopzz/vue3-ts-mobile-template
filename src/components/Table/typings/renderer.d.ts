import { DefineComponent } from 'vue';

// cellRenderer、 tooltipRenderer
interface RendererComponents {
  [key: string]: DefineComponent;
}

type CellRendererComponents = RendererComponents;
type TooltipRendererComponents = RendererComponents;

interface RendererSelectorResult {
  component: ComponentName;
  params?: any; // 自定义传进组件的参数
}
type CellRendererSelectorResult = RendererSelectorResult;
type TooltipRendererSelectorResult = RendererSelectorResult;

export type {
  RendererComponents,
  CellRendererComponents,
  TooltipRendererComponents,
  RendererSelectorResult,
  CellRendererSelectorResult,
  TooltipRendererSelectorResult,
};
