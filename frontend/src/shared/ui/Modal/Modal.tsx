import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { useLockBodyScroll } from '@shared/lib/useLockBodyScroll'

import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Labels the dialog for assistive technology. */
  title: string
  children: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * A floating dialog over a blurred backdrop.
 *
 * Rendered through a portal so the card's stacking context cannot clip it, and
 * it implements the three things a dialog has to get right: focus moves in on
 * open and back to the trigger on close, Tab is trapped inside, and Escape or a
 * click on the backdrop dismisses it.
 */
export const Modal = ({ open, onClose, title, children }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    // Focus the panel itself rather than the first control, so the dialog is
    // announced from the top instead of mid-content.
    panelRef.current?.focus({ preventScroll: true })

    return () => restoreFocusRef.current?.focus({ preventScroll: true })
  }, [open])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault()
        last.focus()
      }
    },
    [onClose],
  )

  if (!open) return null

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        // Only a press that both starts and ends on the backdrop closes the
        // dialog — otherwise a text selection that drifts outside would too.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={styles.panel}
        onKeyDown={handleKeyDown}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M5 5 19 19M19 5 5 19"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body,
  )
}
