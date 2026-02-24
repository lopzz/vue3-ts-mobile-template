import { ref } from 'vue';

/**
 * 表格DOM元素管理器
 * 集中管理表格的所有DOM引用
 */
export const useDom = () => {
  // 表头相关DOM
  const headerRef = ref<HTMLElement>();
  const notPinnedHeaderRef = ref<HTMLElement>();

  // 表格主体相关DOM
  const colsRef = ref<HTMLElement>();
  const notPinnedColsRef = ref<HTMLElement>();
  const tableContentContainerRef = ref<HTMLElement>();

  return {
    // 主DOM引用
    headerRef,
    notPinnedHeaderRef,
    colsRef,
    notPinnedColsRef,
    tableContentContainerRef,
  };
};
