import type { Door, DoorCollection, DoorView } from './types'

/**
 * Селекторы возвращают пути как есть.
 *
 * Базовый путь сборки подставляется один раз в `api/catalogApi.ts`, когда
 * датасет загружается. Делать это ещё и здесь нельзя: префикс применится
 * дважды и получится `/base/base/doors/...`.
 */

/** Sentinel collection id meaning "no filter applied". */
export const ALL_COLLECTIONS = 'all' as const

export type CollectionFilter = typeof ALL_COLLECTIONS | DoorCollection['id']

/** Narrow the catalogue to one section. */
export const filterByCollection = (
  doors: readonly Door[],
  collectionId: CollectionFilter,
): Door[] =>
  collectionId === ALL_COLLECTIONS
    ? [...doors]
    : doors.filter((door) => door.collectionId === collectionId)

/** Адрес картинки для сетки. */
export const cardImage = (door: Door, view: DoorView): string =>
  view === 'front' ? door.images.frontCard : door.images.backCard

/** Адрес картинки для модального окна. */
export const fullImage = (door: Door, view: DoorView): string =>
  view === 'front' ? door.images.front : door.images.back

/** Human label for a view, used on the toggle and as alt text. */
export const viewLabel = (view: DoorView): string =>
  view === 'front' ? 'Снаружи' : 'Внутри'

/** The other view — used by the toggle and by keyboard navigation. */
export const oppositeView = (view: DoorView): DoorView =>
  view === 'front' ? 'back' : 'front'

/**
 * A short one-line summary for the card: the leaf thickness and the sealing
 * count are what buyers compare first.
 *
 * Only the leading clause of the sealing value is used — the catalogue often
 * appends the seal's part number ("2 контура. YJ-302"), which is noise on a
 * tile and is still shown in full in the modal.
 */
export const cardSummary = (door: Door): string =>
  [door.series, door.specs.sealing.split('.')[0].trim()].filter(Boolean).join(' · ')