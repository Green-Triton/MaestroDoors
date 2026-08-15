/**
 * Отправка заявок по SMTP.
 *
 * Транспорт создаётся один раз и переиспользует соединение (`pool`) — иначе
 * каждая заявка заново проходит TLS-рукопожатие и аутентификацию.
 */

import nodemailer, { type Transporter } from 'nodemailer'

import type { AppConfig } from './config.js'
import type { Lead } from './validation.js'

/** Экранирование пользовательского ввода перед вставкой в HTML-письмо. */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Российский номер — в читаемом виде.
 *
 * Клиент присылает номер уже нормализованным (`+79161234567`), но менеджер
 * читает письмо глазами и звонит руками, поэтому в письме номер разбивается
 * на группы. Всё, что не похоже на российский номер, остаётся как есть.
 */
const formatPhone = (digits: string, fallback: string): string => {
  if (digits.length !== 11 || !digits.startsWith('7')) return fallback
  const [, a, b, c, d] = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits) ?? []
  return a ? `+7 (${a}) ${b}-${c}-${d}` : fallback
}

const formatDate = (): string =>
  new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Moscow',
  }).format(new Date())

interface Row {
  label: string
  value: string
  /** Значение выводится ссылкой (`tel:`). */
  href?: string
}

const buildRows = (lead: Lead): Row[] => {
  const rows: Row[] = [
    { label: 'Имя', value: lead.name },
    {
      label: 'Телефон',
      value: formatPhone(lead.phoneDigits, lead.phone),
      href: `tel:+${lead.phoneDigits}`,
    },
    { label: 'Дверь', value: lead.door },
  ]
  if (lead.comment) rows.push({ label: 'Комментарий', value: lead.comment })
  rows.push({ label: 'Получено', value: formatDate() })
  return rows
}

const renderHtml = (lead: Lead): string => {
  const rows = buildRows(lead)
    .map(({ label, value, href }) => {
      const content = href
        ? `<a href="${escapeHtml(href)}" style="color:#2b2a29;text-decoration:none">${escapeHtml(value)}</a>`
        : escapeHtml(value)
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0ede8;color:#8b8987;font-size:13px;width:150px;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #f0ede8;color:#2b2a29;font-size:15px">${content}</td>
        </tr>`
    })
    .join('')

  return `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:24px;background:#fbfaf8;font-family:'Segoe UI',Arial,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;width:100%;background:#ffffff;border:1px solid #e5e5e5">
      <tr>
        <td style="padding:24px 16px;border-bottom:3px solid #fdb21e">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8b8987">Новая заявка с сайта</div>
          <div style="margin-top:6px;font-size:22px;color:#2b2a29">ООО СК «Пирс»</div>
        </td>
      </tr>
      <tr><td style="padding:8px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">${rows}</table>
      </td></tr>
      <tr>
        <td style="padding:16px;background:#f6f3ee;color:#8b8987;font-size:12px">
          Письмо отправлено автоматически формой «Оставить заявку» на сайте каталога.
        </td>
      </tr>
    </table>
  </body>
</html>`
}

const renderText = (lead: Lead): string =>
  [
    'Новая заявка с сайта ООО СК «Пирс»',
    '',
    ...buildRows(lead).map(({ label, value }) => `${label}: ${value}`),
  ].join('\n')

export class Mailer {
  private readonly transporter: Transporter

  constructor(private readonly config: AppConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      pool: true,
      maxConnections: 2,
    })
  }

  /** Проверяет доступность SMTP-сервера и корректность учётных данных. */
  verify(): Promise<true> {
    return this.transporter.verify() as Promise<true>
  }

  async sendLead(lead: Lead): Promise<void> {
    const { mail, smtp } = this.config

    await this.transporter.sendMail({
      // From обязан совпадать с аутентифицированным ящиком — иначе провайдер
      // отклонит письмо как подделку отправителя.
      from: { name: mail.fromName, address: smtp.user },
      to: mail.to,
      // Копия в ящик, с которого ушла рассылка: заявка остаётся и у отправителя.
      ...(mail.copyToSender && smtp.user !== mail.to ? { cc: smtp.user } : {}),
      // Отвечать «Ответить» будет некуда — у клиента только телефон,
      // поэтому тему делаем самодостаточной.
      subject: `Заявка с сайта: ${lead.door} — ${lead.name}`,
      text: renderText(lead),
      html: renderHtml(lead),
    })
  }
}
