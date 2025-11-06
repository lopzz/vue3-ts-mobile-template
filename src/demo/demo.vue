<script setup lang="ts">
import type { CSSProperties } from 'vue';

import { computed, useSlots } from 'vue';

interface Props {
  /**
   * 横屏
   */
  fullWidth: boolean;
  /**
   * 高度
   */
  height: number;
  /**
   * 是否移动端
   */
  isMobile: boolean;
  /**
   * 是否显示
   */
  show: boolean;
  /**
   * 侧边菜单宽度
   */
  sidebarWidth: number;
}

defineOptions({ name: 'Demo' });
const props = withDefaults(defineProps<Props>(), {});
const emit = defineEmits<{
  change: [string];
}>();

const slots = useSlots();
const style = computed((): CSSProperties => {
  const { fullWidth, height, show } = props;
  const right = !show || !fullWidth ? undefined : 0;

  return {
    height: `${height}px`,
    marginTop: show ? 0 : `-${height}px`,
    right,
  };
});

const logoStyle = computed((): CSSProperties => {
  return {
    minWidth: `${props.isMobile ? 40 : props.sidebarWidth}px`,
  };
});

const defaultValue = '123';

const emitFn = (e: Event) => {
  emit('change', '12');
};
defineExpose({
  emitFn,
});
</script>

<template>
  <header
    :style="style"
    class="border-border bg-header top-0 flex w-full flex-[0_0_auto] items-center border-b pl-2 transition-[margin-top] duration-200"
  >
    <div v-if="slots.logo" :style="logoStyle">
      <slot name="logo"></slot>
    </div>

    <slot name="toggle-button"> </slot>

    <slot></slot>
    <div @click="emitFn">qwd</div>
  </header>
</template>

<style lang="less" scoped>
.aa {
  color: red;
  background-color: var(--input-placeholder);
}
</style>
