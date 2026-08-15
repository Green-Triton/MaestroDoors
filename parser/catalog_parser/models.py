"""Domain objects produced by the extraction pipeline.

These dataclasses mirror the TypeScript contract in
`frontend/src/entities/door/model/types.ts`. Keep both in sync.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pymupdf


@dataclass(frozen=True)
class SlotGeometry:
    """Where the two views of a single door live on the page.

    `front` is the exterior view (it carries the frame), `back` is the interior
    view. Each keeps its own tight rectangle; `band_height` is the shared
    vertical reference — rendering both against it means the two views come out
    at the same scale, so toggling between them never resizes the door.
    """

    page_index: int
    row: int
    front: pymupdf.Rect
    back: pymupdf.Rect | None
    band_height: float

    @property
    def page_number(self) -> int:
        return self.page_index + 1


@dataclass
class SpecEntry:
    """One "label: value" line from the specification column."""

    label: str
    value: str

    def to_dict(self) -> dict[str, str]:
        return {"label": self.label, "value": self.value}


@dataclass
class DoorImages:
    """Public URLs of the exported product shots."""

    front: str
    back: str
    front_card: str
    back_card: str

    def to_dict(self) -> dict[str, str]:
        return {
            "front": self.front,
            "back": self.back,
            "frontCard": self.front_card,
            "backCard": self.back_card,
        }


@dataclass
class DoorSpecs:
    """The condensed specification surfaced on the card and modal header."""

    material: str
    finish: str
    interior: str
    sealing: str
    dimensions: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "material": self.material,
            "finish": self.finish,
            "interior": self.interior,
            "sealing": self.sealing,
            "dimensions": self.dimensions,
        }


@dataclass
class Door:
    """A single catalogue position."""

    id: str
    title: str
    article: str
    series: str
    collection_id: str
    page: int
    badges: list[str]
    description: str
    images: DoorImages
    specs: DoorSpecs
    spec_list: list[SpecEntry]
    custom_sizes: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "article": self.article,
            "series": self.series,
            "collectionId": self.collection_id,
            "page": self.page,
            "badges": self.badges,
            "description": self.description,
            "images": self.images.to_dict(),
            "specs": self.specs.to_dict(),
            "specList": [entry.to_dict() for entry in self.spec_list],
            "customSizes": self.custom_sizes,
        }


@dataclass
class Collection:
    """A catalogue section, used as a filter in the UI."""

    id: str
    title: str
    description: str
    raw_heading: str
    count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "count": self.count,
        }


@dataclass
class Catalog:
    """The full dataset handed to the frontend."""

    source: str
    generated_at: str
    #: Public URL of the lifestyle photograph lifted from the catalogue cover.
    cover: str = ""
    collections: list[Collection] = field(default_factory=list)
    doors: list[Door] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "generatedAt": self.generated_at,
            "cover": self.cover,
            "collections": [c.to_dict() for c in self.collections],
            "doors": [d.to_dict() for d in self.doors],
        }
