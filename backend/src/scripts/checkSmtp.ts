/**
 * Проверка почтовой настройки без запуска сервера.
 *
 *   npm run check-smtp            — только соединение и авторизация
 *   npm run check-smtp -- --send  — ещё и отправить тестовую заявку
 */

import { ConfigError, loadConfig } from '../config.js'
import { Mailer } from '../mailer.js'

const main = async (): Promise<void> => {
  const config = loadConfig()
  const mailer = new Mailer(config)

  console.log(`Хост      : ${config.smtp.host}:${config.smtp.port} (secure: ${config.smtp.secure})`)
  console.log(`Отправитель: ${config.smtp.user}`)
  console.log(`Получатель : ${config.mail.to}`)
  console.log(`Копия себе : ${config.mail.copyToSender ? 'да' : 'нет'}\n`)

  await mailer.verify()
  console.log('✓ Соединение и авторизация в порядке.')

  if (process.argv.includes('--send')) {
    await mailer.sendLead({
      name: 'Тестовая заявка',
      phone: '+7 (900) 000-00-00',
      phoneDigits: '79000000000',
      door: 'МСТ-1 «МЕЛАМИН» — проверка настроек',
      comment: 'Письмо отправлено командой npm run check-smtp -- --send.',
    })
    console.log(`✓ Тестовое письмо отправлено на ${config.mail.to}.`)
  } else {
    console.log('\nЧтобы отправить тестовое письмо: npm run check-smtp -- --send')
  }
}

main().catch((error) => {
  if (error instanceof ConfigError) {
    console.error(`\nОшибка конфигурации: ${error.message}\n`)
  } else {
    console.error('\n✗ Проверка не прошла:\n', error instanceof Error ? error.message : error)
  }
  process.exit(1)
})
