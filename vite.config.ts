
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000, // Aumenta o limite para 2MB para evitar o erro no Vercel
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Move todas as bibliotecas externas para um arquivo separado (vendor)
            return 'vendor';
          }
        },
      },
    },
  }
});
