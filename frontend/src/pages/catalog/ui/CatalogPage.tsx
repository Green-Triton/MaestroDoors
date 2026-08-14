import { useMemo, useState } from 'react'

import {
  ALL_COLLECTIONS,
  coverImage,
  doorCollections,
  doorsData,
  filterByCollection,
  getCatalog,
  type CollectionFilter as CollectionFilterValue,
  type Door,
} from '@entities/door'
import { CollectionFilter } from '@features/filter-doors'
import { Container } from '@shared/ui'
import { CatalogGrid } from '@widgets/catalog-grid'
import { DoorDetailsModal } from '@widgets/door-details-modal'
import { Hero } from '@widgets/hero'
import { SiteFooter } from '@widgets/site-footer'
import { SiteHeader } from '@widgets/site-header'

import styles from './CatalogPage.module.css'

/**
 * The single page of the storefront.
 *
 * It owns the two pieces of state that cross widget boundaries — the active
 * collection and the door being inspected — and passes everything else down.
 */
export const CatalogPage = () => {
  const [collectionId, setCollectionId] = useState<CollectionFilterValue>(ALL_COLLECTIONS)
  const [activeDoor, setActiveDoor] = useState<Door | null>(null)

  const catalog = getCatalog()
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

  return (
    <>
      <SiteHeader totalCount={doorsData.length} />

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

      <SiteFooter source={catalog.source} />

      <DoorDetailsModal
        door={activeDoor}
        collection={activeCollection}
        onClose={() => setActiveDoor(null)}
      />
    </>
  )
}
