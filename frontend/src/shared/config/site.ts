/**
 * Static site content.
 *
 * The contact details are transcribed from the back cover of
 * "Каталог MaestroDoors ИЮЛЬ.pdf".
 */

export const SITE = {
  brand: 'MAESTRODOORS',
  tagline: 'Входные двери',
  catalogTitle: 'Каталог 2026',
} as const

export interface ContactPerson {
  role: string
  name: string
  phone: string
  /** `tel:` form of `phone`. */
  href: string
}

export const CONTACTS: readonly ContactPerson[] = [
  {
    role: 'Менеджер по работе с ключевыми клиентами',
    name: 'Анна',
    phone: '+7 (917) 719-23-33',
    href: 'tel:+79177192333',
  },
  {
    role: 'Менеджер по работе с ключевыми клиентами',
    name: 'Алеся',
    phone: '+7 (909) 470-22-42',
    href: 'tel:+79094702242',
  },
  {
    role: 'Руководитель отдела продаж',
    name: 'Роман Муралев',
    phone: '+7 (920) 02-99-300',
    href: 'tel:+79200299300',
  },
]

// export const CONTACTS: readonly ContactPerson[] = [
//   {
//     role: '',
//     name: '',
//     phone: '',
//     href: '',
//   },
//   {
//     role: '',
//     name: '',
//     phone: '',
//     href: '',
//   },
//   {
//     role: '',
//     name: '',
//     phone: '',
//     href: '',
//   },
// ]

/** The number shown in the header. */
export const PRIMARY_CONTACT = CONTACTS[2]
