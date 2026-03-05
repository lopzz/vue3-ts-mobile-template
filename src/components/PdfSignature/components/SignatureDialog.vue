<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import { showToast, showLoadingToast, closeToast } from 'vant';
import type {
  Point,
  Stroke,
  StrokeHistoryItem,
  Signature,
  CanvasMouseEvent,
  CanvasTouchEvent,
  CanvasEvent,
  Position,
  AppliedSignature,
} from '../typings/signatureDialog.d.ts';

interface SignatureConfig {
  page: number;
  x: number;
  y: number;
  maxWidth: number;
  maxHeight: number;
  spacing: number;
}

// 组件属性
const props = defineProps<{
  signatureConfig: SignatureConfig;
}>();

const emit = defineEmits<{
  applySignatures: [signatures: AppliedSignature[]];
}>();

// 签名画布相关
const signatureCanvas = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const canUndo = ref(false);

// 笔画管理
const currentStrokes = ref<Stroke[]>([]);
let currentStroke: Stroke | null = null;
const strokeHistory = ref<StrokeHistoryItem[]>([]);

// 已保存的签名
const savedSignatures = ref<Signature[]>([]);
// 当前编辑的签名索引
const editingSignatureIndex = ref<number>(-1);

// 签名预览画布引用
const signaturePreviewRefs = ref<(HTMLCanvasElement | null)[]>([]);

const showDialog = ref(false);
const init = (): void => {
  showDialog.value = true;
  // 重置编辑状态
  editingSignatureIndex.value = -1;
  nextTick(() => {
    initSignatureCanvas();
  });
};

// 初始化签名画布
const initSignatureCanvas = (): void => {
  const canvas = signatureCanvas.value;
  if (!canvas) {
    console.error('签名画布未找到');
    showToast('签名画布未找到，请刷新页面重试');
    return;
  }

  // console.log('初始化签名画布...');

  // 设置画布尺寸
  canvas.width = 400;
  canvas.height = 200;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('无法获取画布上下文');
    showToast('无法获取画布上下文');
    return;
  }

  // 使用白色背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制参考线
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // console.log('画布初始化完成');

  // 重置签名数据
  resetDrawing();
};

// 重置绘制
const resetDrawing = (): void => {
  currentStrokes.value = [];
  currentStroke = null;
  strokeHistory.value = [];
  canUndo.value = false;
  isDrawing.value = false;
  lastX.value = 0;
  lastY.value = 0;
  // 注意：这里不移除 editingSignatureIndex，因为编辑时需要保留
};

// 重置所有状态
const resetAll = (): void => {
  resetDrawing();
  editingSignatureIndex.value = -1;
};

// 清空画板
const clearCanvas = (): void => {
  const canvas = signatureCanvas.value;
  if (!canvas) {
    console.error('清除画板时画布不存在');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('清除画板时无法获取画布上下文');
    return;
  }

  // 使用白色背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 重新绘制参考线
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
};

// 获取当前签名尺寸
const getCurrentSignatureSize = (): string => {
  if (currentStrokes.value.length === 0) {
    return '0×0';
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  currentStrokes.value.forEach((stroke) => {
    stroke.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
  });

  const width = maxX - minX;
  const height = maxY - minY;

  return `${Math.round(width)}×${Math.round(height)}`;
};

// 获取总点数
const getTotalPoints = (): number => {
  return currentStrokes.value.reduce(
    (total, stroke) => total + stroke.points.length,
    0,
  );
};

// 获取画布坐标
const getCanvasCoordinates = (event: CanvasEvent): Point => {
  const canvas = signatureCanvas.value;
  if (!canvas) {
    console.error('获取坐标时画布不存在');
    return { x: 0, y: 0 };
  }

  const rect = canvas.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) {
    console.warn('画布边界矩形无效');
    return { x: 0, y: 0 };
  }

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX: number, clientY: number;

  if (event.type.includes('touch')) {
    const touchEvent = event as TouchEvent;
    if (touchEvent.touches && touchEvent.touches.length > 0) {
      clientX = touchEvent.touches[0]!.clientX;
      clientY = touchEvent.touches[0]!.clientY;
    } else if (
      touchEvent.changedTouches &&
      touchEvent.changedTouches.length > 0
    ) {
      clientX = touchEvent.changedTouches[0]!.clientX;
      clientY = touchEvent.changedTouches[0]!.clientY;
    } else {
      return { x: 0, y: 0 };
    }
  } else {
    const mouseEvent = event as MouseEvent;
    clientX = mouseEvent.clientX;
    clientY = mouseEvent.clientY;
  }

  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;

  return {
    x: Math.max(0, Math.min(x, canvas.width)),
    y: Math.max(0, Math.min(y, canvas.height)),
  };
};

