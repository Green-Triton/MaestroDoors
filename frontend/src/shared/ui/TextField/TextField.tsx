import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

import { cn } from '@shared/lib/cn'

import styles from './TextField.module.css'

interface BaseProps {
  label: string
  /** Сообщение об ошибке; подсвечивает поле и связывается с ним для читалок. */
  error?: string
  /** Пояснение под полем, когда ошибки нет. */
  hint?: string
  className?: string
}

export type TextFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    multiline?: false
  }

export type TextAreaFieldProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
    multiline: true
  }

/**
 * Поле ввода с подписью и сообщением об ошибке.
 *
 * Ошибка связывается с полем через `aria-describedby`, а не просто рисуется
 * рядом: иначе читалка объявит поле «телефон» и умолчит о том, что в нём не
 * так.
 */
export const TextField = (props: TextFieldProps | TextAreaFieldProps) => {
  const generatedId = useId()
  const { label, error, hint, className, multiline, id, ...rest } = props as BaseProps & {
    multiline?: boolean
    id?: string
  } & Record<string, unknown>

  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`
  const message = error ?? hint

  const shared = {
    id: fieldId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': message ? messageId : undefined,
    className: cn(styles.control, error && styles.invalid),
  } as const

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>

      {multiline ? (
        <textarea
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...shared}
          className={cn(shared.className, styles.textarea)}
        />
      ) : (
        <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...shared} />
      )}

      {message && (
        <p id={messageId} className={cn(styles.message, error && styles.errorMessage)}>
          {message}
        </p>
      )}
    </div>
  )
}
