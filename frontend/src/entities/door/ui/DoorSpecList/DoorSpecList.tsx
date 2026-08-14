import type { DoorSpecEntry } from '../../model/types'

import styles from './DoorSpecList.module.css'

export interface DoorSpecListProps {
  entries: readonly DoorSpecEntry[]
}

/**
 * The full printed specification as a description list.
 *
 * `dl`/`dt`/`dd` is the honest markup for label–value pairs and gives screen
 * readers the pairing for free.
 */
export const DoorSpecList = ({ entries }: DoorSpecListProps) => (
  <dl className={styles.list}>
    {entries.map((entry) => (
      <div key={entry.label} className={styles.row}>
        <dt className={styles.label}>{entry.label}</dt>
        <dd className={styles.value}>{entry.value}</dd>
      </div>
    ))}
  </dl>
)
