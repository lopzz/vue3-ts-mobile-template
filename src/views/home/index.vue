<script setup lang="ts">
import Content from './components/Content.vue';

defineOptions({
  name: 'Home',
  components: {
    Content,
  },
});
</script>

<template>
  <div class="home">
    <van-nav-bar title="审计管理移动应用" safe-area-inset-top />

    <Content :collapse="true" :scroll-to-active="false" />
  </div>
</template>

<style lang="less" scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table {
  flex: 1;
  min-height: 0;
  max-height: 500px;
  margin: 10px;
}

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