// 鼠标按下
const handleMouseDown = (event: CanvasMouseEvent): void => {
  // console.log('鼠标按下事件触发');
  startDrawing(event);
};

// 鼠标移动
const handleMouseMove = (event: CanvasMouseEvent): void => {
  doDrawing(event);
};

// 鼠标抬起
const handleMouseUp = (): void => {
  // console.log('鼠标抬起事件触发');
  stopDrawing();
};

// 鼠标离开
const handleMouseLeave = (): void => {
  // console.log('鼠标离开画布');
  if (isDrawing.value) {
    stopDrawing();
  }
};

// 触摸开始
const handleTouchStart = (event: CanvasTouchEvent): void => {
  // console.log('触摸开始事件触发');
  event.preventDefault();
  startDrawing(event);
};

// 触摸移动
const handleTouchMove = (event: CanvasTouchEvent): void => {
  event.preventDefault();
  doDrawing(event);
};

// 触摸结束
const handleTouchEnd = (event: CanvasTouchEvent): void => {
  // console.log('触摸结束事件触发');
  event.preventDefault();
  stopDrawing();
};

// 开始绘制
const startDrawing = (event: CanvasEvent): void => {
  const canvas = signatureCanvas.value;
  if (!canvas) {
    console.error('开始绘制时画布不存在');
    return;
  }

  // console.log('开始绘制，事件类型:', event.type);

  isDrawing.value = true;

  const { x, y } = getCanvasCoordinates(event);
  // console.log('起始坐标:', x.toFixed(1), y.toFixed(1));

  lastX.value = x;
  lastY.value = y;

  // 创建新笔画
  currentStroke = {
    id: Date.now() + Math.random(),
    type: 'drawing',
    color: '#000000',
    width: 3,
    opacity: 1.0,
    points: [{ x, y }],
  };

  // 将新笔画添加到当前笔画列表
  currentStrokes.value.push(currentStroke);

  // 保存到历史记录
  strokeHistory.value.push({
    type: 'add',
    stroke: { ...currentStroke },
    index: currentStrokes.value.length - 1,
  });

  canUndo.value = currentStrokes.value.length > 0;

  // console.log(
  //   '新笔画创建，ID:',
  //   currentStroke.id,
  //   '当前笔画数:',
  //   currentStrokes.value.length,
  // );

  // 立即绘制一个点
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
  }
};

// 绘制过程
const doDrawing = (event: CanvasEvent): void => {
  if (!isDrawing.value || !currentStroke) {
    return;
  }

  const canvas = signatureCanvas.value;
  if (!canvas) {
    console.error('绘制过程中画布不存在');
    return;
  }

  const { x, y } = getCanvasCoordinates(event);

  // 检查坐标有效性
  if ((x === 0 && y === 0) || isNaN(x) || isNaN(y)) {
    console.warn('无效坐标，跳过绘制');
    return;
  }

  // 检查是否是有效移动
  const distance = Math.sqrt((x - lastX.value) ** 2 + (y - lastY.value) ** 2);
  if (distance < 0.5) {
    // 移动距离太小，跳过
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('无法获取画布上下文');
    return;
  }

  // 绘制线条
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 1.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(lastX.value, lastY.value);
  ctx.lineTo(x, y);
  ctx.stroke();

  // 记录点到当前笔画
  if (currentStroke) {
    currentStroke.points.push({ x, y });
  }

  // 实时更新历史记录
  if (strokeHistory.value.length > 0) {
    const lastHistory = strokeHistory.value[strokeHistory.value.length - 1]!;
    if (
      lastHistory.type === 'add' &&
      lastHistory.stroke.id === currentStroke.id
    ) {
      lastHistory.stroke.points.push({ x, y });
    }
  }

  lastX.value = x;
  lastY.value = y;
};

