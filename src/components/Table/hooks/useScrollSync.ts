export interface ScrollSyncConfig {
  headerRef: () => HTMLElement | undefined;
  notPinnedHeaderRef: () => HTMLElement | undefined;
  colsRef: () => HTMLElement | undefined;
  notPinnedColsRef: () => HTMLElement | undefined;
}

export const useScrollSync = (config: ScrollSyncConfig) => {
  // 同步表头和表格主体的滚动
  const syncHeaderBodyScroll = (type: 'header' | 'content', e: Event) => {
    const source = e.target as HTMLElement;
    const scrollLeft = source.scrollLeft;

    if (type === 'header') {
      const target = config.colsRef();
      if (target) target.scrollLeft = scrollLeft;
    } else if (type === 'content') {
      const target = config.headerRef();
      if (target) target.scrollLeft = scrollLeft;
    }
  };

  // 同步非固定列的滚动
  const syncNotPinnedScroll = (type: 'header' | 'content', e: Event) => {
    const source = e.target as HTMLElement;
    const scrollLeft = source.scrollLeft;

    if (type === 'header') {
      const target = config.notPinnedColsRef();
      if (target) target.scrollLeft = scrollLeft;
    } else if (type === 'content') {
      const target = config.notPinnedHeaderRef();
      if (target) target.scrollLeft = scrollLeft;
    }
  };

  return {
    syncHeaderBodyScroll,
    syncNotPinnedScroll,
  };
};
