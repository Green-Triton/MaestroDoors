/**
 * Ограничение частоты запросов, в памяти процесса.
 *
 * Два независимых счётчика, и это важно:
 *
 * - **отправки** — сколько писем ушло с адреса. Считается только успешная
 *   отправка. Если считать все запросы подряд, клиент, дважды опечатавшийся
 *   в номере телефона, сожжёт квоту на ошибках валидации и не сможет отправить
 *   исправленную заявку.
 * - **запросы** — общий поток с адреса, лимит заметно выше. Нужен, чтобы поток
 *   заведомо некорректных запросов не превратился в нагрузку.
 *
 * Отдельная зависимость здесь избыточна: счётчиков немного, а при перезапуске
 * их не жалко. Если приложение поедет в несколько инстансов, счётчики нужно
 * будет вынести в общее хранилище.
 */

import type { Request, RequestHandler } from 'express'

interface Bucket {
  count: number
  resetAt: number
}

/** Во сколько раз общий лимит запросов выше лимита отправок. */
const REQUEST_BUDGET_FACTOR = 8

class Counter {
  private readonly buckets = new Map<string, Bucket>()

  constructor(
    private readonly windowMs: number,
    private readonly max: number,
  ) {
    // Периодическая уборка, чтобы карта не росла от разовых визитов.
    const sweep = setInterval(() => {
      const now = Date.now()
      for (const [key, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(key)
      }
    }, windowMs)
    sweep.unref()
  }

  /** Лимит уже выбран? Счётчик при этом не меняется. */
  isExhausted(key: string): boolean {
    const bucket = this.buckets.get(key)
    return bucket !== undefined && bucket.resetAt > Date.now() && bucket.count >= this.max
  }

  /** Сколько секунд до сброса окна. */
  retryAfter(key: string): number {
    const bucket = this.buckets.get(key)
    if (!bucket) return 0
    return Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000))
  }

  hit(key: string): void {
    const now = Date.now()
    const bucket = this.buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs })
      return
    }
    bucket.count += 1
  }
}

export interface RateLimiter {
  /** Ставится перед обработчиком: отклоняет запрос, если лимит уже выбран. */
  guard: RequestHandler
  /** Вызывается после успешной отправки — только она расходует квоту. */
  consume: (req: Request) => void
}

const keyOf = (req: Request): string => req.ip ?? 'unknown'

export const createRateLimit = (windowMs: number, max: number): RateLimiter => {
  const sends = new Counter(windowMs, max)
  const requests = new Counter(windowMs, max * REQUEST_BUDGET_FACTOR)

  const guard: RequestHandler = (req, res, next) => {
    const key = keyOf(req)

    if (sends.isExhausted(key) || requests.isExhausted(key)) {
      const retryAfter = Math.max(sends.retryAfter(key), requests.retryAfter(key))
      res.setHeader('Retry-After', String(retryAfter))
      res.status(429).json({
        ok: false,
        message: 'Слишком много заявок подряд. Попробуйте через несколько минут.',
      })
      return
    }

    requests.hit(key)
    next()
  }

  return { guard, consume: (req) => sends.hit(keyOf(req)) }
}
