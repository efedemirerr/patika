import { defineConfig } from 'vite';
// base './' → hem GitHub Pages alt yolu hem Capacitor (file) için çalışır
export default defineConfig({ base: './', build: { outDir: 'dist', chunkSizeWarningLimit: 1000 } });
