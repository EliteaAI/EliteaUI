/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { URL, fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

import inject from '@rollup/plugin-inject';
import react from '@vitejs/plugin-react';

import { version } from './package.json';

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default ({ mode }) => {
  console.log({ mode });
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const { VITE_SERVER_URL, VITE_SERVER_URL_V2, VITE_DEV_SERVER, VITE_DEV_TOKEN } = process.env;
  return defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    plugins: [
      react(),
      svgr(),
      inject({
        styled: ['@mui/material/styles', 'styled'],
      }),
      // pluginRewriteAll(),
    ],
    base: './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      open: false,
      proxy: {
        [VITE_SERVER_URL]: {
          target: VITE_DEV_SERVER,
          changeOrigin: true,
          secure: false,
          ws: true,
          cors: true,
          // rewrite: (path) => path.replace(/^\/api/, '')
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/socket.io': {
          target: VITE_DEV_SERVER,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/app/application_tool_icon': {
          target: VITE_DEV_SERVER, // Replace with your API server URL
          changeOrigin: true, // Change the origin of the request to the target server
          secure: false, // Disable SSL verification for development
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              proxyReq.setHeader('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
              console.log('Proxying request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received response:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/app/ui_host': {
          target: VITE_DEV_SERVER,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              proxyReq.setHeader('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
              console.log('Proxying request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received response:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/artifacts/s3': {
          target: VITE_DEV_SERVER,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              proxyReq.setHeader('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
              console.log('Proxying request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received response:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          if (warning.message?.includes('dynamic import will not move module')) return;
          if (warning.message?.includes('while both modules are dependencies of each other')) return;
          if (warning.message?.includes('has been externalized for browser compatibility')) return;
          if (warning.code === 'PLUGIN_WARNING' && warning.plugin === 'vite:resolve') return;
          warn(warning);
        },
        output: {
          manualChunks: {
            'vendor-react-mui': [
              'react',
              'react-dom',
              'react-router-dom',
              'react-redux',
              '@reduxjs/toolkit',
              '@mui/material',
              '@mui/icons-material',
              '@mui/system',
              '@mui/x-charts',
              '@mui/x-data-grid',
              '@mui/x-date-pickers',
              '@mui/x-tree-view',
              '@emotion/react',
              '@emotion/styled',
            ],
            'vendor-codemirror': ['codemirror', '@uiw/react-codemirror', '@uiw/codemirror-theme-vscode'],
            'vendor-charts': ['recharts'],
            'vendor-utils': [
              'axios',
              'jszip',
              'marked',
              'date-fns',
              'formik',
              'yup',
              'js-yaml',
              'uuid',
              'dompurify',
            ],
            'vendor-xyflow': ['@xyflow/react', '@dagrejs/dagre'],
            'vendor-prism': ['prism-react-renderer'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['@emotion/react', '@emotion/styled', '@mui/material/Tooltip'],
    },
  });
};
