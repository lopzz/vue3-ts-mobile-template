<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

const props = defineProps({
  estimatedHeight: {
    type: Number,
    default: 50,
  },
  overscan: {
    type: Number,
    default: 5,
  },
});

const data = ref(
  Array.from({ length: 10000 }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    value: `Value ${index + 1}`,
    description: '动态高度内容'.repeat(Math.floor(Math.random() * 5) + 1),
    details: index % 3 === 0 ? '额外详细信息' : null,
  })),
);

const containerRef = ref(null);
const scrollTop = ref(0);
const containerHeight = ref(0);
const isScrolling = ref(false);

// 高度缓存
const heightCache = ref(new Map());
// 位置缓存
const positionCache = ref([0]);
// 行元素引用
const rowElements = ref(new Map());
// ResizeObserver实例
let resizeObserver = null;
// 滚动节流定时器
let scrollTimer = null;

// 计算总高度
const totalHeight = computed(() => {
  if (positionCache.value.length === 0) {
    return data.value.length * props.estimatedHeight;
  }
  return positionCache.value[data.value.length] || 0;
});

// 查找起始索引
const findStartIndex = () => {
  const positions = positionCache.value;
  if (positions.length === 0) {
    return Math.floor(scrollTop.value / props.estimatedHeight);
  }

  let left = 0;
  let right = positions.length - 1;
  const target = scrollTop.value;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (
      positions[mid] <= target &&
      (mid === positions.length - 1 || positions[mid + 1] > target)
    ) {
      return Math.max(0, mid - props.overscan);
    } else if (positions[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return Math.max(
    0,
    Math.floor(scrollTop.value / props.estimatedHeight) - props.overscan,
  );
};

// 查找结束索引
const findEndIndex = () => {
  const positions = positionCache.value;
  const startIdx = startIndex.value;

  if (positions.length === 0 || startIdx >= positions.length - 1) {
    return Math.min(
      data.value.length,
      startIdx + Math.ceil(containerHeight.value / props.estimatedHeight),
    );
  }

  // const startPos = positions[startIdx];
  const visibleBottom = scrollTop.value + containerHeight.value;
  let idx = startIdx;

  while (idx < positions.length && positions[idx] < visibleBottom) {
    idx++;
  }

  return Math.min(data.value.length, idx + props.overscan);
};

const startIndex = computed(findStartIndex);
const endIndex = computed(findEndIndex);

// 可视区域数据
const visibleData = computed(() => {
  return data.value.slice(startIndex.value, endIndex.value);
});

// transform偏移
const translateY = computed(() => {
  if (
    positionCache.value.length === 0 ||
    startIndex.value >= positionCache.value.length
  ) {
    return startIndex.value * props.estimatedHeight;
  }
  return positionCache.value[startIndex.value] || 0;
});

// 防抖滚动处理
const handleScrollDebounced = () => {
  isScrolling.value = true;

  if (scrollTimer) clearTimeout(scrollTimer);

  // 立即更新scrollTop用于快速响应
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }

  // 滚动结束后重置状态
  scrollTimer = setTimeout(() => {
    isScrolling.value = false;
  }, 100);
};

// 更新容器高度
const updateContainerHeight = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight;
  }
};

// 初始化高度缓存
const initializeCache = () => {
  heightCache.value.clear();
  const positions = [0];

  for (let i = 0; i < data.value.length; i++) {
    positions[i + 1] = positions[i] + props.estimatedHeight;
  }

  positionCache.value = positions;
};

// 测量单个元素高度
const measureRowHeight = (element, id) => {
  if (!element) return props.estimatedHeight;

  const rect = element.getBoundingClientRect();
  const height = rect.height;
  const cachedHeight = heightCache.value.get(id) || props.estimatedHeight;

  // 如果高度变化超过1px，才更新缓存
  if (Math.abs(height - cachedHeight) > 1) {
    heightCache.value.set(id, height);
    updatePositionsCache(id, height);
  }

  return height;
};

// 更新位置缓存
const updatePositionsCache = (changedId, newHeight) => {
  const positions = [...positionCache.value];
  const cachedHeight =
    heightCache.value.get(changedId) || props.estimatedHeight;
  const deltaHeight = newHeight - cachedHeight;

  if (deltaHeight !== 0) {
    for (let i = changedId; i <= data.value.length; i++) {
      positions[i] += deltaHeight;
    }
    positionCache.value = positions;
  }
};

