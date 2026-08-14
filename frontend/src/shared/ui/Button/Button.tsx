import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@shared/lib/cn'

import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'ghost' | 'quiet'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the width of the container. */
  block?: boolean
  children: ReactNode
}

/**
 * The single button primitive.
 *
 * `primary` is the graphite call to action, `ghost` an outlined secondary and
 * `quiet` a borderless text action.
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      styles.button,
      styles[variant],
      styles[size],
      block && styles.block,
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)
