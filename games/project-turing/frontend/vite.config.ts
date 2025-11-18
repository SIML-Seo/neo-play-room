/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../../shared'),
      // shared에서 사용하는 패키지들을 frontend/node_modules로 명시적 매핑
      'dompurify': path.resolve(__dirname, './node_modules/dompurify'),
      'firebase': path.resolve(__dirname, './node_modules/firebase'),
    },
    // shared 디렉토리에서 import하는 패키지들을 frontend/node_modules에서 찾도록 설정
    dedupe: ['react', 'react-dom', 'zustand', 'dompurify', 'firebase'],
  },
  // shared 디렉토리의 소스를 pre-bundle에서 제외하고 직접 트랜스파일
  optimizeDeps: {
    exclude: ['@shared'],
    // zustand를 명시적으로 pre-bundle에 포함 (named export 문제 해결)
    include: ['zustand', 'dompurify'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
