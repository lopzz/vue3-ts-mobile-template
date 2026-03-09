<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PdfSignature from '@/components/PdfSignature/index.vue';

const pdfFile = ref(null);

// 从接口获取文件流
const fetchPDF = async () => {
  const response = await fetch(
    'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
  );
  const blob = await response.blob();
  pdfFile.value = blob; // 可以直接传入Blob
};

onMounted(() => {
  fetchPDF();
});
</script>

<template>
  <PdfSignature :pdf-file="pdfFile" :show-upload="false" />
</template>
