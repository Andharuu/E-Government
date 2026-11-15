import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
      port: 5173,
      // strictPort: true -> kalau 5173 dipakai proses lain, Vite GAGAL dengan jelas
      // alih-alih diam-diam pindah ke port lain (penyebab "refresh tapi tidak berubah").
      strictPort: true,
      proxy: {
        // Frontend memanggil /api lewat origin yang sama. Ini menghilangkan CORS
        // sekaligus memperbaiki cookie HttpOnly yang sebelumnya diblokir SameSite
        // karena localhost:5173 -> 127.0.0.1:8000 dianggap beda situs.
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: false,
        },
      },
    },
  resolve: {
    alias: {
      'chart.js': path.resolve(import.meta.dirname, 'node_modules/chart.js/dist/chart.js'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
          }
        },
      },
    },
  },
})
