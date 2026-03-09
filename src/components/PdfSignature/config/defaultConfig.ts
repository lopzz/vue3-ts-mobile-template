const defaultSignatureConfig = {
  page: 1, // 签在第几页
  x: 150, // 起始x坐标,相对于PDF页面原始尺寸的坐标，pdf页面原点为左下角，canvas坐标系原点为左上角
  y: 200, // 起始y坐标,相对于 PDF 页面原始尺寸的尺寸单位
  maxWidth: 200, // 签名区域最大宽度,相对于 PDF 页面原始尺寸的尺寸单位
  maxHeight: 100, // 签名区域最大高度,相对于 PDF 页面原始尺寸的尺寸单位
  spacing: 20, // 签名之间的间距,相对于 PDF 页面原始尺寸的尺寸单位
};
const defaultDateConfig = {
  page: 1, // 日期在第几页
  x: 150, // 日期x坐标
  y: 150, // 日期y坐标
  fontSize: 16, // 字体大小
  color: { r: 0, g: 0, b: 0 }, // 字体颜色
  text: '', // 日期文本，为空则使用当前日期
};

export { defaultSignatureConfig, defaultDateConfig };
