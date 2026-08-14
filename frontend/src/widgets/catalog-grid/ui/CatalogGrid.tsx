import { DoorCard, type Door } from '@entities/door'
import { ImageToggle, useDoorView } from '@features/door-view-toggle'

import styles from './CatalogGrid.module.css'

/** How many tiles load eagerly — roughly the first desktop row. */
const EAGER_COUNT = 4

export interface CatalogGridProps {
  doors: readonly Door[]
  onOpen: (door: Door) => void
}

/**
 * One tile. Extracted so each card can own its own view state via a hook —
 * hooks cannot be called inside a `map`.
 */
const CatalogGridItem = ({
  door,
  index,
  onOpen,
}: {
  door: Door
  index: number
  onOpen: (door: Door) => void
}) => {
  const { view, setView } = useDoorView()

  return (
    <li className={styles.cell}>
      <DoorCard
        door={door}
        view={view}
        onOpen={onOpen}
        priority={index < EAGER_COUNT}
        viewToggle={<ImageToggle value={view} onChange={setView} />}
      />
    </li>
  )
}

/**
 * The product grid: four across on the desktop, stepping down to a single
 * column on phones.
 */
export const CatalogGrid = ({ doors, onOpen }: CatalogGridProps) => {
  if (doors.length === 0) {
    return (
      <p className={styles.empty} id="catalog-grid" role="tabpanel">
        В этой коллекции пока нет моделей.
      </p>
    )
  }

  return (
    <ul className={styles.grid} id="catalog-grid" role="tabpanel">
      {doors.map((door, index) => (
        <CatalogGridItem key={door.id} door={door} index={index} onOpen={onOpen} />
      ))}
    </ul>
  )
}
