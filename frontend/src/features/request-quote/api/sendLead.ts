import { phoneDigits } from '@shared/lib/phone'

import type { LeadFormValues, LeadResponse } from '../model/types'

/**
 * Адрес API.
 *
 * В разработке пусто — запрос идёт на `/api/...` и Vite проксирует его на
 * бэкенд. В продакшене фронтенд и бэкенд обычно живут на разных доменах
 * (статика на GitHub Pages, сервер — отдельно), поэтому базовый адрес задаётся
 * переменной `VITE_API_URL` при сборке.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const NETWORK_ERROR =
  'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.'

export const sendLead = async (values: LeadFormValues): Promise<LeadResponse> => {
  let response: Response

  try {
    response = await fetch(`${API_BASE}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name.trim(),
        // Сервер всё равно нормализует номер, но отправить его в предсказуемом
        // виде дешевле, чем разбирать маску на той стороне.
        phone: `+${phoneDigits(values.phone)}`,
        door: values.door.trim(),
        comment: values.comment.trim(),
        website: values.website,
      }),
    })
  } catch {
    return { ok: false, message: NETWORK_ERROR }
  }

  // Сервер за прокси может ответить HTML-страницей ошибки — на такой ответ
  // `response.json()` бросит исключение, и форма зависнет без объяснений.
  let payload: LeadResponse
  try {
    payload = (await response.json()) as LeadResponse
  } catch {
    return {
      ok: false,
      message: response.ok ? NETWORK_ERROR : 'Сервер вернул неожиданный ответ.',
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      message: payload.message ?? 'Не удалось отправить заявку.',
      errors: payload.errors,
    }
  }

  return payload
}
