<!-- 主组件 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
// 导入 PDF.js
import * as pdfjsLib from 'pdfjs-dist';
// 导入 worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

import { PDFDocument, rgb } from 'pdf-lib';
import {
  showToast,
  showConfirmDialog,
  showLoadingToast,
  closeToast,
} from 'vant';
// 导入签名弹窗组件
import SignatureDialog from './components/SignatureDialog.vue';

import type {
  SignatureConfig,
  DateConfig,
  UploadFile,
  ViewportInfo,
  AppliedDate,
  AppliedSignatureData,
  AppliedSignaturePosition,
} from './typings/pdfSignature.d.ts';

// 组件属性
const props = withDefaults(
  defineProps<{
    signatureConfig?: SignatureConfig;
    dateConfig?: DateConfig;
  }>(),
  {
    signatureConfig: () =>
      ({
        page: 1, // 签在第几页
        x: 150, // 起始x坐标,相对于PDF页面原始尺寸的坐标，pdf页面原点为左下角，canvas坐标系原点为左上角
        y: 200, // 起始y坐标,相对于 PDF 页面原始尺寸的尺寸单位
        maxWidth: 200, // 签名区域最大宽度,相对于 PDF 页面原始尺寸的尺寸单位
        maxHeight: 100, // 签名区域最大高度,相对于 PDF 页面原始尺寸的尺寸单位
        spacing: 20, // 签名之间的间距,相对于 PDF 页面原始尺寸的尺寸单位
      }) as SignatureConfig,
    dateConfig: () =>
      ({
        page: 1, // 日期在第几页
        x: 150, // 日期x坐标
        y: 150, // 日期y坐标
        fontSize: 16, // 字体大小
        color: { r: 0, g: 0, b: 0 }, // 字体颜色
        text: '', // 日期文本，为空则使用当前日期
      }) as DateConfig,
  },
);

// 设置 worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// 响应式数据
const fileList = ref<UploadFile[]>([]);
const pdfFile = ref<File | null>(null);
let pdfData: pdfjsLib.PDFDocumentProxy | null = null;
const totalPages = ref(0);
const currentPage = ref(1);
const scale = ref(1.0);

// 存储每一页的视口信息
const pageViewports = ref<Record<number, ViewportInfo>>({});

// 状态
const isGeneratingPDF = ref(false);
const isSavingImage = ref(false);

// 弹窗控制
const showSignatureDialog = ref(false);
const signatureDialogRef = ref<InstanceType<typeof SignatureDialog> | null>(
  null,
);

// 画布引用
const pdfCanvas = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);

// 已应用到PDF的签名位置
const appliedSignaturePositions = ref<AppliedSignaturePosition[]>([]);
// 保存应用签名时的签名数据副本
const appliedSignatureData = ref<AppliedSignatureData[]>([]);

// 已添加的日期
const appliedDates = ref<AppliedDate[]>([]);

// 获取设备像素比
const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

// 上传文件处理
const handleFileUpload = async (file: UploadFile): Promise<void> => {
  try {
    showLoadingToast({
      message: '加载PDF中...',
      forbidClick: true,
      duration: 0,
    });

    pdfFile.value = file.file;
    fileList.value = [{ file: file.file, status: 'done' }];

    await loadPDF(file.file);

    closeToast();
    showToast('PDF加载成功');
  } catch (error) {
    console.error('PDF加载失败:', error);
    showToast(`PDF加载失败: ${(error as Error).message}`);
  }
};

// 加载PDF
const loadPDF = async (file: File): Promise<void> => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (pdfData) {
      try {
        await pdfData.destroy();
      } catch (e) {
        console.error('清理之前的PDF文档', e);
      }
      pdfData = null;
    }

    currentPage.value = 1;
    totalPages.value = 0;
    pageViewports.value = {};
    appliedSignaturePositions.value = [];
    appliedSignatureData.value = [];

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      maxImageSize: -1,
      disableFontFace: false,
    });

    pdfData = await loadingTask.promise;
    totalPages.value = pdfData.numPages;

    await nextTick();

    await renderPage(1);
  } catch (error) {
    console.error('PDF加载错误:', error);
    throw new Error(`PDF加载失败: ${(error as Error).message}`);
  }
};

