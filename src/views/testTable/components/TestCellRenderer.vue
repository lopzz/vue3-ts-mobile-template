<script setup lang="ts">
import { ref } from 'vue';

const checked = ref('1');
</script>

<template>
  <div>
    <van-radio-group v-model="checked">
      <van-radio name="1">单选框 1</van-radio>
      <van-radio name="2">单选框 2</van-radio>
    </van-radio-group>
  </div>
</template>

<style lang="less" scoped></style>
