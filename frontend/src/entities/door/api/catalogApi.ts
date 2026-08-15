/**
 * Доступ к сгенерированному датасету каталога.
 *
 * JSON в `shared/api/catalog` собирается скриптом `parser/run.py` прямо из PDF
 * и вручную не редактируется. Он импортируется, а не запрашивается по сети:
 * каталог типизируется на сборке и не требует бэкенда. Когда появится API,
 * менять придётся только этот модуль.
 */

import rawCatalog from '@shared/api/catalog/doors.data.json'
import { withBase } from '@shared/lib/withBase'

import type { Catalog, Door, DoorCollection } from '../model/types'

/**
 * Единственное место, где к путям картинок добавляется базовый путь сборки.
 *
 * Сайт публикуется в подкаталог домена, а в датасете лежат пути вида
 * `doors/....webp` — без префикса они уедут в корень домена и вернут 404.
 * Преобразование живёт только здесь: если продублировать его в селекторах или
 * компонентах, префикс применится дважды и получится `/base/base/doors/...`.
 */
const resolveImages = (door: Door): Door => ({
  ...door,
  images: {
    front: withBase(door.images.front),
    back: withBase(door.images.back),
    frontCard: withBase(door.images.frontCard),
    backCard: withBase(door.images.backCard),
  },
})

const source = rawCatalog as Catalog

const catalog: Catalog = {
  ...source,
  cover: withBase(source.cover),
  doors: source.doors.map(resolveImages),
}

/** Полный датасет вместе со служебными полями. */
export const getCatalog = (): Catalog => catalog

/**
 * Все двери каталога в порядке печати.
 *
 * Именно вокруг этого массива построена витрина: сетка, фильтры и модальное
 * окно читают из него.
 */
export const doorsData: readonly Door[] = catalog.doors

/** Разделы каталога — от самой тонкой серии до моделей с терморазрывом. */
export const doorCollections: readonly DoorCollection[] = catalog.collections

/** Интерьерная фотография с обложки каталога. */
export const coverImage: string = catalog.cover
