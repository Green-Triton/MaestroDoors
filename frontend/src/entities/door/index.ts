/** Public API of the `door` entity. Nothing outside reaches past this file. */

export { coverImage, doorCollections, doorsData, getCatalog } from './api/catalogApi'

export {
  ALL_COLLECTIONS,
  cardImage,
  cardSummary,
  filterByCollection,
  fullImage,
  oppositeView,
  viewLabel,
} from './model/selectors'
export type { CollectionFilter } from './model/selectors'

export type {
  Catalog,
  Door,
  DoorCollection,
  DoorImages,
  DoorSpecEntry,
  DoorSpecs,
  DoorView,
} from './model/types'

export { DoorCard } from './ui/DoorCard/DoorCard'
export type { DoorCardProps } from './ui/DoorCard/DoorCard'

export { DoorImage } from './ui/DoorImage/DoorImage'
export type { DoorImageProps } from './ui/DoorImage/DoorImage'

export { DoorSpecList } from './ui/DoorSpecList/DoorSpecList'
export type { DoorSpecListProps } from './ui/DoorSpecList/DoorSpecList'