// 渲染指定页面
const renderPage = async (pageNum: number): Promise<void> => {
  if (!pdfData || pageNum < 1 || pageNum > totalPages.value) {
    return;
  }

  try {
    const page = await pdfData.getPage(pageNum);
    // 使用局部变量，避免重新声明
    let canvasElement = pdfCanvas.value;

    if (!canvasElement) {
      console.warn('Canvas元素未找到');
      await new Promise((resolve) => setTimeout(resolve, 100));
      canvasElement = pdfCanvas.value;
      if (!canvasElement) {
        console.error('Canvas元素仍未找到');
        return;
      }
    }

    const dpr = getDevicePixelRatio();
    let targetScale = scale.value;

    if (canvasContainer.value && canvasContainer.value.clientWidth > 0) {
      const containerWidth = canvasContainer.value.clientWidth - 40;
      const defaultViewport = page.getViewport({ scale: 1.0 });
      const calculatedScale = containerWidth / defaultViewport.width;
      targetScale = Math.min(calculatedScale, 2.0);
      targetScale = Math.max(targetScale, 0.5);
    } else {
      targetScale = 1.0;
    }

    const viewport = page.getViewport({ scale: targetScale });

    // 现在 TypeScript 知道 canvasElement 不为 null
    canvasElement.width = Math.floor(viewport.width * dpr);
    canvasElement.height = Math.floor(viewport.height * dpr);
    canvasElement.style.width = `${viewport.width}px`;
    canvasElement.style.height = `${viewport.height}px`;

    const context = canvasElement.getContext('2d', {
      alpha: false,
    });

    if (!context) {
      throw new Error('无法获取画布上下文');
    }

    context.scale(dpr, dpr);
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, viewport.width, viewport.height);

    const renderContext = {
      canvasContext: context,
      viewport,
      canvas: canvasElement,
      background: '#FFFFFF',
      enableWebGL: false,
    };

    await page.render(renderContext).promise;

    pageViewports.value[pageNum] = {
      scale: targetScale,
      width: viewport.width,
      height: viewport.height,
      originalWidth: viewport.width / targetScale,
      originalHeight: viewport.height / targetScale,
      dpr,
    };

    if (pageNum === props.signatureConfig.page) {
      renderAppliedSignatures();
      renderAppliedDates();
    }

    currentPage.value = pageNum;
    scale.value = targetScale;
  } catch (error) {
    console.error('页面渲染失败:', error);
    showToast(`页面渲染失败，请重试: ${(error as Error).message}`);
  }
};
// 渲染已应用的签名
const renderAppliedSignatures = (): void => {
  const canvas = pdfCanvas.value;
  if (!canvas) {
    console.error('渲染签名时PDF画布不存在');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('渲染签名时无法获取画布上下文');
    return;
  }

  const config = props.signatureConfig;
  const viewport = pageViewports.value[currentPage.value];

  if (!viewport) {
    console.error('渲染签名时视口信息不存在');
    return;
  }

  const scaleX = viewport.width / viewport.originalWidth;
  const scaleY = viewport.height / viewport.originalHeight;

  const canvasX = config.x * scaleX;
  const canvasY = config.y * scaleY;
  const canvasWidth = config.maxWidth * scaleX;
  const canvasHeight = config.maxHeight * scaleY;

  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);
  ctx.restore();

  if (appliedSignaturePositions.value.length === 0) {
    ctx.save();

    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const borderX = canvasX + 0.5;
    const borderY = canvasY + 0.5;
    const borderWidth = canvasWidth - 1;
    const borderHeight = canvasHeight - 1;

    ctx.strokeRect(borderX, borderY, borderWidth, borderHeight);
    ctx.setLineDash([]);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(canvasX, canvasY);
    ctx.lineTo(canvasX + canvasWidth, canvasY + canvasHeight);
    ctx.moveTo(canvasX + canvasWidth, canvasY);
    ctx.lineTo(canvasX, canvasY + canvasHeight);
    ctx.stroke();

    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 0.5;

    const gridSize = 20;
    for (
      let y = canvasY + gridSize;
      y < canvasY + canvasHeight;
      y += gridSize
    ) {
      ctx.beginPath();
      ctx.moveTo(canvasX, y);
      ctx.lineTo(canvasX + canvasWidth, y);
      ctx.stroke();
    }

    for (let x = canvasX + gridSize; x < canvasX + canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, canvasY);
      ctx.lineTo(x, canvasY + canvasHeight);
      ctx.stroke();
    }

    ctx.font = '16px Arial';
    ctx.fillStyle = '#999999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = canvasX + canvasWidth / 2;
    const centerY = canvasY + canvasHeight / 2;

    if (canvasHeight > 100) {
      ctx.fillText('请在此处签名', centerX, centerY - 20);
      ctx.font = '12px Arial';
      ctx.fillText(`位置: (${config.x}, ${config.y})`, centerX, centerY + 5);
      ctx.fillText(
        `尺寸: ${config.maxWidth}×${config.maxHeight}`,
        centerX,
        centerY + 25,
      );
    } else {
      ctx.font = '14px Arial';
      ctx.fillText('签名区域', centerX, centerY);
    }

    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';

    if (appliedSignaturePositions.value.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      appliedSignaturePositions.value.forEach((position) => {
        const posX = position.x;
        const posY = position.y;
        const posRight = posX + position.width;
        const posBottom = posY + position.height;

        minX = Math.min(minX, posX);
        maxX = Math.max(maxX, posRight);
        minY = Math.min(minY, posY);
        maxY = Math.max(maxY, posBottom);
      });

      const padding = 2;
      const clearX = Math.max(minX * scaleX - padding, canvasX);
      const clearY = Math.max(minY * scaleY - padding, canvasY);
      const clearWidth = Math.min(
        (maxX - minX) * scaleX + padding * 2,
        canvasWidth,
      );
      const clearHeight = Math.min(
        (maxY - minY) * scaleY + padding * 2,
        canvasHeight,
      );

      ctx.fillRect(clearX, clearY, clearWidth, clearHeight);
    } else {
      ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);
    }
    ctx.restore();

    appliedSignaturePositions.value.forEach((position, index) => {
      if (
        !position.signature ||
        !position.signature.strokes ||
        position.signature.strokes.length === 0
      ) {
        console.warn(`渲染签名${index}数据无效，跳过`);
        return;
      }

      const signature = position.signature;
      const renderX = position.x * scaleX;
      const renderY = position.y * scaleY;
      const renderScale = position.scale * Math.min(scaleX, scaleY);

      signature.strokes.forEach((stroke: any) => {
        if (stroke.points.length < 2) {
          return;
        }

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * renderScale;
        ctx.globalAlpha = stroke.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const firstPoint = stroke.points[0]!;
        ctx.moveTo(
          renderX + firstPoint.x * renderScale,
          renderY + firstPoint.y * renderScale,
        );

        for (let i = 1; i < stroke.points.length; i++) {
          const point = stroke.points[i]!;
          ctx.lineTo(
            renderX + point.x * renderScale,
            renderY + point.y * renderScale,
          );
        }
        ctx.stroke();
      });
    });
  }
};

