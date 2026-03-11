<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Select from '@/components/Select/index.vue';
import type { PageChangeEvent } from './typings/pagination';

const props = withDefaults(
  defineProps<{
    pageSize?: number;
    pageSizes?: number[];
    currentPage?: number;
    total?: number;
  }>(),
  {
    pageSize: 20,
    pageSizes: () => [20, 50, 100],
    currentPage: 1,
    total: 0,
  },
);
const emits = defineEmits<{
  'update:currentPage': [currentPage: number];
  'update:pageSize': [pageSize: number];
  pageChange: [pageChangeEvent: PageChangeEvent];
}>();

const innerCurrentPage = ref(props.currentPage);
watch(
  () => props.currentPage,
  (newVal) => {
    innerCurrentPage.value = newVal;
  },
  {
    immediate: true,
  },
);

const innerPageSize = ref(props.pageSize);
watch(
  () => props.pageSize,
  (newVal) => {
    innerPageSize.value = newVal;
  },
  {
    immediate: true,
  },
);

const pageSizeOptions = computed(() =>
  props.pageSizes.map((item) => ({ label: `${item}/页`, value: item })),
);

const maxPage = computed(() => Math.ceil(props.total / innerPageSize.value));

const lessThanMin = computed(() => innerCurrentPage.value < 2);
const overThanMax = computed(() => innerCurrentPage.value >= maxPage.value);
const prevClick = () => {
  if (lessThanMin.value) return;
  innerCurrentPage.value--;
  emits('update:currentPage', innerCurrentPage.value);
  emits('pageChange', {
    pageSize: innerPageSize.value,
    currentPage: innerCurrentPage.value,
  });
};
const nextClick = () => {
  if (overThanMax.value) {
    return;
  }
  innerCurrentPage.value++;
  emits('update:currentPage', innerCurrentPage.value);
  emits('pageChange', {
    pageSize: innerPageSize.value,
    currentPage: innerCurrentPage.value,
  });
};

const resetCurrentPage = () => {
  if (lessThanMin.value) {
    innerCurrentPage.value = 1;
    emits('update:currentPage', innerCurrentPage.value);
  }
  if (overThanMax.value) {
    innerCurrentPage.value = maxPage.value;
    emits('update:currentPage', innerCurrentPage.value);
  }
};

const changePageSize = async () => {
  // await nextTick();

  resetCurrentPage();
  emits('update:pageSize', innerPageSize.value);
  emits('pageChange', {
    pageSize: innerPageSize.value,
    currentPage: innerCurrentPage.value,
  });
};
</script>

<template>
  <div class="pagination">
    <div
      class="left-arrow arrow"
      :class="{ disabled: lessThanMin }"
      @click="prevClick"
    ></div>
    <div class="center">{{ innerCurrentPage }}/{{ maxPage }}</div>
    <div
      class="right-arrow arrow"
      :class="{ disabled: overThanMax }"
      @click="nextClick"
    ></div>
    <div class="page-sizes">
      <Select
        v-if="pageSizes && pageSizes.length"
        v-model="innerPageSize"
        :options="pageSizeOptions"
        placeholder="请选择"
        @change="changePageSize"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.pagination {
  display: flex;
  gap: 12px;
  align-items: center;

  .arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: hsl(220deg 100% 15% / 40%);
    border-radius: 50%;

    &.disabled {
      cursor: not-allowed;
      user-select: none;

      &::before {
        background-color: #bfbfbf;
      }
    }
  }

  .left-arrow::before,
  .right-arrow::before {
    display: inline-block;
    width: 20px;
    height: 20px;
    content: '';
    background-color: #fff;
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: 100% 100%;
  }

  .left-arrow::before {
    mask-image: url('./assets/leftArrow.svg');
  }

  .right-arrow::before {
    mask-image: url('./assets/rightArrow.svg');
  }

  .center {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    font-size: 16px;
    color: hsl(0deg 0% 100% / 100%);
    background: hsl(220deg 100% 15% / 40%);
    border-radius: 18px;
  }
}
</style>
