/**
 * Конфигурация из переменных окружения.
 *
 * Всё читается и проверяется один раз при старте: если чего-то не хватает,
 * процесс падает сразу с внятным сообщением, а не через неделю на первой
 * заявке от клиента.
 */

import 'dotenv/config'

class ConfigError extends Error {}

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new ConfigError(
      `Не задана переменная окружения ${name}. ` +
        'Скопируйте backend/.env.example в backend/.env и заполните значения.',
    )
  }
  return value
}

const optional = (name: string, fallback: string): string =>
  process.env[name]?.trim() || fallback

const asInt = (name: string, fallback: number): number => {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const value = Number.parseInt(raw, 10)
  if (Number.isNaN(value)) {
    throw new ConfigError(`Переменная ${name} должна быть числом, получено «${raw}».`)
  }
  return value
}

const asBool = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name]?.trim().toLowerCase()
  if (!raw) return fallback
  return raw === 'true' || raw === '1' || raw === 'yes'
}

export interface AppConfig {
  port: number
  /** Домены, которым разрешено обращаться к API. Пустой список — разрешить всем. */
  allowedOrigins: string[]
  smtp: {
    host: string
    port: number
    /** true для 465 (SSL), false для 587 (STARTTLS). */
    secure: boolean
    user: string
    pass: string
  }
  mail: {
    /** Куда уходит заявка. */
    to: string
    /** Копия отправителю: письмо приходит и в ящик, с которого ушла рассылка. */
    copyToSender: boolean
    /** Отображаемое имя в поле «От кого». */
    fromName: string
  }
  rateLimit: {
    windowMs: number
    max: number
  }
}

export const loadConfig = (): AppConfig => {
  const smtpUser = required('SMTP_USER')
  const smtpPort = asInt('SMTP_PORT', 465)

  return {
    port: asInt('PORT', 3001),
    allowedOrigins: optional('ALLOWED_ORIGINS', '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    smtp: {
      host: required('SMTP_HOST'),
      port: smtpPort,
      // 465 — неявный TLS, 587 — STARTTLS. Ошибка в этом флаге даёт
      // бесконечное ожидание при подключении, поэтому выводим его из порта.
      secure: asBool('SMTP_SECURE', smtpPort === 465),
      user: smtpUser,
      pass: required('SMTP_PASS'),
    },
    mail: {
      to: required('RECIPIENT_EMAIL'),
      copyToSender: asBool('SEND_COPY_TO_SENDER', true),
      fromName: optional('MAIL_FROM_NAME', 'Сайт ООО СК «Пирс»'),
    },
    rateLimit: {
      windowMs: asInt('RATE_LIMIT_WINDOW_MS', 10 * 60 * 1000),
      max: asInt('RATE_LIMIT_MAX', 5),
    },
  }
}

export { ConfigError }