// 页面跳转
const goToPage = (pageNum: number): void => {
  if (pageNum < 1 || pageNum > totalPages.value) return;
  // console.log(`跳转到第${pageNum}页`);
  renderPage(pageNum);
};

// 打开签名弹窗
const openSignatureDialog = (): void => {
  signatureDialogRef.value?.init();
};

// 处理从签名弹窗返回的签名数据
const handleApplySignatures = (signatureData: AppliedSignatureData[]): void => {
  // console.log('接收到签名弹窗返回的签名数据:', signatureData);

  appliedSignaturePositions.value = signatureData.map((item) => ({
    signature: item.signature,
    x: item.position.x,
    y: item.position.y,
    width: item.position.width,
    height: item.position.height,
    scale: item.position.scale,
  }));

  appliedSignatureData.value = signatureData;

  renderPage(currentPage.value);

  // console.log(
  //   '已更新签名位置，共',
  //   appliedSignaturePositions.value.length,
  //   '个签名',
  // );
};

// 清除所有签名
const clearAllSignatures = async (): Promise<void> => {
  try {
    await showConfirmDialog({
      title: '确认清除',
      message: '确定要清除所有签名和日期吗？',
    });

    // console.log('清除所有签名和日期');

    appliedSignaturePositions.value = [];
    appliedSignatureData.value = [];
    appliedDates.value = [];

    await renderPage(currentPage.value);

    showToast('所有签名和日期已清除');
  } catch {
    // console.log('用户取消清除签名和日期');
  }
};

