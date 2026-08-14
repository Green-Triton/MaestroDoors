/**
 * Access to the generated catalogue dataset.
 *
 * The JSON under `shared/api/catalog` is produced by `parser/run.py` straight
 * from the PDF and is never edited by hand. It is imported rather than fetched
 * so the catalogue is type-checked at build time and needs no backend; swapping
 * in a real API later means changing only this module.
 */

import rawCatalog from '@shared/api/catalog/doors.data.json'

import type { Catalog, Door, DoorCollection } from '../model/types'

const catalog = rawCatalog as Catalog

/** The full dataset, including provenance metadata. */
export const getCatalog = (): Catalog => catalog

/**
 * Every door in the catalogue, in printed order.
 *
 * Exported under this name because it is the array the storefront is built
 * around — the grid, the filters and the modal all read from it.
 */
export const doorsData: readonly Door[] = catalog.doors

/** Catalogue sections, ordered from the thinnest range to the thermal break. */
export const doorCollections: readonly DoorCollection[] = catalog.collections

/** The lifestyle photograph from the catalogue cover. */
export const coverImage: string = catalog.cover
