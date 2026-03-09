<script setup lang="ts">
import { ref } from 'vue';
import PdfSignature from '@/components/PdfSignature/index.vue';

const pdfFile = ref<File | null>(null);

// 上传文件处理
const handleFileUpload = async (file) => {
  try {
    pdfFile.value = file.file;
  } catch (error) {
    console.error('PDF加载失败:', error);
  }
};
</script>

<template>
  <van-uploader
    :after-read="handleFileUpload"
    accept=".pdf"
    max-count="1"
    :max-size="20 * 1024 * 1024"
  >
    <van-button type="primary" icon="plus" size="large">
      选择PDF文件
    </van-button>
  </van-uploader>
  <PdfSignature
    :pdf-file="pdfFile"
    :show-upload="false"
    :signature-config="{ x: 100, y: 360, maxWidth: 450, maxHeight: 100 }"
    :date-config="{ x: 175, y: 500 }"
  />
</template>
