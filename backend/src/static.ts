/**
 * Раздача собранного фронтенда тем же процессом, что принимает заявки.
 *
 * Благодаря этому сайт и API живут на одном домене: не нужен CORS, не нужен
 * `VITE_API_URL`, и разворачивать нужно одно приложение вместо двух.
 *
 * В продакшене статику обычно отдаёт nginx напрямую — он делает это лучше.
 * Эта раздача всё равно нужна: сразу после установки, до настройки nginx,
 * `npm start` даёт полностью рабочий сайт, и его можно проверить curl'ом.
 * Если nginx настроен, сюда просто не доходят запросы.
 */

import { existsSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import express, { type Express, type Request, type Response } from 'express'

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * Путь к сборке фронтенда по умолчанию.
 *
 * Считается одинаково и для исходников (`backend/src/`), и для скомпилированного
 * кода (`backend/dist/`) — оба лежат на два уровня ниже корня проекта.
 */
export const DEFAULT_FRONTEND_DIST = resolve(HERE, '..', '..', 'frontend', 'dist')

/** Хешированные Vite'ом файлы можно кешировать навсегда: имя меняется вместе с содержимым. */
const IMMUTABLE_MAX_AGE = 365 * 24 * 60 * 60

/** Картинки дверей имя не меняют, поэтому кеш короче и с перепроверкой. */
const ASSET_MAX_AGE = 7 * 24 * 60 * 60

export const mountFrontend = (app: Express, distPath: string): boolean => {
  if (!existsSync(join(distPath, 'index.html'))) {
    console.warn(
      `Фронтенд: сборка не найдена в ${distPath} — работает только API.\n` +
        '         Соберите её командой `npm run build --prefix frontend` ' +
        'или укажите путь в FRONTEND_DIST.',
    )
    return false
  }

  app.use(
    express.static(distPath, {
      // index.html отдаём вручную ниже, чтобы гарантированно проставить
      // заголовок «не кешировать»: иначе браузер продолжит просить старую
      // сборку и ссылаться на удалённые файлы.
      index: false,
      etag: true,
      setHeaders: (res, filePath) => {
        const hashed = filePath.includes(`${sep}assets${sep}`)
        res.setHeader(
          'Cache-Control',
          hashed
            ? `public, max-age=${IMMUTABLE_MAX_AGE}, immutable`
            : `public, max-age=${ASSET_MAX_AGE}`,
        )
      },
    }),
  )

  const sendIndex = (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(join(distPath, 'index.html'))
  }

  // Одностраничное приложение: всё, что не файл и не API, отдаём как главную.
  app.get('/', sendIndex)
  app.get(/^\/(?!api\/).*/, sendIndex)

  console.log(`Фронтенд: ${distPath}`)
  return true
}
