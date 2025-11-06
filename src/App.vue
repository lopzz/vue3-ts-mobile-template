<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';

const themeVars = {};

const themeVarsDark = {};

const themeVarsLight = {};
const active = ref(0);
</script>

<template>
  <!-- 开启顶部安全区适配 -->
  <van-config-provider
    :theme-vars="themeVars"
    :theme-vars-dark="themeVarsDark"
    :theme-vars-light="themeVarsLight"
  >
    <RouterView />
    <!-- 开启底部安全区适配 -->
    <!-- <van-number-keyboard safe-area-inset-bottom /> -->
    <van-tabbar v-model="active" fixed safe-area-inset-bottom border>
      <van-tabbar-item icon="home-o" replace to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" replace to="/todo">代办</van-tabbar-item>
      <van-tabbar-item icon="friends-o" replace to="/auditTools">
        审计工具
      </van-tabbar-item>
      <van-tabbar-item icon="setting-o" replace to="/auditResources">
        审计资源
      </van-tabbar-item>
    </van-tabbar>
  </van-config-provider>
</template>

<style lang="less">
.aa {
  width: 375px;
  height: 80vw;
  background-color: gray;

  .bb {
    width: 100px;
    background-color: orange;
  }
}
</style>
