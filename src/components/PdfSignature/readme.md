```ts
<!-- 方式1：通过接口获取文件流后传入 -->
<template>
  <PdfSignature
    :pdf-file="pdfFile"
    :show-upload="false"
    :signature-config="{ x: 100, y: 360, maxWidth: 450, maxHeight: 100 }"
    :date-config="{ x: 175, y: 500 }"
  />
</template>

<script setup>
import { ref } from 'vue';
import PdfSignature from './PdfSignature.vue';

const pdfFile = ref(null);


// 从接口获取文件流
const fetchPDF = async () => {
  const response = await fetch('/api/get-pdf');
  const blob = await response.blob();
  pdfFile.value = blob; // 可以直接传入Blob
};
</script>
```

```ts
<!-- 方式2：通过URL传入 -->
<template>
  <PdfSignature
    :pdf-url="pdfUrl"
    :show-upload="false"
    :signature-config="{ x: 100, y: 360, maxWidth: 450, maxHeight: 100 }"
    :date-config="{ x: 175, y: 500 }"
  />
</template>

<script setup>
import { ref } from 'vue';
import PdfSignature from './PdfSignature.vue';

const pdfUrl = ref('https://example.com/document.pdf');
</script>
```

```ts
<!-- 方式3：通过File对象传入 -->
<template>
  <PdfSignature
    :pdf-file="file"
    :show-upload="false"
    :signature-config="{ x: 100, y: 360, maxWidth: 450, maxHeight: 100 }"
    :date-config="{ x: 175, y: 500 }"
  />
</template>

<script setup>
import { ref } from 'vue';
import PdfSignature from './PdfSignature.vue';

const file = ref(null);

// 从文件输入框获取
const handleFileChange = (event) => {
  file.value = event.target.files[0];
};
</script>
```
