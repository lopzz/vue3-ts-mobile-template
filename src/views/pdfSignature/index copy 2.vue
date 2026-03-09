<script setup lang="ts">
import { ref } from 'vue';
import PdfSignature from '@/components/PdfSignature/index.vue';

const pdfUrl = ref(
  'https://test-jpfile1.oss-cn-shenzhen.aliyuncs.com/Bom/bom/2022/1/19/2022011911370824626513.pdf',
);
</script>

<template>
  <PdfSignature :pdf-url="pdfUrl" :show-upload="false" />
</template>
