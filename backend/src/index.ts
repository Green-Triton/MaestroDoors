/** Точка входа: HTTP-сервер приёма заявок. */

import cors from 'cors'
import express from 'express'

import { ConfigError, loadConfig } from './config.js'
import { Mailer } from './mailer.js'
import { createLeadsRouter } from './routes/leads.js'

const start = async (): Promise<void> => {
  const config = loadConfig()
  const mailer = new Mailer(config)
  const app = express()

  // Сервер почти всегда стоит за прокси (nginx, хостинг-балансировщик).
  // Без этого req.ip вернёт адрес прокси, и ограничение частоты станет общим
  // на всех посетителей сразу.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(
    cors({
      origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : true,
      methods: ['POST', 'GET', 'OPTIONS'],
    }),
  )
  // Заявка — это несколько строк текста; лимит отсекает попытки залить мусор.
  app.use(express.json({ limit: '16kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'leads', time: new Date().toISOString() })
  })

  app.use('/api', createLeadsRouter(config, mailer))

  app.use((_req, res) => {
    res.status(404).json({ ok: false, message: 'Не найдено' })
  })

  // Проверяем SMTP на старте, но не падаем: сайт должен подняться, даже если
  // почтовый провайдер сейчас недоступен.
  try {
    await mailer.verify()
    console.log(`SMTP  : ${config.smtp.host}:${config.smtp.port} — соединение установлено`)
  } catch (error) {
    console.warn(
      'SMTP  : проверить соединение не удалось. Заявки будут падать, пока это не починится.',
    )
    console.warn(error instanceof Error ? error.message : error)
  }

  app.listen(config.port, () => {
    console.log(`Сервер: http://localhost:${config.port}`)
    console.log(`Заявки: ${config.mail.to}${config.mail.copyToSender ? ` (+ копия на ${config.smtp.user})` : ''}`)
  })
}

start().catch((error) => {
  if (error instanceof ConfigError) {
    console.error(`\nОшибка конфигурации: ${error.message}\n`)
    process.exit(1)
  }
  console.error(error)
  process.exit(1)
})
