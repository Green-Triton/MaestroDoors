"""Configuration for the MaestroDoors catalogue extraction pipeline.

Every tunable lives here so the pipeline modules stay free of magic numbers.
Coordinates are expressed in PDF points (1 pt = 1/72 inch) and were derived
from the CorelDRAW layout of "Каталог MaestroDoors ИЮЛЬ.pdf", which places
every door on a strict two-row grid.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_PDF_PATH = PROJECT_ROOT / "Каталог MaestroDoors ИЮЛЬ.pdf"

#: Rendered product shots consumed by the frontend (served as static assets).
DEFAULT_IMAGE_DIR = PROJECT_ROOT / "frontend" / "public" / "doors"

#: Generated catalogue dataset consumed by the frontend.
DEFAULT_DATA_PATH = (
    PROJECT_ROOT / "frontend" / "src" / "shared" / "api" / "catalog" / "doors.data.json"
)

#: Public URL prefix under which `DEFAULT_IMAGE_DIR` is served by Vite.
PUBLIC_IMAGE_BASE = "/doors"


# --------------------------------------------------------------------------
# Page layout
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class LayoutConfig:
    """Geometry of a catalogue spread."""

    #: 1-based page numbers that contain products (page 1 = cover, 29 = back cover).
    first_product_page: int = 2
    last_product_page: int = 28

    #: Vertical split between the upper and the lower product row. Measured
    #: across every product page, the upper row's body copy ends at y=448 and
    #: the lower row's first element (the "НОВИНКА" badge) starts at y=464.4;
    #: 456 sits in that gutter. A split at the page midpoint would cut through
    #: the tail of the upper row's closing paragraph.
    row_split_y: float = 456.0

    #: Horizontal split between the exterior (left) and interior (right) view.
    view_split_x: float = 177.0

    #: A picture must be at least this large to qualify as a primary product shot.
    #: Everything smaller is decorative overlay artwork (handles, glazing, locks)
    #: that is composited into the primary shot during rendering.
    min_primary_width: float = 60.0
    min_primary_height: float = 150.0

    #: Overlay artwork is merged into a primary shot when at least this share of
    #: its area falls inside that shot.
    overlay_containment: float = 0.8

    #: The exterior shot carries the door frame and therefore defines the
    #: vertical band of the whole row; the interior shot is re-clipped to it so
    #: both views share one coordinate system and never jump while toggling.
    #: A hairline is shaved off the bottom to avoid catching the grey separator.
    row_bottom_inset: float = 0.75


LAYOUT = LayoutConfig()


# --------------------------------------------------------------------------
# Image rendering
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class ImageVariant:
    """One exported size of a product shot."""

    name: str
    height: int
    quality: int


@dataclass(frozen=True)
class RenderConfig:
    """How product shots are rasterised and exported.

    The embedded artwork is stored at roughly 309x640 px, so anything beyond
    ~2x that resolution adds weight without adding detail. We rasterise at a
    high supersampling factor (to resolve the vector overlays crisply), then
    Lanczos-downsample to the delivery sizes and apply a light unsharp mask to
    recover the micro-contrast lost in the resample.
    """

    supersample: float = 8.0

    #: Both views are padded onto a canvas of this aspect ratio (width / height)
    #: so that every card in the grid frames its door identically.
    canvas_aspect: float = 0.5

    #: Flat background colour composited under the artwork. The embedded images
    #: are inconsistent — some carry an alpha mask, some are opaque JPEG on
    #: white — so everything is normalised onto one white plate.
    background: tuple[int, int, int] = (255, 255, 255)

    unsharp_radius: float = 1.1
    unsharp_percent: int = 85
    unsharp_threshold: int = 3

    variants: tuple[ImageVariant, ...] = (
        ImageVariant(name="full", height=1200, quality=88),
        ImageVariant(name="card", height=640, quality=86),
    )


RENDER = RenderConfig()


# --------------------------------------------------------------------------
# Text parsing
# --------------------------------------------------------------------------

#: Status labels printed above a product title.
BADGE_LABELS: dict[str, str] = {
    "НОВИНКА": "Новинка",
    "СКЛАД": "В наличии",
}

#: Running heads are authored by hand in CorelDRAW and carry stray production
#: notes. Each raw heading is mapped onto a stable collection identity.
COLLECTION_OVERRIDES: dict[str, tuple[str, str]] = {
    # raw running head -> (slug, short title for the filter bar)
    "6 СМ ДВЕРИ 2 КОНТУРА МЕТ/МДФ (УТЕПЛЕНИЕ ПЕНОПЛАСТ, ПОЛОТНО 60мм)": (
        "met-mdf-60",
        "6 см · МЕТ/МДФ",
    ),
    "7см 2 КОНТУРА МЕТ/МДФ (УТЕПЛЕНИЕ ПЕНОПЛАСТ, ПОЛОТНО 70мм)": (
        "met-mdf-70",
        "7 см · МЕТ/МДФ",
    ),
    "8см ДВЕРИ 2 КОНТУРА МЕТ/МДФ (УТЕПЛЕНИЕ ПЕНОПЛАСТ, ПОЛОТНО 80мм)": (
        "met-mdf-80",
        "8 см · МЕТ/МДФ",
    ),
    "9,5 см ДВЕРИ 3 КОНТУРА МЕТ/МДФ (УТЕПЛЕНИЕ ПЕНОПЛАСТ, ПОЛОТНО 95мм)": (
        "met-mdf-95",
        "9,5 см · МЕТ/МДФ",
    ),
    "85 мдф мдф ДВЕРИ 2 КОНТУРА МДФ/МДФ (УТЕПЛЕНИЕ ПЕНОПЛАСТ)": (
        "mdf-mdf-85",
        "8,5 см · МДФ/МДФ",
    ),
    "ДВЕРИ 3 КОНТУРА МДФ/МДФ (УТЕПЛЕНИЕ ПЕНОПЛАСТ)": (
        "mdf-mdf-105",
        "10,5 см · МДФ/МДФ",
    ),
    "ДВЕРИ С ТЕРМОРАЗРЫВОМ": (
        "thermal-break",
        "С терморазрывом",
    ),
}

#: Human-readable heading for each collection, shown in the modal.
COLLECTION_DESCRIPTIONS: dict[str, str] = {
    "met-mdf-60": "Полотно 60 мм, 2 контура уплотнения, утепление пенопласт",
    "met-mdf-70": "Полотно 70 мм, 2 контура уплотнения, утепление пенопласт",
    "met-mdf-80": "Полотно 80 мм, 2 контура уплотнения, утепление пенопласт",
    "met-mdf-95": "Полотно 95 мм, 3 контура уплотнения, утепление пенопласт",
    "mdf-mdf-85": "Полотно 85 мм, МДФ снаружи и внутри, 2 контура уплотнения",
    "mdf-mdf-105": "Полотно 105 мм, МДФ снаружи и внутри, 3 контура уплотнения",
    "thermal-break": "Вставной терморазрыв ПВХ, 3 контура уплотнения",
}

#: Order in which collections appear in the UI.
COLLECTION_ORDER: tuple[str, ...] = (
    "met-mdf-60",
    "met-mdf-70",
    "met-mdf-80",
    "met-mdf-95",
    "mdf-mdf-85",
    "mdf-mdf-105",
    "thermal-break",
)

#: Specification keys as printed in the catalogue, normalised to a canonical
#: label. Keys are matched case-insensitively after stripping the colon.
SPEC_LABELS: dict[str, str] = {
    "дверная коробка": "Дверная коробка",
    "короб": "Короб",
    "наличник": "Наличник",
    "полотно": "Полотно",
    "наполнение": "Наполнение",
    "порошковое покрытие": "Порошковое покрытие",
    "отделка снаружи": "Отделка снаружи",
    "отделка внутри": "Отделка внутри",
    "уплотнитель": "Уплотнитель",
    "петли": "Петли",
    "замок основной": "Замок основной",
    "замок дополнительный": "Замок дополнительный",
    "ручка": "Ручка",
    "накладки": "Накладки",
    "ночная задвижка": "Ночная задвижка",
    "глазок": "Глазок",
    "эксцентрик": "Эксцентрик",
    "противосъемы": "Противосъёмы",
    "размер по коробу, мм": "Размер по коробу",
}

#: Cyrillic -> Latin table used to build URL/file-safe identifiers.
TRANSLIT: dict[str, str] = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "",
    "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}
