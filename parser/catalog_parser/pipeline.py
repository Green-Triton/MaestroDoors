"""Orchestrates the full extraction: PDF in, images + dataset out."""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

import pymupdf

from .config import (
    COLLECTION_DESCRIPTIONS,
    COLLECTION_ORDER,
    COLLECTION_OVERRIDES,
    LAYOUT,
    PUBLIC_IMAGE_BASE,
    RENDER,
    LayoutConfig,
    RenderConfig,
)
from .image_extractor import export_cover, export_views
from .layout import find_slots
from .models import Catalog, Collection, Door, DoorImages, DoorSpecs
from .text_parser import (
    parse_dimensions,
    parse_title,
    read_badges,
    read_heading,
    read_specs,
    read_titles,
    slugify,
)


def _spec_value(entries, label: str, default: str = "") -> str:
    for entry in entries:
        if entry.label == label:
            return entry.value
    return default


def _resolve_collection(heading: str) -> tuple[str, str]:
    """Map a running head onto a stable collection id and short title.

    The headings are hand-set and carry production notes (one reads
    "85 мдф мдф ДВЕРИ 2 КОНТУРА МДФ/МДФ…"), so they are resolved through an
    explicit table rather than parsed. An unrecognised heading still produces a
    usable collection instead of dropping the doors on that page.
    """
    known = COLLECTION_OVERRIDES.get(heading)
    if known:
        return known
    return slugify(heading)[:40] or "other", heading


def _soften(value: str) -> str:
    """Lower-case the opening letter so a value can be spliced mid-sentence.

    Folding the whole string would destroy the material and colour names the
    catalogue capitalises ("МДФ", "Муар черный"). Acronyms are left alone
    entirely — "МДФ панель" must not become "мДФ панель".
    """
    value = value.strip().rstrip(".")
    if not value:
        return ""
    first_word = value.split(" ", 1)[0]
    if len(first_word) > 1 and first_word.isupper():
        return value
    return value[:1].lower() + value[1:]


def _build_description(name: str, entries, collection_title: str) -> str:
    """Compose a short summary from catalogue facts only — nothing invented."""
    raw_leaf = _spec_value(entries, "Полотно")
    leaf = re.sub(r"^Толщина\s+", "", raw_leaf)
    # Only the plain "Толщина 80мм" form reads as a thickness; the thermal-break
    # range states a construction ("Вставной терморазрыв ПВХ. Толщина 110мм"),
    # which must not be introduced by the word "полотно".
    leaf_is_thickness = leaf != raw_leaf
    sealing = _spec_value(entries, "Уплотнитель")
    outside = _spec_value(entries, "Отделка снаружи")
    coating = _spec_value(entries, "Порошковое покрытие")
    interior = _spec_value(entries, "Отделка внутри")

    sentences: list[str] = []

    leaf_fact = ""
    if leaf:
        leaf_fact = f"полотно {_soften(leaf)}" if leaf_is_thickness else _soften(leaf)

    facts = [part for part in (leaf_fact, _soften(sealing)) if part]
    opening = f"Входная дверь «{name}»"
    if facts:
        opening += ": " + ", ".join(facts)
    sentences.append(opening + ".")

    # "Отделка снаружи" reads "Нет" whenever the exterior is bare powder coat,
    # in which case the coating itself is the more informative fact.
    exterior = outside if outside and outside.strip(". ").lower() != "нет" else coating
    if exterior:
        sentences.append(f"Снаружи — {_soften(exterior)}.")
    if interior:
        sentences.append(f"Внутри — {_soften(interior)}.")

    return " ".join(sentences)


def extract(
    pdf_path: Path,
    image_dir: Path,
    data_path: Path,
    *,
    clean: bool = True,
    layout: LayoutConfig = LAYOUT,
    render: RenderConfig = RENDER,
    verbose: bool = True,
) -> Catalog:
    """Run the whole pipeline and write both artefacts to disk."""
    if not pdf_path.exists():
        raise FileNotFoundError(f"Каталог не найден: {pdf_path}")

    if clean and image_dir.exists():
        shutil.rmtree(image_dir)
    image_dir.mkdir(parents=True, exist_ok=True)

    doc = pymupdf.open(pdf_path)
    catalog = Catalog(
        source=pdf_path.name,
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
    collections: dict[str, Collection] = {}
    seen_ids: set[str] = set()

    cover = export_cover(doc[0], image_dir, cfg=render)
    catalog.cover = f"{PUBLIC_IMAGE_BASE}/{cover}" if cover else ""

    for page_index in range(layout.first_product_page - 1, layout.last_product_page):
        page = doc[page_index]
        heading = read_heading(page)
        collection_id, collection_title = _resolve_collection(heading)

        if collection_id not in collections:
            collections[collection_id] = Collection(
                id=collection_id,
                title=collection_title,
                description=COLLECTION_DESCRIPTIONS.get(collection_id, heading),
                raw_heading=heading,
            )

        titles = read_titles(page, layout)
        badges = read_badges(page, layout)

        for slot in find_slots(page, page_index, layout):
            raw_title = titles.get(slot.row)
            if not raw_title:
                if verbose:
                    print(
                        f"  ! стр. {slot.page_number}, ряд {slot.row + 1}: "
                        "нет заголовка, слот пропущен"
                    )
                continue

            name, article, series = parse_title(raw_title)
            entries, custom_sizes = read_specs(page, slot.row, layout)

            door_id = slugify(article) or slugify(name)
            if door_id in seen_ids:
                door_id = f"{door_id}-p{slot.page_number}"
            seen_ids.add(door_id)

            front_urls = export_views(
                page, slot.front, slot.band_height, door_id, "front", image_dir, render
            )
            back_urls = (
                export_views(
                    page, slot.back, slot.band_height, door_id, "back", image_dir, render
                )
                if slot.back is not None
                else front_urls
            )

            door = Door(
                id=door_id,
                title=name,
                article=article,
                series=series,
                collection_id=collection_id,
                page=slot.page_number,
                badges=badges.get(slot.row, []),
                description=_build_description(name, entries, collection_title),
                images=DoorImages(
                    front=front_urls["full"],
                    back=back_urls["full"],
                    front_card=front_urls["card"],
                    back_card=back_urls["card"],
                ),
                specs=DoorSpecs(
                    material=_spec_value(entries, "Полотно"),
                    finish=_spec_value(entries, "Порошковое покрытие"),
                    interior=_spec_value(entries, "Отделка внутри"),
                    sealing=_spec_value(entries, "Уплотнитель"),
                    dimensions=parse_dimensions(entries),
                ),
                spec_list=entries,
                custom_sizes=custom_sizes,
            )
            catalog.doors.append(door)
            collections[collection_id].count += 1

            if verbose:
                print(
                    f"  + {door.article:<8} {door.title[:34]:<34} "
                    f"стр.{door.page:>3}  спецификаций: {len(entries):>2}"
                )

    order = {cid: i for i, cid in enumerate(COLLECTION_ORDER)}
    catalog.collections = sorted(
        collections.values(), key=lambda c: order.get(c.id, len(order))
    )

    data_path.parent.mkdir(parents=True, exist_ok=True)
    data_path.write_text(
        json.dumps(catalog.to_dict(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    doc.close()
    return catalog
