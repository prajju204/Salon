import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Custom plugin to route / to the admin portal template when root is the project base
function adminPortalRoutePlugin() {
  return {
    name: 'admin-portal-route',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.headers.accept?.includes('text/html')) {
          req.url = '/admin-portal/index.html';
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': 'globalThis.VITE_API_URL'
  },
  plugins: [react(), tailwindcss(), adminPortalRoutePlugin()],
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'admin-portal/index.html'),
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'canvas-confetti',
      'clsx',
      'framer-motion',
      'html2pdf.js',
      'socket.io-client',
      'sonner',
      'tailwind-merge'
    ],
  },
})
