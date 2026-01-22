import { createPopper } from '@popperjs/core';
import type { Instance } from '@popperjs/core';

type Options = {
  tooltipElement: HTMLElement; // tooltip元素
  contentElement?: HTMLElement;
};

class Tooltip {
  popperInstance!: Instance; // popper实例
  targetElement: HTMLElement | null = null; // 需要产生tooltip的元素
  tooltipElement!: HTMLElement; // tooltip元素
  contentElement: HTMLElement | null = null; // 边界元素，toolip不会超出这个元素
  generateGetBoundingClientRect(x = -999, y = -999): () => DOMRect {
    return () => ({
      width: 0,
      height: 0,
      top: y,
      right: x,
      bottom: y,
      left: x,
      x,
      y,
      toJSON: () => null,
    });
  }
  constructor(options: Options) {
    const { tooltipElement, contentElement = document.body } = options || {};
    if (!tooltipElement) {
      console.error('Tooltip element 必须传入');
      return;
    }
    this.tooltipElement = tooltipElement;
    this.contentElement = contentElement;
    this.init();
  }
  init() {
    const defaultTargetElement = {
      getBoundingClientRect: this.generateGetBoundingClientRect(),
    };
    this.popperInstance = createPopper(
      defaultTargetElement,
      this.tooltipElement,
      {
        placement: 'bottom',
        modifiers: [
          {
            name: 'flip',
            options: {
              boundary: this.contentElement,
              allowedAutoPlacements: ['top', 'bottom'],
            },
          },
          {
            name: 'offset',
            options: {
              offset: [0, -2],
            },
          },
          {
            name: 'eventListeners',
            enabled: false,
          },
        ],
      },
    );
    document.body.addEventListener('touchstart', (e) => {
      if (this.tooltipElement.contains(e.target as Node)) return;
      this.hide();
    });
  }
  show(targetElement: HTMLElement) {
    if (this.targetElement === targetElement) return;
    this.targetElement = targetElement;

    this.popperInstance.state.elements.reference = targetElement;
    this.popperInstance.forceUpdate();
    this.tooltipElement.setAttribute('data-show', '');
  }
  hide() {
    this.tooltipElement.removeAttribute('data-show');
    this.targetElement = null;
  }
}

export { Tooltip };