// 保存签名图片
const saveSignedImage = (): void => {
  try {
    isSavingImage.value = true;
    // console.log('开始保存签名图片');

    const pdfCanvasEl = pdfCanvas.value;
    if (!pdfCanvasEl) {
      throw new Error('PDF画布未初始化');
    }

    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = pdfCanvasEl.width;
    combinedCanvas.height = pdfCanvasEl.height;

    const ctx = combinedCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法获取画布上下文');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
    ctx.drawImage(pdfCanvasEl, 0, 0);

    const imageUrl = combinedCanvas.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `已签名_第${currentPage.value}页_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // console.log('签名图片保存成功');
    showToast('签名图片保存成功');
  } catch (error) {
    console.error('保存图片失败:', error);
    showToast('保存图片失败');
  } finally {
    isSavingImage.value = false;
  }
};

// 生成签名PDF
const generateSignedPDF = async (): Promise<void> => {
  try {
    isGeneratingPDF.value = true;
    // console.log('开始生成签名PDF');
    showLoadingToast({
      message: '正在生成签名PDF...',
      forbidClick: true,
    });

    if (!pdfFile.value) {
      throw new Error('请先上传PDF文件');
    }
    if (
      appliedSignatureData.value.length === 0 &&
      appliedDates.value.length === 0
    ) {
      throw new Error('请先添加签名或日期');
    }

    const arrayBuffer = await pdfFile.value.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const config = props.signatureConfig;

    if (config.page < 1 || config.page > pages.length) {
      throw new Error(`签名页 ${config.page} 超出PDF页数范围`);
    }

    const page = pages[config.page - 1]!;
    const { width: pdfWidth, height: pdfHeight } = page.getSize();
    const viewport = pageViewports.value[config.page];

    if (!viewport) {
      throw new Error('页面视口信息不存在');
    }

    const scaleX = pdfWidth / viewport.originalWidth;
    const scaleY = pdfHeight / viewport.originalHeight;

    const pdfDisplayScale = 1;
    const minLineThickness = 0.3;
    const maxLineThickness = 1.2;
    const baseLineThickness = 0.5;

    appliedSignatureData.value.forEach((item) => {
      const signature = item.signature;
      const position = item.position;

      if (!signature || !signature.strokes || signature.strokes.length === 0) {
        return;
      }

      const pdfX = position.x * scaleX;
      const pdfY = pdfHeight - position.y * scaleY;

      signature.strokes.forEach((stroke: any) => {
        if (stroke.points.length < 2) {
          return;
        }

        const calculatedThickness =
          stroke.width *
          Math.min(scaleX, scaleY) *
          position.scale *
          baseLineThickness *
          pdfDisplayScale;

        const lineThickness = Math.max(
          minLineThickness,
          Math.min(calculatedThickness, maxLineThickness),
        );

        for (let j = 0; j < stroke.points.length - 1; j++) {
          const pointScale = position.scale * pdfDisplayScale;

          const startX = pdfX + stroke.points[j]!.x * pointScale * scaleX;
          const startY = pdfY - stroke.points[j]!.y * pointScale * scaleY;
          const endX = pdfX + stroke.points[j + 1]!.x * pointScale * scaleX;
          const endY = pdfY - stroke.points[j + 1]!.y * pointScale * scaleY;

          if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
            continue;
          }

          if (
            startX < 0 ||
            startX > pdfWidth ||
            startY < 0 ||
            startY > pdfHeight ||
            endX < 0 ||
            endX > pdfWidth ||
            endY < 0 ||
            endY > pdfHeight
          ) {
            continue;
          }

          try {
            page.drawLine({
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
              thickness: lineThickness,
              color: rgb(0, 0, 0),
              opacity: stroke.opacity * 0.8,
            });
          } catch (error) {
            console.error(`绘制签名失败:`, error);
          }
        }
      });
    });

    if (appliedDates.value.length > 0) {
      const datesByPage: Record<number, AppliedDate[]> = {};
      appliedDates.value.forEach((dateInfo) => {
        if (!datesByPage[dateInfo.page]) {
          datesByPage[dateInfo.page] = [];
        }
        datesByPage[dateInfo.page]!.push(dateInfo);
      });

      Object.keys(datesByPage).forEach(async (pageNum) => {
        const pageIndex = parseInt(pageNum) - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) {
          return;
        }

        const page = pages[pageIndex]!;
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        const viewport = pageViewports.value[parseInt(pageNum)];

        if (!viewport) {
          return;
        }

        const scaleX = pdfWidth / viewport.originalWidth;
        const scaleY = pdfHeight / viewport.originalHeight;

        datesByPage[parseInt(pageNum)]!.forEach(async (dateInfo) => {
          const config = dateInfo.config;
          const dateText = dateInfo.text;

          const pdfX = config.x * scaleX;
          const pdfY = pdfHeight - config.y * scaleY;
          const fontSize = config.fontSize * Math.min(scaleX, scaleY);

          try {
            page.drawText(dateText, {
              x: pdfX,
              y: pdfY,
              size: fontSize,
              color: rgb(
                config.color.r / 255,
                config.color.g / 255,
                config.color.b / 255,
              ),
              font: await pdfDoc.embedFont('Helvetica'),
              opacity: config.opacity || 1.0,
            });
          } catch (error) {
            console.error(`添加日期失败:`, error);
          }
        });
      });
    }

    const pdfBytes = await pdfDoc.save();
    // const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const blob = new Blob([pdfBytes] as [BlobPart], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `已签名_${pdfFile.value.name || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    closeToast();
    // console.log('签名PDF生成成功');
    showToast('签名PDF生成成功');
  } catch (error) {
    console.error('生成PDF失败:', error);
    showToast(`生成PDF失败: ${(error as Error).message}`);
  } finally {
    isGeneratingPDF.value = false;
  }
};

// 监听当前页面变化
watch(currentPage, (newPage) => {
  if (pdfData && newPage) {
    // console.log('页面跳转到:', newPage);
    renderPage(newPage);
  }
});

// 组件挂载
onMounted(() => {
  // console.log('PDF签名组件已挂载');
  window.addEventListener('resize', handleResize);
});

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);

  if (pdfData) {
    try {
      pdfData.destroy();
    } catch (e) {
      console.error('PDF清理完成', e);
    }
    pdfData = null;
  }

  // console.log('PDF签名组件已卸载');
});

