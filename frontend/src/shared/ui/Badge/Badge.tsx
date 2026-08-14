import type { ReactNode } from 'react'

import { cn } from '@shared/lib/cn'

import styles from './Badge.module.css'

export type BadgeTone = 'accent' | 'neutral'

export interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

/**
 * A small status label.
 *
 * `accent` carries the brand amber and is reserved for "Новинка"; anything else
 * stays neutral so a card never turns into a wall of colour.
 */
export const Badge = ({ children, tone = 'neutral', className }: BadgeProps) => (
  <span className={cn(styles.badge, styles[tone], className)}>{children}</span>
)