// 停止绘制
const stopDrawing = (): void => {
  if (isDrawing.value && currentStroke && currentStroke.points.length > 0) {
    // console.log(`笔画完成，包含 ${currentStroke.points.length} 个点`);

    // 确保笔画至少有两个点
    if (currentStroke.points.length < 2) {
      // console.log('笔画点数不足，移除无效笔画');
      const index = currentStrokes.value.findIndex(
        (s) => s.id === currentStroke!.id,
      );
      if (index > -1) {
        currentStrokes.value.splice(index, 1);
        strokeHistory.value.pop();
      }
    }
  }

  isDrawing.value = false;
  currentStroke = null;
  canUndo.value = currentStrokes.value.length > 0;
  // console.log('停止绘制，当前笔画数:', currentStrokes.value.length);
};

// 清除当前签名
const clearCurrentSignature = (): void => {
  clearCanvas();
  resetDrawing(); // 只重置绘制状态，不清除编辑索引

  // console.log('已清除所有笔画');
  showToast('已清除所有笔画');
};

// 结束编辑状态
const finishEditing = (): void => {
  clearCanvas();
  resetAll(); // 清除所有状态，包括编辑索引
};

// 撤销时重绘画布
const redrawCanvas = (): void => {
  clearCanvas();

  const canvas = signatureCanvas.value;
  if (!canvas) {
    console.error('重绘画布时画布不存在');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('重绘画布时无法获取画布上下文');
    return;
  }

  currentStrokes.value.forEach((stroke) => {
    if (stroke.points.length > 1) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.globalAlpha = stroke.opacity;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i]!;
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  });
};

// 撤销最后笔画
const undoLastStroke = (): void => {
  if (currentStrokes.value.length === 0) {
    // console.log('没有笔画可撤销');
    return;
  }

  // console.log('撤销最后一个笔画');

  const removedStroke = currentStrokes.value.pop()!;

  strokeHistory.value.push({
    type: 'remove',
    stroke: removedStroke,
    index: currentStrokes.value.length,
  });

  redrawCanvas();

  canUndo.value = currentStrokes.value.length > 0;
  // console.log('撤销完成，剩余笔画数:', currentStrokes.value.length);
  showToast('已撤销上一个笔画');
};

// 保存当前签名
const saveCurrentSignature = (): void => {
  if (currentStrokes.value.length === 0) {
    // console.log('没有笔画可保存');
    showToast('请先绘制签名');
    return;
  }

  // console.log('开始保存签名，当前笔画数:', currentStrokes.value.length);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  currentStrokes.value.forEach((stroke) => {
    stroke.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
  });

  const width = maxX - minX;
  const height = maxY - minY;

  const normalizedStrokes = currentStrokes.value.map((stroke) => {
    const normalizedPoints = stroke.points.map((point) => ({
      x: point.x - minX,
      y: point.y - minY,
    }));

    return {
      ...stroke,
      points: normalizedPoints,
    };
  });

  const signatureData: Signature = {
    id: Date.now(),
    strokes: normalizedStrokes,
    width,
    height,
    strokeCount: normalizedStrokes.length,
    pointCount: getTotalPoints(),
  };

  if (editingSignatureIndex.value >= 0) {
    // 更新已有签名
    signatureData.id = savedSignatures.value[editingSignatureIndex.value]!.id;
    savedSignatures.value[editingSignatureIndex.value] = signatureData;
    // console.log('签名已更新');
    showToast('签名已更新');

    // 编辑模式保存后，结束编辑状态
    finishEditing();
  } else {
    // 新增签名
    savedSignatures.value.push(signatureData);
    // console.log('签名已保存');
    showToast('签名已保存');

    // 新增模式保存后，清空画板
    clearCanvas();
    resetDrawing();
  }

  nextTick(() => {
    renderSignaturePreviews();
  });
};

