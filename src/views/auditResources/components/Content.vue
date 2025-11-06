<script setup lang="ts">
interface Props {
  collapse: boolean;
  mode?: 'vertical' | 'horizontal' | 'inline';
  rounded?: boolean;
  theme?: 'dark' | 'light';
  scrollToActive: boolean;
}

defineOptions({ name: 'Content' });
const props = withDefaults(defineProps<Props>(), {
  mode: 'vertical',
  rounded: true,
  theme: 'dark',
});
</script>

<template>
  <div></div>
</template>
