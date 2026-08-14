# MaestroDoors — витрина

React 19 + TypeScript + Vite. Архитектура — [Feature-Sliced Design](https://feature-sliced.design/).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # прод-сборка
npm run typecheck
npm run lint
```

> Перед первым запуском соберите данные: `python ../parser/run.py`.
> Папка `public/doors/` — выгрузка парсера, в git не хранится.

## Архитектура

Слои, сверху вниз. Импорты идут **только вниз**; это проверяется ESLint'ом
(`no-restricted-imports` в [`eslint.config.js`](eslint.config.js)), поэтому
нарушение падает на `npm run lint`, а не всплывает через полгода.

```
app        точка входа, глобальные стили и токены
  ▼
pages      catalog — единственная страница
  ▼
widgets    site-header · hero · catalog-grid · door-details-modal · site-footer
  ▼
features   door-view-toggle · filter-doors · request-quote
  ▼
entities   door — типы, селекторы, доступ к данным, DoorCard/DoorImage/DoorSpecList
  ▼
shared     ui-кит, хелперы, конфиг, сгенерированный датасет
```

`app` и `shared` — плоские: внутри них сосед соседа импортировать можно
(`shared/ui` законно пользуется `shared/lib`). Слайсы промежуточных слоёв
независимы друг от друга.

### Где что лежит

| Компонент из задания | Слой | Файл |
|---|---|---|
| `Grid` | widget | `widgets/catalog-grid/ui/CatalogGrid.tsx` |
| `Card` | entity | `entities/door/ui/DoorCard/DoorCard.tsx` |
| `ImageToggle` | feature | `features/door-view-toggle/ui/ImageToggle.tsx` |
| `Modal` | shared + widget | `shared/ui/Modal` (примитив) + `widgets/door-details-modal` (содержимое) |
| `CTAButton` | feature | `features/request-quote/ui/CTAButton.tsx` |
| `doorsData` | entity | `entities/door/api/catalogApi.ts` |

### Пара решений, которые стоит знать

**Карточка не импортирует переключатель.** `ImageToggle` — это feature, а
features лежат выше entities. Поэтому `DoorCard` принимает его пропом
`viewToggle`, а собирает их вместе виджет `CatalogGrid`. Так зависимость
продолжает смотреть вниз.

**Состояние вида — у каждой карточки своё.** `useDoorView` вызывается внутри
`CatalogGridItem`, а не в цикле по дверям: перевернуть одну плитку и не тронуть
остальные иначе не выйдет, да и хуки в `map` вызывать нельзя.

**Оба вида смонтированы всегда.** `DoorImage` держит в DOM обе картинки и
переключает их прозрачностью — переворот мгновенный после первой загрузки и
не мигает пустой рамкой.

**Кадр двери — не 1:2.** Отрисованная картинка вертикальная (1:2), но сетка из
таких плиток невыносима при прокрутке. Рамка задаётся переменной `--door-frame`
(в сетке 1:1.55, в модалке 1:1.9), картинка вписывается через `object-fit:
contain`, а белая подложка превращает остаток ширины в поля.

**Данные импортируются, а не запрашиваются.** JSON лежит в `shared/api/catalog`
и подключается статически: каталог типизируется на сборке и не требует бэкенда.
Когда появится API, менять придётся только `entities/door/api/catalogApi.ts`.

## Дизайн

Палитра снята с самого каталога — заливки в PDF дают `#fdb21e` (акцент),
`#2b2a29` (текст), `#5b5b5b` (заголовки), `#e5e5e5` (линии). Токены —
в [`app/styles/tokens.css`](src/app/styles/tokens.css). Шрифт — Jost,
геометрический гротеск, ближайший к Century Gothic из каталога.

Сетка: **4 колонки** на десктопе → 3 (≤1279px) → 2 (≤899px) → 1 (≤519px).

## Заявка

`CTAButton` пока без бэкенда: пишет payload в `console.log` и проходит
состояния `idle → pending → sent → idle`. Форма объекта — это контракт
будущего эндпоинта, так что подключение сведётся к замене `setTimeout` на `fetch`.

## Доступность

- модальное окно — `role="dialog"`, фокус входит при открытии и возвращается
  на карточку при закрытии, Tab заперт внутри, Escape и клик по фону закрывают;
- переключатель вида — `radiogroup`, работает с клавиатуры, в галерее модалки
  вид переключается стрелками ←/→;
- фильтр коллекций — `tablist`, управляющий сеткой;
- вся плитка кликабельна, но клик обрабатывает настоящая `button` внутри,
  а не `div` с обработчиком;
- `prefers-reduced-motion` отключает анимации.