// 设置DOM引用
const setRowRef = (element, id) => {
  if (!element || rowElements.value.has(id)) return;

  // 存储元素引用
  rowElements.value.set(id, element);

  // 初始测量高度
  const height = measureRowHeight(element, id);
  heightCache.value.set(id, height);

  // 如果ResizeObserver已初始化，开始观察这个元素
  if (resizeObserver) {
    resizeObserver.observe(element);
  }
};

// 清理不再可见的行元素的观察
const cleanupUnusedRows = () => {
  const visibleIds = new Set(visibleData.value.map((item) => item.id));

  // 清理不再可见的行
  for (const [id, element] of rowElements.value.entries()) {
    if (!visibleIds.has(id) && resizeObserver) {
      resizeObserver.unobserve(element);
      rowElements.value.delete(id);
    }
  }
};

// 监听元素尺寸变化
const setupResizeObserver = () => {
  if (!window.ResizeObserver) return;

  let rafId = null;
  const pendingUpdates = new Map();

  resizeObserver = new ResizeObserver((entries) => {
    // 收集所有需要更新的元素
    entries.forEach((entry) => {
      const element = entry.target;
      const id = parseInt(element.dataset.index);

      if (id && !isNaN(id)) {
        pendingUpdates.set(id, { element, id });
      }
    });

    // 使用requestAnimationFrame批量处理
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        rafId = null;

        // 按id排序
        const updates = Array.from(pendingUpdates.values()).sort(
          (a, b) => a.id - b.id,
        );

        pendingUpdates.clear();

        // 顺序执行测量
        updates.forEach(({ element, id }) => {
          measureRowHeight(element, id);
        });
      });
    }
  });
};

// 初始测量可见行
const initialMeasure = async () => {
  await nextTick();

  const rows = containerRef.value?.querySelectorAll('.virtual-row');
  if (rows) {
    const measurements = [];

    rows.forEach((row) => {
      const id = parseInt(row.dataset.index);
      if (id && !isNaN(id)) {
        measurements.push({ element: row, id });
      }
    });

    // 按id排序后测量
    measurements.sort((a, b) => a.id - b.id);
    measurements.forEach(({ element, id }) => {
      measureRowHeight(element, id);
    });
  }
};

onMounted(async () => {
  updateContainerHeight();
  window.addEventListener('resize', updateContainerHeight);

  initializeCache();
  setupResizeObserver();

  // 初始测量
  await initialMeasure();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight);
  if (scrollTimer) clearTimeout(scrollTimer);
  if (resizeObserver) {
    // 停止所有观察
    resizeObserver.disconnect();
  }
  rowElements.value.clear();
});

// 监听可见数据变化，清理不再需要的观察
watch(
  visibleData,
  () => {
    cleanupUnusedRows();
  },
  { flush: 'post' },
);
</script>

<template>
  <div
    class="virtual-table-container"
    ref="containerRef"
    @scroll="handleScrollDebounced"
  >
    <div class="virtual-content" :style="{ height: `${totalHeight}px` }">
      <div
        class="visible-content"
        :style="{
          transform: `translateY(${translateY}px)`,
          willChange: 'transform',
        }"
      >
        <div
          v-for="item in visibleData"
          :key="item.id"
          class="virtual-row"
          :ref="(el) => setRowRef(el, item.id)"
          :data-index="item.id"
        >
          <div class="row-content">
            <div class="title">{{ item.name }} - {{ item.value }}</div>
            <div v-if="item.description" class="description">
              {{ item.description }}
            </div>
            <div v-if="item.details" class="details">
              {{ item.details }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-table-container {
  position: relative;
  height: 300px;
  margin-top: 100px;
  overflow-y: auto;
  border: 1px solid #ddd;
  -webkit-overflow-scrolling: touch;
}

.virtual-content {
  position: relative;
  width: 100%;
}

.visible-content {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
  -webkit-font-smoothing: subpixel-antialiased;
}

.virtual-row {
  box-sizing: border-box;
  width: 100%;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid #eee;
}

.row-content {
  width: 100%;
  padding: 12px 16px;
}

.title {
  margin-bottom: 4px;
  font-weight: bold;
}

.description {
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

.details {
  padding: 4px;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #888;
  background: #f5f5f5;
  border-radius: 3px;
}
</style>