// 计算保存按钮文字
const saveButtonText = computed(() => {
  return editingSignatureIndex.value >= 0 ? '更新签名' : '保存当前签名';
});

// 设置签名预览引用
const setSignaturePreviewRef = (
  el: HTMLCanvasElement | null,
  index: number,
): void => {
  if (el) {
    signaturePreviewRefs.value[index] = el;
  }
};

// 渲染签名预览
const renderSignaturePreviews = (): void => {
  savedSignatures.value.forEach((signature, index) => {
    const canvas = signaturePreviewRefs.value[index];
    if (!canvas) {
      console.warn(`签名预览画布 ${index} 未找到`);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`签名预览画布 ${index} 无法获取上下文`);
      return;
    }

    const previewSize = 100;
    canvas.width = previewSize;
    canvas.height = previewSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (signature.strokes.length > 0) {
      const maxPreviewSize = previewSize - 20;
      const scaleX = maxPreviewSize / signature.width;
      const scaleY = maxPreviewSize / signature.height;
      const scale = Math.min(scaleX, scaleY, 1);

      const scaledWidth = signature.width * scale;
      const scaledHeight = signature.height * scale;
      const offsetX = (previewSize - scaledWidth) / 2;
      const offsetY = (previewSize - scaledHeight) / 2;

      signature.strokes.forEach((stroke) => {
        if (stroke.points.length > 1) {
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width;
          ctx.globalAlpha = stroke.opacity;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          const firstPoint = stroke.points[0]!;
          ctx.moveTo(
            offsetX + firstPoint.x * scale,
            offsetY + firstPoint.y * scale,
          );

          for (let i = 1; i < stroke.points.length; i++) {
            const point = stroke.points[i]!;
            ctx.lineTo(offsetX + point.x * scale, offsetY + point.y * scale);
          }
          ctx.stroke();
        }
      });
    }

    // console.log(`签名预览 ${index} 渲染完成`);
  });
};

// 选择签名
// const selectSignature = (index: number): void => {
//   editingSignatureIndex.value = index;
//   console.log('选择签名:', index);
// };

// 编辑签名
const editSignature = (index: number): void => {
  if (index < 0 || index >= savedSignatures.value.length) {
    console.error('编辑签名索引无效:', index);
    return;
  }

  const signature = savedSignatures.value[index]!;
  // 先设置编辑索引
  editingSignatureIndex.value = index;

  const canvas = signatureCanvas.value;
  if (!canvas) {
    console.error('编辑签名时画布不存在');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('编辑签名时无法获取画布上下文');
    return;
  }

  clearCanvas();

  if (signature.strokes.length > 0) {
    // 只重置绘制数据，不重置编辑索引
    resetDrawing();

    const maxWidth = canvas.width - 40;
    const maxHeight = canvas.height - 40;
    const scaleX = maxWidth / signature.width;
    const scaleY = maxHeight / signature.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const scaledWidth = signature.width * scale;
    const scaledHeight = signature.height * scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;

    signature.strokes.forEach((originalStroke) => {
      const stroke: Stroke = {
        ...originalStroke,
        points: originalStroke.points.map((point) => ({
          x: offsetX + point.x * scale,
          y: offsetY + point.y * scale,
        })),
      };

      currentStrokes.value.push(stroke);

      if (stroke.points.length > 1) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.globalAlpha = stroke.opacity;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const firstPoint = stroke.points[0]!;
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < stroke.points.length; i++) {
          const point = stroke.points[i]!;
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      }
    });

    canUndo.value = currentStrokes.value.length > 0;
  }

  // console.log('签名编辑模式已激活，当前笔画数:', currentStrokes.value.length);
  showToast('已选择要编辑的签名');
};

