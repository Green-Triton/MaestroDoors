import { useState } from 'react'

import { cn } from '@shared/lib/cn'

import type { Door, DoorView } from '../../model/types'
import { viewLabel } from '../../model/selectors'

import styles from './DoorImage.module.css'

export interface DoorImageProps {
  door: Door
  view: DoorView
  /** Resolver for the URL, so the card and the modal can pick their own size. */
  resolve: (door: Door, view: DoorView) => string
  /** `eager` for the first rows of the grid, `lazy` below the fold. */
  loading?: 'eager' | 'lazy'
  className?: string
}

/**
 * Both views of a door, cross-faded.
 *
 * Both images stay mounted and are switched by opacity, so flipping a card is
 * instant after the first load and never flashes an empty frame. The parser
 * renders the two views onto one canvas geometry, so nothing shifts in the
 * transition.
 */
export const DoorImage = ({
  door,
  view,
  resolve,
  loading = 'lazy',
  className,
}: DoorImageProps) => {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cn(styles.frame, loaded && styles.ready, className)}>
      {(['front', 'back'] as const).map((side) => (
        <img
          key={side}
          src={resolve(door, side)}
          alt={`${door.title} (${door.article}) — вид ${viewLabel(side).toLowerCase()}`}
          loading={side === view ? loading : 'lazy'}
          decoding="async"
          draggable={false}
          className={cn(styles.image, side === view && styles.visible)}
          onLoad={side === view ? () => setLoaded(true) : undefined}
        />
      ))}
    </div>
  )
}
