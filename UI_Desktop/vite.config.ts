import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Đảm bảo Vite server lắng nghe đúng host
  server: {
    port: 5173,
    strictPort: true,
    host: process.env.TAURI_DEV_HOST || 'localhost',
  },
  
  // Build output vào thư mục dist
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  
  // Prevent vite from obscuring rust errors
  clearScreen: false,
  
  // Assure .xlsx files are treated as assets
  assetsInclude: ['**/*.xlsx'],
});
