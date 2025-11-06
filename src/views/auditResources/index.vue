<script setup lang="ts">
import Content from './components/Content.vue';

defineOptions({ name: 'Home' });
</script>

<template>
  <van-nav-bar title="审计管理移动应用" safe-area-inset-top />
  <Content :collapse="true" :scroll-to-active="false" />
</template>

<style lang="less" scoped>
.aa {
  color: red;
  background: blue;

  &:hover {
    color: blue;
  }

  &:active {
    color: green;
  }

  :deep(.aa) {
    color: yellow;
  }
}
</style>
