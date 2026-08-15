/** Статичный контент сайта: реквизиты компании и контакты. */

export const SITE = {
  /** Полное юридическое наименование — копирайт, футер, метатеги. */
  legalName: 'ООО СК «Пирс»',
  /** Короткая форма для шапки и заголовков. */
  brand: 'СК «ПИРС»',
  tagline: 'Входные двери',
  catalogTitle: 'Каталог 2026',
  logo: 'logo.png',
} as const

export interface ContactPerson {
  role: string
  name: string
  /** Отображаемый номер, например «+7 (900) 000-00-00». */
  phone: string
  /** Тот же номер в формате `tel:`. */
  href: string
}

/**
 * Контакты для футера.
 *
 * Пока пусто: блок контактов скрывается сам, а связаться можно через форму
 * заявки. Чтобы включить его — добавьте сюда записи, разметка уже готова.
 */
export const CONTACTS: readonly ContactPerson[] = []

/**
 * Номер в шапке. Пока контактов нет — там кнопка «Оставить заявку».
 */
export const PRIMARY_CONTACT: ContactPerson | undefined = CONTACTS[0]
