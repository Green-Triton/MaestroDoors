import { useMemo, useState } from 'react'

import {
  ALL_COLLECTIONS,
  coverImage,
  doorCollections,
  doorsData,
  filterByCollection,
  type CollectionFilter as CollectionFilterValue,
  type Door,
} from '@entities/door'
import { CollectionFilter } from '@features/filter-doors'
import { RequestQuoteModal } from '@features/request-quote'
import { Container } from '@shared/ui'
import { CatalogGrid } from '@widgets/catalog-grid'
import { DoorDetailsModal } from '@widgets/door-details-modal'
import { Hero } from '@widgets/hero'
import { SiteFooter } from '@widgets/site-footer'
import { SiteHeader } from '@widgets/site-header'

import styles from './CatalogPage.module.css'

/**
 * Единственная страница витрины.
 *
 * Здесь живёт состояние, которое пересекает границы виджетов: выбранная
 * коллекция, открытая модель и форма заявки. Всё остальное передаётся вниз
 * пропсами.
 */
export const CatalogPage = () => {
  const [collectionId, setCollectionId] = useState<CollectionFilterValue>(ALL_COLLECTIONS)
  const [activeDoor, setActiveDoor] = useState<Door | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  /** Модель, из карточки которой открыли форму; `null` — общая заявка. */
  const [requestDoor, setRequestDoor] = useState<Door | null>(null)

  const visibleDoors = useMemo(
    () => filterByCollection(doorsData, collectionId),
    [collectionId],
  )

  const activeCollection = doorCollections.find(
    (collection) => collection.id === activeDoor?.collectionId,
  )
  const selectedCollection = doorCollections.find(
    (collection) => collection.id === collectionId,
  )

  const openRequest = (door: Door | null) => {
    setRequestDoor(door)
    setRequestOpen(true)
  }

  return (
    <>
      <SiteHeader totalCount={doorsData.length} onRequest={() => openRequest(null)} />

      <main>
        <Hero
          cover={coverImage}
          doorCount={doorsData.length}
          collectionCount={doorCollections.length}
        />

        <section className={styles.catalog} id="catalog">
          <Container>
            <header className={styles.head}>
              <div className={styles.headText}>
                <h2 className={styles.title}>Каталог</h2>
                <p className={styles.subtitle}>
                  {selectedCollection?.description ??
                    'Все модели из заводского каталога — от 6 см до моделей с терморазрывом.'}
                </p>
              </div>
              <p className={styles.counter}>
                <span className={styles.counterValue}>{visibleDoors.length}</span>
                {' из '}
                {doorsData.length}
              </p>
            </header>

            <div className={styles.filter}>
              <CollectionFilter
                collections={doorCollections}
                value={collectionId}
                onChange={setCollectionId}
                totalCount={doorsData.length}
              />
            </div>

            <CatalogGrid doors={visibleDoors} onOpen={setActiveDoor} />
          </Container>
        </section>
      </main>

      <SiteFooter onRequest={() => openRequest(null)} />

      <DoorDetailsModal
        door={activeDoor}
        collection={activeCollection}
        onClose={() => setActiveDoor(null)}
        onRequest={openRequest}
      />

      <RequestQuoteModal
        open={requestOpen}
        door={requestDoor}
        onClose={() => setRequestOpen(false)}
      />
    </>
  )
}
