<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import type { Props, Option } from './typings/select.d.ts';

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: '请选择...',
  disabled: false,
  allowClear: false,
});

const emits = defineEmits<{
  change: [value: Option['value'] | number, option: Option];
  clear: [];
}>();

const modelValue = defineModel<string | number | undefined>('modelValue', {
  default: undefined,
});

const isOpen = ref(false);
const selectRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownDirection = ref<'up' | 'down'>('down');

const selectedText = computed(() => {
  const selectedOption = props.options.find(
    (opt) => opt.value === modelValue.value,
  );
  return selectedOption ? selectedOption.label : '';
});

const toggleDropdown = async () => {
  if (props.disabled) return;

  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    await nextTick();
    calculateDropdownDirection();
  }
};

const selectOption = (option: Option) => {
  if (props.disabled || option.disabled) return;
  modelValue.value = option.value;
  emits('change', option.value, option);
  isOpen.value = false;
};

const calculateDropdownDirection = () => {
  if (!selectRef.value || !dropdownRef.value) return;

  const selectRect = selectRef.value.getBoundingClientRect();
  const dropdownHeight = dropdownRef.value.offsetHeight || 240; // 默认最大高度
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - selectRect.bottom;
  const spaceAbove = selectRect.top;

  // 如果下方空间不足且上方空间足够，则向上弹出
  if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
    dropdownDirection.value = 'up';
  } else {
    dropdownDirection.value = 'down';
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const clearSelection = (e: Event) => {
  e.stopPropagation();
  if (props.disabled) return;
  modelValue.value = undefined;
  emits('clear');
  isOpen.value = false;
};

const hasValue = computed(() => {
  return modelValue.value !== undefined;
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', calculateDropdownDirection);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', calculateDropdownDirection);
});
</script>

<template>
  <div class="select" ref="selectRef">
    <div
      class="select-selected"
      :class="{ active: isOpen, disabled }"
      @click="toggleDropdown"
    >
      <span>{{ selectedText || placeholder }}</span>
      <span
        class="close"
        @click="clearSelection"
        v-if="allowClear && hasValue && !disabled"
      ></span>
      <span class="arrow" :class="{ rotated: isOpen }"></span>
    </div>

    <div
      v-show="isOpen"
      ref="dropdownRef"
      class="select-options"
      :class="[dropdownDirection]"
      @click.stop
    >
      <div
        v-for="option in options"
        :key="option.value"
        class="select-option"
        :class="{
          selected: modelValue === option.value,
          disabled: option.disabled,
        }"
        @click="!option.disabled && selectOption(option)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.select {
  position: relative;
  width: 100px;
  user-select: none;

  .select-selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
    padding: 8px 12px;
    cursor: pointer;
    background-color: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover:not(.disabled) {
      border-color: #9ca3af;
    }

    &.active {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgb(59 130 246 / 10%);
    }

    &.disabled {
      color: #9ca3af;
      cursor: not-allowed;
      background-color: #f8fafc;
      border-color: #e2e8f0;
    }

    .arrow {
      margin-left: 4px;
      font-size: 12px;
      transition: transform 0.2s ease;

      &::before {
        display: block;
        width: 20px;
        height: 20px;
        content: '';
        background-color: #9ca3af;
        mask-image: url('./assets/downArrow.svg');
        mask-repeat: no-repeat;
        mask-position: center;
        mask-size: 100% 100%;
      }

      &.rotated {
        transform: rotate(180deg);
      }
    }

    .close {
      margin-left: 8px;

      &::before {
        display: block;
        width: 20px;
        height: 20px;
        content: '';
        background-image: url('./assets/circleClose.svg');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 100% 100%;
      }
    }
  }

  .select-options {
    position: absolute;
    z-index: 50;
    max-height: 240px;
    overflow-y: auto;
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 10%),
      0 2px 4px -1px rgb(0 0 0 / 6%);

    &.down {
      top: 100%;
      right: 0;
      left: 0;
      margin-top: 4px;
    }

    &.up {
      right: 0;
      bottom: 100%;
      left: 0;
      margin-bottom: 4px;
    }
  }

  .select-option {
    padding: 10px 12px;
    color: #374151;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover:not(.selected):not(.disabled) {
      background-color: #f3f4f6;
    }

    &.selected {
      font-weight: 500;
      color: #1e40af;
      background-color: #dbeafe;
    }

    &.disabled {
      color: #9ca3af;
      cursor: not-allowed;
      background-color: #fff;

      &:hover {
        background-color: #fff;
      }
    }
  }
}
</style>