// 删除签名
const removeSignature = (index: number): void => {
  if (index < 0 || index >= savedSignatures.value.length) {
    console.error('删除签名索引无效:', index);
    return;
  }

  savedSignatures.value.splice(index, 1);
  signaturePreviewRefs.value.splice(index, 1);

  if (editingSignatureIndex.value === index) {
    editingSignatureIndex.value = -1;
    finishEditing(); // 调用 finishEditing 而不是 clearCurrentSignature
  } else if (editingSignatureIndex.value > index) {
    editingSignatureIndex.value--;
  }

  // console.log('签名已删除，剩余签名数:', savedSignatures.value.length);
  showToast('签名已删除');
};

// 尝试使用指定缩放比例进行布局
const tryLayoutWithScale = (
  signatures: Signature[],
  config: SignatureConfig,
  scale: number,
  positions: Position[],
): boolean => {
  let currentX = config.x;
  let currentY = config.y;
  let rowHeight = 0;
  let rowStartY = currentY;
  let allFitted = true;

  positions.length = 0;

  for (let i = 0; i < signatures.length; i++) {
    const signature = signatures[i]!;
    const scaledWidth = signature.width * scale;
    const scaledHeight = signature.height * scale;

    if (scaledWidth < 5 || scaledHeight < 5) {
      allFitted = false;
      break;
    }

    if (currentX + scaledWidth > config.x + config.maxWidth) {
      currentX = config.x;
      currentY = rowStartY + rowHeight + config.spacing;
      rowStartY = currentY;
      rowHeight = 0;

      if (scaledHeight > config.maxHeight) {
        allFitted = false;
        break;
      }
    }

    const newRowHeight = Math.max(rowHeight, scaledHeight);
    const bottomY = currentY + newRowHeight;
    const totalHeightFromStart = bottomY - config.y;

    if (totalHeightFromStart > config.maxHeight) {
      allFitted = false;
      break;
    }

    positions.push({
      signature: signatures[i]!,
      x: currentX,
      y: currentY,
      width: scaledWidth,
      height: scaledHeight,
      scale,
      index: i,
    });

    currentX += scaledWidth + config.spacing;
    rowHeight = newRowHeight;
  }

  return allFitted;
};

// 计算签名的自动布局
const calculateSignaturePositions = (): Position[] => {
  const config = props.signatureConfig;
  const positions: Position[] = [];

  if (config.maxWidth <= 0 || config.maxHeight <= 0) {
    showToast('签名区域尺寸配置无效');
    return positions;
  }

  const validSignatures = savedSignatures.value.filter((signature) => {
    if (!signature || !signature.width || !signature.height) {
      return false;
    }
    if (signature.width <= 0 || signature.height <= 0) {
      return false;
    }
    return true;
  });

  if (validSignatures.length === 0) {
    return positions;
  }

  let maxWidth = 0;
  let maxHeight = 0;

  validSignatures.forEach((signature) => {
    maxWidth = Math.max(maxWidth, signature.width);
    maxHeight = Math.max(maxHeight, signature.height);
  });

  const baseScaleX = config.maxWidth / maxWidth;
  const baseScaleY = config.maxHeight / maxHeight;
  let baseScale = Math.min(baseScaleX, baseScaleY, 1);

  if (baseScale > 1) {
    baseScale = 1;
  }

  let layoutSuccessful = tryLayoutWithScale(
    validSignatures,
    config,
    baseScale,
    positions,
  );

  if (!layoutSuccessful) {
    let attemptScale = baseScale;
    const maxAttempts = 20;
    const scaleStep = 0.05;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attemptScale = Math.max(attemptScale - scaleStep, 0.1);

      positions.length = 0;
      layoutSuccessful = tryLayoutWithScale(
        validSignatures,
        config,
        attemptScale,
        positions,
      );

      if (layoutSuccessful) {
        baseScale = attemptScale;
        break;
      }

      if (attemptScale <= 0.1) {
        break;
      }
    }
  }

  return positions;
};

