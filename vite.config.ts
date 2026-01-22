import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueDevTools from 'vite-plugin-vue-devtools';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from 'unplugin-vue-components/resolvers';

// https://vite.dev/config/
export default defineConfig({
  base: '/audit-management-mobile/', // 这个跟nginx配置的location一样，就是url上要多这个base，找资源时也按照这个来找
  build: {
    // 修改输出目录名称
    outDir: 'audit-management-mobile', // 改为你想要的名称
    emptyOutDir: true, // 构建时清空目录
  },
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // mock代理目标地址
        target: 'http://localhost:5320/api',
        ws: true,
      },
    },
  },
});
