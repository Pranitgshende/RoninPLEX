import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 5173, host: true, watch: { ignored: ['**/src-tauri/**'] } },
  build: {
    target: ['es2020', 'chrome89', 'safari13'],
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-hls': ['hls.js'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['gsap', '@gsap/react']
        }
      }
    }
  }
});
