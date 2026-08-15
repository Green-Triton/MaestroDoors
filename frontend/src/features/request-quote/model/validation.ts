import { isCompleteRuPhone } from '@shared/lib/phone'

import type { LeadErrors, LeadFormValues } from './types'

/**
 * Проверка формы перед отправкой.
 *
 * Те же правила продублированы на сервере — здесь они нужны, чтобы человек
 * узнал об опечатке сразу, а не после запроса.
 */
export const validateForm = (values: LeadFormValues): LeadErrors => {
  const errors: LeadErrors = {}

  const name = values.name.trim()
  if (name.length < 2) {
    errors.name = 'Как к вам обращаться?'
  } else if (name.length > 80) {
    errors.name = 'Слишком длинное имя.'
  }

  if (!values.phone.replace(/\D/g, '')) {
    errors.phone = 'Укажите телефон для связи.'
  } else if (!isCompleteRuPhone(values.phone)) {
    errors.phone = 'Номер набран не полностью.'
  }

  const door = values.door.trim()
  if (door.length < 2) {
    errors.door = 'Укажите модель или артикул двери.'
  } else if (door.length > 200) {
    errors.door = 'Слишком длинное описание.'
  }

  if (values.comment.trim().length > 600) {
    errors.comment = 'Комментарий длиннее 600 символов.'
  }

  return errors
}
