import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Псевдонимы путей повторяют слои Feature-Sliced Design, поэтому по импорту
 * сразу видно, в какой слой он уходит.
 */
export default defineConfig({
  plugins: [react()],
  /**
   * Сайт отдаётся из корня домена: на сервере он и API живут вместе.
   * Если когда-нибудь понадобится опубликовать его в подкаталог, поменяйте
   * значение здесь — пути к картинкам подстроятся сами (см. `shared/lib/withBase`).
   */
  base: '/',
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
    /**
     * В разработке форма заявки шлёт запрос на `/api/...` того же адреса,
     * а прокси передаёт его бэкенду. Так фронтенду не нужен CORS и не нужно
     * знать порт сервера. В продакшене адрес задаётся `VITE_API_URL`.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