// 处理窗口大小变化
let resizeTimer: number | null = null;
const handleResize = (): void => {
  if (pdfData && currentPage.value) {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      // console.log('窗口大小变化，重新渲染页面');
      renderPage(currentPage.value);
    }, 300) as unknown as number;
  }
};

// 格式化日期函数（固定使用"YYYY-MM-DD"格式）
const getFormattedDate = (customDate: Date | null = null): string => {
  const now = customDate || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 渲染已添加的日期
const renderAppliedDates = (): void => {
  const canvas = pdfCanvas.value;
  if (!canvas) {
    console.error('渲染日期时PDF画布不存在');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('渲染日期时无法获取画布上下文');
    return;
  }

  const viewport = pageViewports.value[currentPage.value];

  if (!viewport) {
    console.error('渲染日期时视口信息不存在');
    return;
  }

  const scaleX = viewport.width / viewport.originalWidth;
  const scaleY = viewport.height / viewport.originalHeight;

  const currentPageDates = appliedDates.value.filter(
    (date) => date.page === currentPage.value,
  );

  if (currentPageDates.length === 0) {
    return;
  }

  currentPageDates.forEach((dateInfo) => {
    const config = dateInfo.config;
    const dateText = dateInfo.text;

    const canvasX = config.x * scaleX;
    const canvasY = config.y * scaleY;
    const fontSize = config.fontSize * Math.min(scaleX, scaleY);

    ctx.save();
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = `rgb(${config.color.r}, ${config.color.g}, ${config.color.b})`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#FFFFFF';
    const textMetrics = ctx.measureText(dateText);
    const textHeight = fontSize;
    const padding = 2;
    ctx.fillRect(
      canvasX - padding,
      canvasY - textHeight - padding,
      textMetrics.width + padding * 2,
      textHeight + padding * 2,
    );

    ctx.fillStyle = `rgb(${config.color.r}, ${config.color.g}, ${config.color.b})`;
    ctx.fillText(dateText, canvasX, canvasY);

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      canvasX - padding,
      canvasY - textHeight - padding,
      textMetrics.width + padding * 2,
      textHeight + padding * 2,
    );

    ctx.restore();
  });
};

// 添加日期
const addDate = async (): Promise<void> => {
  if (!pdfFile.value) {
    showToast('请先上传PDF文件');
    return;
  }

  try {
    const config = props.dateConfig;
    const dateText = config.text || getFormattedDate();

    appliedDates.value.push({
      page: config.page,
      x: config.x,
      y: config.y,
      text: dateText,
      config: { ...config, text: dateText },
      timestamp: Date.now(),
    });

    await renderPage(currentPage.value);

    showToast('日期添加成功');
  } catch (error) {
    console.error('添加日期失败:', error);
    showToast(`添加日期失败: ${(error as Error).message}`);
  }
};
</script>

