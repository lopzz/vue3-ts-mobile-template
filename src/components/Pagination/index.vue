<script setup lang="ts">
import { computed, nextTick } from 'vue';
import Select from '@/components/Select/index.vue';
import type { PageChangeEvent } from './typings/pagination';

const props = withDefaults(
  defineProps<{
    pageSizes?: number[];
    showPageSizes?: boolean;
    total?: number;
  }>(),
  {
    pageSizes: () => [20, 50, 100],
    showPageSizes: true,
    total: 0,
  },
);
const emits = defineEmits<{
  pageChange: [pageChangeEvent: PageChangeEvent];
}>();

const pageSize = defineModel<number>('pageSize', {
  default: 20,
});

const currentPage = defineModel<number>('currentPage', {
  default: 1,
});

const pageSizeOptions = computed(() =>
  props.pageSizes.map((item) => ({ label: `${item}/页`, value: item })),
);

const maxPage = computed(() => Math.ceil(props.total / pageSize.value));

const lessThanMin = computed(() => currentPage.value < 2);
const overThanMax = computed(() => currentPage.value >= maxPage.value);
const prevClick = () => {
  if (lessThanMin.value) return;
  const newCurrentPage = currentPage.value - 1;
  currentPage.value = newCurrentPage;

  emits('pageChange', {
    pageSize: pageSize.value,
    currentPage: newCurrentPage,
  });
};
const nextClick = () => {
  if (overThanMax.value) {
    return;
  }
  const newCurrentPage = currentPage.value + 1;
  currentPage.value = newCurrentPage;
  emits('pageChange', {
    pageSize: pageSize.value,
    currentPage: newCurrentPage,
  });
};

const resetCurrentPage = () => {
  if (currentPage.value < 2) {
    currentPage.value = 1;
  }
  if (currentPage.value >= maxPage.value) {
    currentPage.value = maxPage.value;
  }
};

const changePageSize = async () => {
  await nextTick(); // 等待maxPage更新
  resetCurrentPage();
  await nextTick(); // 等待currentPage.value更新
  emits('pageChange', {
    pageSize: pageSize.value,
    currentPage: currentPage.value,
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
    <div class="center">{{ currentPage }}/{{ maxPage }}</div>
    <div
      class="right-arrow arrow"
      :class="{ disabled: overThanMax }"
      @click="nextClick"
    ></div>
    <div class="page-sizes" v-if="pageSizes && pageSizes.length">
      <Select
        v-model="pageSize"
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
