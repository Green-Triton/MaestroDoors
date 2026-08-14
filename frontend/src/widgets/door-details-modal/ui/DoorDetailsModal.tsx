import { useEffect } from 'react'

import {
  DoorImage,
  DoorSpecList,
  fullImage,
  oppositeView,
  type Door,
  type DoorCollection,
} from '@entities/door'
import { ImageToggle, useDoorView } from '@features/door-view-toggle'
import { CTAButton } from '@features/request-quote'
import { Badge, Modal } from '@shared/ui'

import styles from './DoorDetailsModal.module.css'

export interface DoorDetailsModalProps {
  door: Door | null
  collection?: DoorCollection
  onClose: () => void
}

/**
 * The detail view: enlarged gallery on the left, full specification on the
 * right, call to action underneath.
 */
export const DoorDetailsModal = ({ door, collection, onClose }: DoorDetailsModalProps) => {
  const { view, setView, reset } = useDoorView()

  // Every door opens on its exterior view, whichever side the visitor last
  // looked at on the previous one.
  useEffect(() => {
    if (door) reset()
  }, [door, reset])

  if (!door) return null

  const highlights = [
    { label: 'Полотно', value: door.specs.material },
    { label: 'Уплотнитель', value: door.specs.sealing },
    { label: 'Покрытие', value: door.specs.finish },
    { label: 'Отделка внутри', value: door.specs.interior },
  ].filter((item) => item.value)

  return (
    <Modal open onClose={onClose} title={`${door.title} — ${door.article}`}>
      <div className={styles.layout}>
        {/*
          The column carries the tinted ground so it runs the full height of the
          dialog; the section inside sticks, keeping the door in view while the
          specification scrolls past it.
        */}
        <div className={styles.galleryColumn}>
          <section
            className={styles.gallery}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                setView(oppositeView(view))
              }
            }}
          >
            <div className={styles.stage}>
              <DoorImage door={door} view={view} resolve={fullImage} loading="eager" />
            </div>
            <ImageToggle value={view} onChange={setView} size="md" />
          </section>
        </div>

        <section className={styles.details}>
          <header className={styles.header}>
            {(door.badges.length > 0 || collection) && (
              <div className={styles.tags}>
                {door.badges.map((badge) => (
                  <Badge key={badge} tone={badge === 'Новинка' ? 'accent' : 'neutral'}>
                    {badge}
                  </Badge>
                ))}
                {collection && <span className={styles.collection}>{collection.title}</span>}
              </div>
            )}

            <h2 className={styles.title}>{door.title}</h2>

            <p className={styles.article}>
              Артикул <strong>{door.article}</strong>
              <span className={styles.divider} aria-hidden="true" />
              стр. {door.page} каталога
            </p>

            <p className={styles.description}>{door.description}</p>
          </header>

          {highlights.length > 0 && (
            <ul className={styles.highlights}>
              {highlights.map((item) => (
                <li key={item.label} className={styles.highlight}>
                  <span className={styles.highlightLabel}>{item.label}</span>
                  <span className={styles.highlightValue}>{item.value}</span>
                </li>
              ))}
            </ul>
          )}

          {door.specs.dimensions.length > 0 && (
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Стандартные размеры</h3>
              <ul className={styles.sizes}>
                {door.specs.dimensions.map((size) => (
                  <li key={size} className={styles.size}>
                    {size}
                  </li>
                ))}
              </ul>
              {door.customSizes && <p className={styles.customSizes}>{door.customSizes}</p>}
            </div>
          )}

          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Полная спецификация</h3>
            <DoorSpecList entries={door.specList} />
          </div>

          <CTAButton door={door} className={styles.cta} />
        </section>
      </div>
    </Modal>
  )
}