// 将签名应用到PDF
const applySignaturesToPDF = async (): Promise<void> => {
  if (savedSignatures.value.length === 0) {
    showToast('请先创建签名');
    return;
  }

  try {
    showLoadingToast({
      message: '正在计算签名布局...',
      forbidClick: true,
    });

    const positions = calculateSignaturePositions();

    if (positions.length === 0) {
      closeToast();
      showToast('没有签名可以放置在指定区域内');
      return;
    }

    const signatureData: AppliedSignature[] = positions
      .map((position, index) => {
        if (position && position.signature) {
          return {
            signature: JSON.parse(JSON.stringify(position.signature)),
            position: {
              x: position.x,
              y: position.y,
              width: position.width,
              height: position.height,
              scale: position.scale,
            },
            originalIndex: position.index || index,
          };
        }
        return null;
      })
      .filter((item): item is AppliedSignature => item !== null);

    closeToast();
    emit('applySignatures', signatureData);
    showDialog.value = false;

    const appliedCount = positions.length;
    const totalCount = savedSignatures.value.length;

    if (appliedCount === totalCount) {
      showToast(`✅ 已成功计算所有 ${appliedCount} 个签名的布局`);
    } else {
      showToast(
        `⚠️ 已计算 ${appliedCount} 个签名的布局，${totalCount - appliedCount} 个因空间不足被忽略`,
      );
    }
  } catch (error) {
    console.error('计算签名布局失败:', error);
    showToast(`计算签名布局失败: ${(error as Error).message}`);
  }
};

defineExpose({
  init,
});
</script>

