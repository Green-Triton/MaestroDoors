import { cn } from '@shared/lib/cn'

import styles from './SegmentedControl.module.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  /** Names the group for screen readers. */
  label: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * A two-or-more way switch with a sliding indicator.
 *
 * Rendered as a radio group rather than buttons so that arrow keys move between
 * the options and assistive technology announces the current selection.
 */
export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedControlProps<T>) => {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(styles.root, styles[size], className)}
      style={{ '--count': options.length, '--active': activeIndex } as React.CSSProperties}
    >
      <span className={styles.indicator} aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          className={cn(styles.option, option.value === value && styles.active)}
          onClick={(event) => {
            // The control sits inside a clickable card; selecting a view must
            // not also open the modal.
            event.stopPropagation()
            onChange(option.value)
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
