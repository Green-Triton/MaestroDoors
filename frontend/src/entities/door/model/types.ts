/**
 * Catalogue domain model.
 *
 * Mirrors the dataclasses in `parser/maestro_parser/models.py`. When the shape
 * changes, change both — the JSON is generated, not hand-written.
 */

/** Which side of the door is on screen. */
export type DoorView = 'front' | 'back'

/** One "label: value" row of the printed specification. */
export interface DoorSpecEntry {
  label: string
  value: string
}

/** Public URLs of the rendered product shots. */
export interface DoorImages {
  /** Full size, used in the modal gallery. */
  front: string
  back: string
  /** Grid size, used on the card. */
  frontCard: string
  backCard: string
}

/** The condensed specification shown on the card and in the modal header. */
export interface DoorSpecs {
  /** Door leaf: thickness and composition. */
  material: string
  /** Exterior powder coating. */
  finish: string
  /** Interior panel. */
  interior: string
  /** Number of sealing contours. */
  sealing: string
  /** Standard frame sizes, already formatted ("860 × 2050 мм"). */
  dimensions: string[]
}

/** A single catalogue position. */
export interface Door {
  id: string
  /** Model name, e.g. "СБ-ЛАЙН-3". */
  title: string
  /** Article code, e.g. "МД-10". */
  article: string
  /** Leaf thickness series, e.g. "9,5 см". Empty on the thermal-break range. */
  series: string
  collectionId: string
  /** Source page in the PDF catalogue — handy when checking against the print. */
  page: number
  /** Status labels: "Новинка", "В наличии". */
  badges: string[]
  description: string
  images: DoorImages
  specs: DoorSpecs
  /** The complete printed specification, in catalogue order. */
  specList: DoorSpecEntry[]
  /** Made-to-order note printed under the specification. */
  customSizes: string
}

/** A catalogue section, used as a filter. */
export interface DoorCollection {
  id: string
  title: string
  description: string
  count: number
}

/** The generated dataset as a whole. */
export interface Catalog {
  source: string
  generatedAt: string
  /** Lifestyle photograph lifted from the catalogue cover. */
  cover: string
  collections: DoorCollection[]
  doors: Door[]
}
