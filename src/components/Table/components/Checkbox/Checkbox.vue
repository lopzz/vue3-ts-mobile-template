<script setup lang="ts">
const emits = defineEmits<{
  (e: 'change', event: Event): void;
}>();
const checked = defineModel('checked', { type: Boolean, default: false });
const indeterminate = defineModel('indeterminate', {
  type: Boolean,
  default: false,
});

const handleChange = (e: Event) => {
  checked.value = (e.target as HTMLInputElement).checked;
  emits('change', e);
};
</script>

<template>
  <div class="checkbox-container" :class="{ checked, indeterminate }">
    <input type="checkbox" @change="handleChange" :checked="checked" />
  </div>
</template>

<style lang="less" scoped>
.checkbox-container {
  position: relative;
  width: 18px;
  height: 18px;
  background: hsl(0deg 0% 100% / 100%);
  border: 1px solid hsl(216deg 16% 76% / 100%);
  border-radius: 4px;

  &.checked {
    background: hsl(221deg 84% 54% / 100%);

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: '';
      background: hsl(0deg 0% 100% / 100%);
      mask-image: url('../../assets/check/tick.svg');
      mask-repeat: no-repeat;
      mask-position: center;
    }
  }

  &.indeterminate {
    background: hsl(0deg 0% 100% / 100%);
    border-color: hsl(221deg 84% 54% / 100%);

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: '';
      background: hsl(221deg 84% 54% / 100%);
      mask-image: url('../../assets/check/line.svg');
      mask-repeat: no-repeat;
      mask-position: center;
    }
  }

  input[type='checkbox'] {
    display: block;
    width: 18px;
    height: 18px;
    margin: 0;
    appearance: none;
    cursor: pointer;
    opacity: 0;
  }
}
</style>
