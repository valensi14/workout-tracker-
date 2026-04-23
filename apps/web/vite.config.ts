import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/workout-tracker/' : '/',
  server: {
    port: parseInt(process.env.PORT ?? '5173'),
  },
});
