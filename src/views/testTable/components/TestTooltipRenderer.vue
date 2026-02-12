<script setup lang="ts">
import type { CusTomGridParams } from '@/components/Table/typings';

withDefaults(
  defineProps<{
    params: CusTomGridParams;
  }>(),
  {
    params: () => ({}) as CusTomGridParams,
  },
);
</script>

<template>
  <van-rate :model-value="params.rateValue" />
</template>

<style lang="less" scoped></style>
