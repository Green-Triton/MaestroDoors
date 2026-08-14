import { useEffect, useRef, useState } from 'react'

import type { Door } from '@entities/door'
import { Button } from '@shared/ui'

import styles from './CTAButton.module.css'

type RequestState = 'idle' | 'pending' | 'sent'

export interface CTAButtonProps {
  door: Door
  className?: string
}

const RESET_DELAY = 2600
const PENDING_DELAY = 550

/**
 * "Оставить заявку" — the primary call to action in the modal.
 *
 * There is no backend yet, so this is deliberately UI only: it logs the request
 * payload and walks through pending → sent → idle. The shape of the logged
 * object is the contract a real endpoint would receive, so wiring it up later
 * means replacing the timeout with a fetch and nothing else.
 */
export const CTAButton = ({ door, className }: CTAButtonProps) => {
  const [state, setState] = useState<RequestState>('idle')
  const timers = useRef<number[]>([])

  // Clear pending timers on unmount — the modal can close mid-transition.
  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout)
      timers.current = []
    },
    [],
  )

  const handleClick = () => {
    if (state !== 'idle') return

    const payload = {
      doorId: door.id,
      article: door.article,
      title: door.title,
      collectionId: door.collectionId,
      requestedAt: new Date().toISOString(),
    }

    console.log('[MaestroDoors] Заявка на модель:', payload)

    setState('pending')
    timers.current.push(
      window.setTimeout(() => setState('sent'), PENDING_DELAY),
      window.setTimeout(() => setState('idle'), PENDING_DELAY + RESET_DELAY),
    )
  }

  const label =
    state === 'pending' ? 'Отправляем…' : state === 'sent' ? 'Заявка принята' : 'Оставить заявку'

  return (
    <div className={className}>
      <Button
        size="lg"
        block
        onClick={handleClick}
        disabled={state !== 'idle'}
        aria-live="polite"
      >
        {state === 'sent' && (
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path
              d="m4 10.5 4 4 8-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            />
          </svg>
        )}
        {label}
      </Button>

      <p className={styles.note}>
        {state === 'sent'
          ? 'Менеджер свяжется с вами в ближайшее время.'
          : 'Мы перезвоним и уточним размеры, комплектацию и сроки.'}
      </p>
    </div>
  )
}
