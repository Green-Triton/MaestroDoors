/**
 * Проверка заявки на стороне сервера.
 *
 * Клиентская валидация — это удобство, а не защита: запрос можно отправить в
 * обход формы. Поэтому те же правила продублированы здесь, и наружу уходит
 * только то, что прошло проверку.
 */

export interface LeadInput {
  name: string
  phone: string
  door: string
  comment?: string
  /** Поле-ловушка: люди его не видят и не заполняют, боты заполняют. */
  website?: string
}

export interface Lead {
  name: string
  /** Номер как ввёл человек. */
  phone: string
  /** Только цифры — для CRM и клика по «позвонить». */
  phoneDigits: string
  door: string
  comment: string
}

export type FieldErrors = Partial<Record<'name' | 'phone' | 'door' | 'comment', string>>

export interface ValidationResult {
  ok: boolean
  lead?: Lead
  errors: FieldErrors
  /** Ловушка сработала — отвечаем «успешно», но ничего не отправляем. */
  trapped?: boolean
}

const LIMITS = {
  name: { min: 2, max: 80 },
  door: { min: 2, max: 200 },
  comment: { max: 600 },
} as const

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

/** Оставляет только цифры и приводит 8XXXXXXXXXX к 7XXXXXXXXXX. */
export const digitsOf = (phone: string): string => {
  const digits = clean(phone).replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`
  return digits
}

export const validateLead = (input: unknown): ValidationResult => {
  const errors: FieldErrors = {}
  const body = (input ?? {}) as Record<string, unknown>

  if (clean(body.website)) {
    return { ok: false, errors: {}, trapped: true }
  }

  const name = clean(body.name)
  if (name.length < LIMITS.name.min) {
    errors.name = 'Укажите имя — как к вам обращаться.'
  } else if (name.length > LIMITS.name.max) {
    errors.name = `Имя длиннее ${LIMITS.name.max} символов.`
  }

  const phone = clean(body.phone)
  const phoneDigits = digitsOf(phone)
  // Российский номер — 11 цифр, начинается с 7. Иностранные допускаем от 10 до 15
  // цифр по E.164, чтобы не отсечь клиента с зарубежным номером.
  const isRussian = phoneDigits.length === 11 && phoneDigits.startsWith('7')
  const isInternational = phoneDigits.length >= 10 && phoneDigits.length <= 15
  if (!phoneDigits) {
    errors.phone = 'Укажите телефон для связи.'
  } else if (!isRussian && !isInternational) {
    errors.phone = 'Проверьте номер: нужно 11 цифр, например +7 (900) 000-00-00.'
  }

  const door = clean(body.door)
  if (door.length < LIMITS.door.min) {
    errors.door = 'Укажите модель или артикул двери.'
  } else if (door.length > LIMITS.door.max) {
    errors.door = `Описание длиннее ${LIMITS.door.max} символов.`
  }

  const comment = clean(body.comment)
  if (comment.length > LIMITS.comment.max) {
    errors.comment = `Комментарий длиннее ${LIMITS.comment.max} символов.`
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    errors: {},
    lead: { name, phone, phoneDigits, door, comment },
  }
}
