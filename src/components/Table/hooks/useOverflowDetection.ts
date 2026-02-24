import { nextTick, ref } from 'vue';

export const useOverflowDetection = (
  colsRef: () => HTMLElement | undefined,
  headerRef?: () => HTMLElement | undefined,
) => {
  const hasVerticalOverflow = ref(false);

  const judgeOverflow = async () => {
    await nextTick();
    await nextTick(); // 确保DOM渲染完成

    const element = colsRef();
    if (!element) return;

    hasVerticalOverflow.value = element.scrollHeight > element.clientHeight;

    if (hasVerticalOverflow.value && headerRef?.()) {
      const headerCellElements = document.querySelectorAll('.header-cell');
      const lastHeaderCellElement = headerCellElements[
        headerCellElements.length - 1
      ] as HTMLElement;
      // 判断表格是否出现纵向滚动条，如果有则给表头最后一列加上滚动条宽度
      if (lastHeaderCellElement) {
        const currentWidth = getComputedStyle(lastHeaderCellElement).width;
        lastHeaderCellElement.style.width = `calc(${currentWidth} + 8px)`;
      }
    }
  };

  return {
    hasVerticalOverflow,
    judgeOverflow,
  };
};
