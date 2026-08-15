/** Ввод и форматирование российских телефонных номеров. */

/**
 * Приводит любой ввод к маске «+7 (900) 000-00-00».
 *
 * Форматируется всё, что человек уже успел набрать, поэтому функция безопасна
 * для вызова на каждое нажатие клавиши. Ведущая 8 и лишняя 7 схлопываются:
 * люди диктуют номер и так, и так.
 */
export const formatRuPhone = (input: string): string => {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (!digits.startsWith('7')) digits = `7${digits}`
  digits = digits.slice(0, 11)

  const rest = digits.slice(1)
  if (rest.length === 0) return '+7 '

  const parts = [
    rest.slice(0, 3),
    rest.slice(3, 6),
    rest.slice(6, 8),
    rest.slice(8, 10),
  ].filter(Boolean)

  let out = `+7 (${parts[0]}`
  if (rest.length >= 3) out += ')'
  if (parts[1]) out += ` ${parts[1]}`
  if (parts[2]) out += `-${parts[2]}`
  if (parts[3]) out += `-${parts[3]}`
  return out
}

/** Только цифры — то, что уходит на сервер и в CRM. */
export const phoneDigits = (input: string): string => {
  const digits = input.replace(/\D/g, '')
  return digits.startsWith('8') && digits.length === 11 ? `7${digits.slice(1)}` : digits
}

/** Номер набран полностью (11 цифр). */
export const isCompleteRuPhone = (input: string): boolean =>
  phoneDigits(input).length === 11
