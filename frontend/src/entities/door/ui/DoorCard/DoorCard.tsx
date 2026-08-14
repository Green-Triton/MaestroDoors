import type { ReactNode } from 'react'

import { Badge } from '@shared/ui'

import { cardImage, cardSummary } from '../../model/selectors'
import type { Door, DoorView } from '../../model/types'
import { DoorImage } from '../DoorImage/DoorImage'

import styles from './DoorCard.module.css'

export interface DoorCardProps {
  door: Door
  view: DoorView
  onOpen: (door: Door) => void
  /**
   * The front/back switch, supplied by the caller.
   *
   * The switch is a feature and features sit above entities, so the card takes
   * it as a slot instead of importing it — that keeps the dependency pointing
   * down through the layers.
   */
  viewToggle?: ReactNode
  /** `eager` for the first rows so the grid paints without a flash. */
  priority?: boolean
}

/**
 * One product tile.
 *
 * The whole tile is the click target, as the brief requires. It is an `article`
 * with a real button inside rather than a clickable `div`, so the keyboard and
 * screen readers get a proper control while the large surface stays clickable.
 */
export const DoorCard = ({
  door,
  view,
  onOpen,
  viewToggle,
  priority = false,
}: DoorCardProps) => {
  const summary = cardSummary(door)

  return (
    <article className={styles.card} onClick={() => onOpen(door)}>
      <div className={styles.media}>
        <DoorImage
          door={door}
          view={view}
          resolve={cardImage}
          loading={priority ? 'eager' : 'lazy'}
        />

        {door.badges.length > 0 && (
          <div className={styles.badges}>
            {door.badges.map((badge) => (
              <Badge key={badge} tone={badge === 'Новинка' ? 'accent' : 'neutral'}>
                {badge}
              </Badge>
            ))}
          </div>
        )}

        {viewToggle && <div className={styles.toggle}>{viewToggle}</div>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <button
            type="button"
            className={styles.trigger}
            onClick={(event) => {
              // The wrapper already handles the click; stop it here so the
              // handler does not run twice.
              event.stopPropagation()
              onOpen(door)
            }}
          >
            {door.title}
            <span className={styles.srHint}> — открыть характеристики</span>
          </button>
        </h3>

        <p className={styles.meta}>
          <span className={styles.article}>{door.article}</span>
          {summary && <span className={styles.summary}>{summary}</span>}
        </p>
      </div>
    </article>
  )
}
