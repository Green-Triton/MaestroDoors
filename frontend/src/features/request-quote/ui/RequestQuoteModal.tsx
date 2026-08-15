import { useEffect, useState, type FormEvent } from 'react'

import type { Door } from '@entities/door'
import { formatRuPhone } from '@shared/lib/phone'
import { Button, Modal, TextField } from '@shared/ui'

import { sendLead } from '../api/sendLead'
import { EMPTY_FORM, type LeadErrors, type LeadFormValues } from '../model/types'
import { validateForm } from '../model/validation'

import styles from './RequestQuoteModal.module.css'

export interface RequestQuoteModalProps {
  open: boolean
  /** Модель, из карточки которой открыли форму. `null` — общая заявка. */
  door: Door | null
  onClose: () => void
}

type Status = 'idle' | 'sending' | 'sent'

/** Как модель попадёт в письмо. */
const describeDoor = (door: Door | null): string =>
  door ? `${door.title} (${door.article})${door.series ? `, ${door.series}` : ''}` : ''

export const RequestQuoteModal = ({ open, door, onClose }: RequestQuoteModalProps) => {
  const [values, setValues] = useState<LeadFormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<LeadErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [formError, setFormError] = useState('')

  // Форма живёт всё время, поэтому её нужно готовить при каждом открытии:
  // подставить выбранную дверь и убрать следы прошлой отправки.
  useEffect(() => {
    if (!open) return
    setValues({ ...EMPTY_FORM, door: describeDoor(door) })
    setErrors({})
    setFormError('')
    setStatus('idle')
  }, [open, door])

  const update = (field: keyof LeadFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Ошибку убираем сразу, как человек начал править поле: держать её до
    // повторной отправки — значит ругаться на уже исправленное.
    setErrors((prev) => (prev[field as keyof LeadErrors] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (status !== 'idle') return

    const found = validateForm(values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setStatus('sending')
    setFormError('')

    const result = await sendLead(values)

    if (result.ok) {
      setStatus('sent')
      return
    }

    setStatus('idle')
    setErrors(result.errors ?? {})
    setFormError(result.message ?? 'Не удалось отправить заявку.')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Оставить заявку"
      layer="top"
      className={styles.panel}
    >
      {status === 'sent' ? (
        <div className={styles.done}>
          <span className={styles.doneMark} aria-hidden="true">
            <svg viewBox="0 0 32 32" width="26" height="26">
              <path
                d="m8 16.5 5.5 5.5L24 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </svg>
          </span>
          <h2 className={styles.doneTitle}>Заявка отправлена</h2>
          <p className={styles.doneText}>
            Спасибо, {values.name.trim()}. Менеджер свяжется с вами по номеру{' '}
            <span className={styles.donePhone}>{values.phone}</span> и уточнит размеры,
            комплектацию и сроки.
          </p>
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <header className={styles.header}>
            <h2 className={styles.title}>Оставить заявку</h2>
            <p className={styles.subtitle}>
              Перезвоним, уточним размеры и комплектацию, рассчитаем стоимость.
            </p>
          </header>

          <div className={styles.fields}>
            <TextField
              label="Как к вам обращаться"
              name="name"
              autoComplete="name"
              placeholder="Иван"
              value={values.name}
              error={errors.name}
              disabled={status === 'sending'}
              onChange={(event) => update('name', event.target.value)}
            />

            <TextField
              label="Телефон"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 (900) 000-00-00"
              value={values.phone}
              error={errors.phone}
              disabled={status === 'sending'}
              onChange={(event) => update('phone', formatRuPhone(event.target.value))}
              onFocus={() => {
                if (!values.phone) update('phone', '+7 ')
              }}
            />

            <TextField
              label="Дверь"
              name="door"
              placeholder="Модель, артикул или пожелания"
              hint={
                door
                  ? 'Подставлено из карточки — можно изменить.'
                  : 'Например: МД-10 «СБ-ЛАЙН-3» или «нужна дверь с терморазрывом».'
              }
              value={values.door}
              error={errors.door}
              disabled={status === 'sending'}
              onChange={(event) => update('door', event.target.value)}
            />

            <TextField
              multiline
              label="Комментарий (необязательно)"
              name="comment"
              placeholder="Размер проёма, сторона открывания, удобное время звонка"
              value={values.comment}
              error={errors.comment}
              disabled={status === 'sending'}
              onChange={(event) => update('comment', event.target.value)}
            />

            {/*
              Ловушка для ботов: скрыта от людей и от читалок, но остаётся в
              DOM, чтобы автозаполнялки её нашли. Заполненное поле — признак
              робота, сервер такую заявку отбрасывает.
            */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className={styles.trap}
              value={values.website}
              onChange={(event) => update('website', event.target.value)}
            />
          </div>

          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}

          <div className={styles.actions}>
            <Button type="submit" size="lg" block disabled={status === 'sending'}>
              {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
            </Button>
            <p className={styles.consent}>
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
            </p>
          </div>
        </form>
      )}
    </Modal>
  )
}
