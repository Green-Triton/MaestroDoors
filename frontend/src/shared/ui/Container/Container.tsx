import type { ElementType, ReactNode } from 'react'

import { cn } from '@shared/lib/cn'

import styles from './Container.module.css'

export interface ContainerProps {
  children: ReactNode
  /** Render as a different element, e.g. `section` or `header`. */
  as?: ElementType
  className?: string
}

/** Centres content and applies the page gutter. */
export const Container = ({ children, as: Tag = 'div', className }: ContainerProps) => (
  <Tag className={cn(styles.container, className)}>{children}</Tag>
)