<template>
  <div class="pdf-sign-container">
    <!-- 文件上传区域 -->
    <div class="upload-section">
      <van-uploader
        v-model="fileList"
        :after-read="handleFileUpload"
        accept=".pdf"
        max-count="1"
        :max-size="20 * 1024 * 1024"
      >
        <van-button type="primary" icon="plus" size="large">
          选择PDF文件
        </van-button>
      </van-uploader>
      <p class="upload-tips">支持20MB以内的PDF文件</p>
    </div>

    <!-- PDF预览区域 -->
    <div v-if="pdfFile && totalPages > 0" class="preview-section">
      <div class="section-header">
        <h3>PDF预览</h3>
        <div class="page-controls">
          <van-button
            size="small"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
            icon="arrow-left"
          />
          <span class="page-info">
            第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
          </span>
          <van-button
            size="small"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
            icon="arrow"
          />
        </div>
      </div>

      <!-- PDF显示区域 -->
      <div class="pdf-display-area">
        <div class="canvas-container" ref="canvasContainer">
          <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
        </div>
      </div>

      <!-- 页面缩略图 -->
      <div v-if="totalPages > 1" class="page-thumbnails">
        <div
          v-for="pageNum in totalPages"
          :key="pageNum"
          class="thumbnail-item"
          :class="{ 'thumbnail-active': currentPage === pageNum }"
          @click="goToPage(pageNum)"
        >
          <div class="thumbnail-number">{{ pageNum }}</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div v-if="pdfFile && totalPages > 0" class="action-section">
      <div class="main-actions">
        <van-button
          type="primary"
          @click="openSignatureDialog"
          block
          class="action-btn"
        >
          <van-icon name="edit" />
          打开签名工具
        </van-button>
        <van-button type="success" @click="addDate"> 添加日期 </van-button>
        <van-button
          type="success"
          @click="saveSignedImage"
          :loading="isSavingImage"
          block
          class="action-btn"
        >
          <van-icon name="photo" />
          保存签名图片
        </van-button>

        <van-button
          type="success"
          @click="generateSignedPDF"
          :loading="isGeneratingPDF"
          block
          class="action-btn"
        >
          <van-icon name="down" />
          下载签名PDF
        </van-button>

        <van-button
          type="warning"
          @click="clearAllSignatures"
          block
          class="action-btn"
        >
          <van-icon name="delete" />
          清除所有签名
        </van-button>
      </div>
    </div>

    <!-- 签名弹窗组件 -->
    <SignatureDialog
      ref="signatureDialogRef"
      v-model:show-dialog="showSignatureDialog"
      :signature-config="signatureConfig"
      @apply-signatures="handleApplySignatures"
    />
  </div>
</template>

<style scoped>
.pdf-sign-container {
  max-width: 1000px;
  padding: 20px;
  margin: 0 auto;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.upload-section {
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
  background: #f7f8fa;
  border-radius: 12px;
}

.upload-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #969799;
}

.preview-section {
  padding: 16px;
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 10%);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebedf0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.page-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-info {
  min-width: 100px;
  font-size: 14px;
  color: #646566;
  text-align: center;
}

.pdf-display-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  max-height: 70vh;
  padding: 20px;
  overflow: auto;
  background: #f5f5f5;
  border-radius: 8px;
}

.canvas-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
  margin: 0 auto;
  background: white;
  box-shadow: 0 4px 20px rgb(0 0 0 / 15%);
}

.pdf-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  background: white;
}

.page-thumbnails {
  display: flex;
  gap: 8px;
  padding: 12px;
  margin-top: 16px;
  overflow-x: auto;
  background: #f7f8fa;
  border-radius: 8px;
}

.thumbnail-item {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 50px;
  cursor: pointer;
  background: white;
  border: 2px solid #dcdee0;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.thumbnail-item:hover {
  border-color: #1989fa;
  transform: translateY(-2px);
}

.thumbnail-item.thumbnail-active {
  background: #e8f4ff;
  border-color: #1989fa;
}

.thumbnail-number {
  font-size: 12px;
  font-weight: 500;
  color: #646566;
}

.action-section {
  padding: 20px;
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 10%);
}

.main-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
}

.action-btn .van-icon {
  margin-right: 8px;
}
</style>
