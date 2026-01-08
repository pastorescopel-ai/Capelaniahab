
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Isso é necessário para evitar erros com variáveis de ambiente no cliente se não forem prefixadas com VITE_
    'process.env': process.env
  }
});
