export interface LeadFormValues {
  name: string
  phone: string
  door: string
  comment: string
  /**
   * Поле-ловушка. Оно скрыто от людей, но автозаполнялки ботов его находят;
   * если оно пришло непустым, сервер молча отбрасывает заявку.
   */
  website: string
}

export type LeadField = keyof Omit<LeadFormValues, 'website'>

export type LeadErrors = Partial<Record<LeadField, string>>

export interface LeadResponse {
  ok: boolean
  message?: string
  errors?: LeadErrors
}

export const EMPTY_FORM: LeadFormValues = {
  name: '',
  phone: '',
  door: '',
  comment: '',
  website: '',
}
