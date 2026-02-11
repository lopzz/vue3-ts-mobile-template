<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  itemHeight: {
    type: Number,
    default: 50,
  },
  overscan: {
    type: Number,
    default: 5,
  },
});

const data = ref(
  Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    value: `Value ${index + 1}`,
  })),
);
const containerRef = ref(null);
const scrollTop = ref(0);
const containerHeight = ref(0);

// 计算总高度
const totalHeight = computed(() => {
  return data.value.length * props.itemHeight;
});

// 计算可视区域能显示的行数
const visibleCount = computed(() => {
  return (
    Math.ceil(containerHeight.value / props.itemHeight) + props.overscan * 2
  );
});

// 计算起始索引
const startIndex = computed(() => {
  return Math.max(
    0,
    Math.floor(scrollTop.value / props.itemHeight) - props.overscan,
  );
});

// 计算结束索引
const endIndex = computed(() => {
  return Math.min(data.value.length, startIndex.value + visibleCount.value);
});

// 获取可视区域的数据
const visibleData = computed(() => {
  return data.value.slice(startIndex.value, endIndex.value);
});

// 计算transform偏移量
const translateY = computed(() => {
  return startIndex.value * props.itemHeight;
});

// 滚动事件处理
const handleScroll = (e) => {
  scrollTop.value = e.target.scrollTop;
};

// 获取容器高度
const updateContainerHeight = () => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight;
  }
};

onMounted(() => {
  updateContainerHeight();
  window.addEventListener('resize', updateContainerHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight);
});
</script>

<template>
  <div
    class="virtual-table-container"
    ref="containerRef"
    @scroll="handleScroll"
  >
    <!-- 虚拟容器，只有高度 -->
    <div class="virtual-content" :style="{ height: `${totalHeight}px` }">
      <!-- 通过transform偏移的内容块 -->
      <div
        class="visible-content"
        :style="{
          transform: `translateY(${translateY}px)`,
          willChange: 'transform',
        }"
      >
        <!-- 直接渲染数据行 -->
        <div
          v-for="item in visibleData"
          :key="item.id"
          class="virtual-row"
          :style="{ height: `${itemHeight}px` }"
        >
          <div class="row-content">{{ item.name }} - {{ item.value }}</div>
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
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.virtual-row:last-child {
  border-bottom: none;
}

.row-content {
  width: 100%;
  padding: 12px 16px;
}
</style>
