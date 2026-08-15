import { Router } from 'express'

import type { AppConfig } from '../config.js'
import type { Mailer } from '../mailer.js'
import { createRateLimit } from '../rateLimit.js'
import { validateLead } from '../validation.js'

export const createLeadsRouter = (config: AppConfig, mailer: Mailer): Router => {
  const router = Router()
  const limiter = createRateLimit(config.rateLimit.windowMs, config.rateLimit.max)

  router.post('/leads', limiter.guard, async (req, res) => {
    const result = validateLead(req.body)

    // Ловушка для ботов: отвечаем как при успехе, но письмо не отправляем.
    // Явная ошибка только подсказала бы, какое поле обходить.
    if (result.trapped) {
      res.json({ ok: true })
      return
    }

    if (!result.ok || !result.lead) {
      res.status(400).json({
        ok: false,
        message: 'Проверьте заполнение формы.',
        errors: result.errors,
      })
      return
    }

    try {
      await mailer.sendLead(result.lead)
      // Квоту расходует только состоявшаяся отправка: ошибки валидации не
      // должны лишать человека возможности исправить опечатку.
      limiter.consume(req)
      res.json({ ok: true })
    } catch (error) {
      // В лог — подробности, клиенту — общая фраза: детали SMTP наружу
      // отдавать нельзя.
      console.error('[leads] не удалось отправить письмо:', error)
      res.status(502).json({
        ok: false,
        message: 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.',
      })
    }
  })

  return router
}
