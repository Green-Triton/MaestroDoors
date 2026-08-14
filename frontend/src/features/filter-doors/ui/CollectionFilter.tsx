import {
  ALL_COLLECTIONS,
  type CollectionFilter as CollectionFilterValue,
  type DoorCollection,
} from '@entities/door'
import { cn } from '@shared/lib/cn'

import styles from './CollectionFilter.module.css'

export interface CollectionFilterProps {
  collections: readonly DoorCollection[]
  value: CollectionFilterValue
  onChange: (value: CollectionFilterValue) => void
  /** Number of doors in the whole catalogue, shown on the "all" chip. */
  totalCount: number
}

/**
 * Section chips above the grid.
 *
 * Rendered as a tab list: the grid below is the panel these chips control, and
 * the roles let arrow-key users move through them the way they expect.
 */
export const CollectionFilter = ({
  collections,
  value,
  onChange,
  totalCount,
}: CollectionFilterProps) => {
  const options: Array<{ id: CollectionFilterValue; title: string; count: number }> = [
    { id: ALL_COLLECTIONS, title: 'Все модели', count: totalCount },
    ...collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      count: collection.count,
    })),
  ]

  return (
    <div className={styles.scroller}>
      <div role="tablist" aria-label="Коллекции" className={styles.list}>
        {options.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              id={`collection-tab-${option.id}`}
              aria-selected={selected}
              aria-controls="catalog-grid"
              tabIndex={selected ? 0 : -1}
              className={cn(styles.chip, selected && styles.selected)}
              onClick={() => onChange(option.id)}
            >
              {option.title}
              <span className={styles.count}>{option.count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
