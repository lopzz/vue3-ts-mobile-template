import config from './tailwind.config.ts';

module.exports = {
  plugins: {
    'postcss-px-to-viewport': {
      unitToConvert: 'px', // 需要转换的单位
      viewportWidth: 375, // 设计稿宽度，通常为 iPhone 6/7/8 的宽度
      viewportHeight: 667, // 设计稿高度
      unitPrecision: 5, // 精确度，小数点后几位
      propList: ['*'], // 指定可以转换的属性，* 表示所有
      viewportUnit: 'vw', // 指定需要转换成的视口单位
      fontViewportUnit: 'vw', // 字体使用的视口单位
      selectorBlackList: [], // 指定不转换为视口单位的类
      minPixelValue: 1, // 默认值1，小于或等于1px则不转换
      mediaQuery: false, // 是否在媒体查询中也进行转换
      replace: true, // 是否直接更换属性值
      exclude: [/node_modules/], // 设置忽略文件，用正则排除 node_modules 文件夹
      landscape: false, // 是否处理横屏情况
      landscapeUnit: 'vw',
      landscapeWidth: 667,
    },
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
    // Specifying the config is not necessary in most cases, but it is included
    autoprefixer: {},
    'postcss-import': {},
    'postcss-preset-env': {},
    tailwindcss: { config },
    'tailwindcss/nesting': {},
  },
};