<template>
  <van-dialog
    v-model:show="showDialog"
    title="签名工具"
    :show-cancel-button="true"
    :show-confirm-button="true"
    cancel-button-text="取消"
    confirm-button-text="确认应用"
    @confirm="applySignaturesToPDF"
  >
    <div class="signature-dialog">
      <!-- 签名绘制区域 -->
      <div class="signature-create-area">
        <h4>新建签名</h4>
        <div class="signature-canvas-container">
          <canvas
            ref="signatureCanvas"
            class="signature-canvas"
            @mousedown.prevent="handleMouseDown"
            @mousemove.prevent="handleMouseMove"
            @mouseup.prevent="handleMouseUp"
            @mouseleave.prevent="handleMouseLeave"
            @touchstart.prevent="handleTouchStart"
            @touchmove.prevent="handleTouchMove"
            @touchend.prevent="handleTouchEnd"
          ></canvas>
        </div>

        <div class="signature-controls">
          <van-button
            @click="saveCurrentSignature"
            type="primary"
            size="small"
            class="control-btn"
          >
            <van-icon name="plus" />
            {{ saveButtonText }}
          </van-button>
          <van-button
            @click="clearCurrentSignature"
            type="warning"
            size="small"
            class="control-btn"
          >
            <van-icon name="delete" />
            清除
          </van-button>
          <van-button
            @click="undoLastStroke"
            type="default"
            size="small"
            :disabled="!canUndo"
            class="control-btn"
          >
            <van-icon name="undo" />
            撤销笔画
          </van-button>
        </div>

        <div class="signature-info">
          <p>
            笔画数: {{ currentStrokes.length }} | 点数: {{ getTotalPoints() }}
          </p>
          <p v-if="currentStrokes.length > 0">
            签名尺寸: {{ getCurrentSignatureSize() }}
          </p>
        </div>
      </div>

      <!-- 已保存的签名列表 -->
      <div class="saved-signatures-section">
        <h4>已保存的签名 ({{ savedSignatures.length }})</h4>
        <div v-if="savedSignatures.length > 0" class="saved-signatures-list">
          <div
            v-for="(signature, index) in savedSignatures"
            :key="signature.id"
            class="signature-item"
            @click="editSignature(index)"
            :class="{
              'signature-selected': editingSignatureIndex === index,
            }"
          >
            <canvas
              :ref="(el) => setSignaturePreviewRef(el, index)"
              class="signature-preview"
            ></canvas>
            <div class="signature-item-info">
              <span>签名 {{ index + 1 }}</span>
              <div class="signature-item-stats">
                <span class="size-info">
                  {{ signature.width.toFixed(0) }}×{{
                    signature.height.toFixed(0)
                  }}
                </span>
                <span class="stroke-info"> {{ signature.strokeCount }}笔 </span>
              </div>
              <div class="signature-item-actions">
                <van-button
                  @click.stop="editSignature(index)"
                  type="primary"
                  size="mini"
                  plain
                >
                  编辑
                </van-button>
                <van-button
                  @click.stop="removeSignature(index)"
                  type="danger"
                  size="mini"
                  plain
                >
                  删除
                </van-button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-signatures">
          <van-icon name="edit" size="48px" color="#dcdee0" />
          <p>暂无保存的签名</p>
        </div>
      </div>

      <!-- 签名区域信息 -->
      <div class="signature-area-info">
        <h4>签名区域信息</h4>
        <div class="area-stats">
          <div class="stat-item">
            <span class="stat-label">区域大小:</span>
            <span class="stat-value">
              {{ signatureConfig.maxWidth }}×
              {{ signatureConfig.maxHeight }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">签名数量:</span>
            <span class="stat-value">{{ savedSignatures.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">缩放策略:</span>
            <span class="stat-value">整体等比缩小</span>
          </div>
        </div>
      </div>
    </div>
  </van-dialog>
</template>

<style scoped>
/* 样式保持不变 */
.signature-dialog {
  max-height: 80vh;
  padding: 20px;
  overflow-y: auto;
}

.signature-dialog h4 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.signature-create-area {
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid #ebedf0;
}

.signature-canvas-container {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: 16px;
  overflow: hidden;
  touch-action: none;
  cursor: crosshair;
  user-select: none;
  background: #fff;
  border: 2px dashed #dcdee0;
  border-radius: 8px;
}

.signature-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
  background: transparent;
}

.signature-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 12px;
}

.control-btn {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 36px;
  font-size: 12px;
}

.control-btn .van-icon {
  margin-right: 4px;
}

.signature-info {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #666;
  text-align: center;
}

.signature-info p {
  margin: 4px 0;
}

.saved-signatures-section {
  margin-top: 20px;
}

.saved-signatures-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  max-height: 300px;
  padding: 8px;
  margin-top: 12px;
  overflow-y: auto;
}

.signature-item {
  width: 120px;
  padding: 12px;
  cursor: pointer;
  background: white;
  border: 2px solid #dcdee0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.signature-item:hover {
  border-color: #1989fa;
  box-shadow: 0 2px 8px rgb(25 137 250 / 20%);
  transform: translateY(-2px);
}

.signature-item.signature-selected {
  background: #f0f7ff;
  border-color: #1989fa;
}

.signature-preview {
  display: block;
  width: 100%;
  height: 100px;
  margin-bottom: 8px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

.signature-item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.signature-item-stats {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999;
}

.signature-item-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 4px;
}

.empty-signatures {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #969799;
  text-align: center;
}

.empty-signatures p {
  margin-top: 8px;
  font-size: 14px;
}

.signature-area-info {
  padding: 16px;
  margin-top: 20px;
  background: #f7f8fa;
  border-radius: 8px;
}

.signature-area-info h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}

.area-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.stat-label {
  margin-bottom: 4px;
  font-size: 11px;
  color: #969799;
}

.stat-value {
  font-size: 12px;
  font-weight: 500;
  color: #323233;
}
</style>
