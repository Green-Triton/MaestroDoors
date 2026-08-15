"""Read the editorial content of a catalogue page.

The layout is typographically consistent throughout the catalogue, which lets us
classify every text span by font, size and position rather than by guessing from
the reading order:

* running head  — 12 pt regular, above y = 70
* product title — 14 pt bold, dark grey (#5b5b5b), left margin
* status badge  — 14 pt bold, near-black (#434242), above the title
* specification — 9 pt, bold runs are labels and regular runs are values
"""

from __future__ import annotations

import re
import unicodedata

import pymupdf

from .config import BADGE_LABELS, LAYOUT, SPEC_LABELS, TRANSLIT, LayoutConfig
from .models import SpecEntry

#: "9,5 см СБ-ЛАЙН-3 (МД-10)" -> series "9,5 см", name "СБ-ЛАЙН-3", article "МД-10"
#: The unit is optional because one title is typeset "10,5м СПИКА МЛ / АДАРА",
#: and absent entirely on the thermal-break range ("ТЕРМО ЛИРА (МПТ-27)").
TITLE_RE = re.compile(
    r"^(?:(\d+(?:[.,]\d+)?)\s*(?:см|мм|м)\s+)?(.*?)\s*\(([^()]+)\)\s*$"
)

#: "Стандарт - 860х2050 / 960х2050" -> ["860", "2050"], ["960", "2050"]
#: The catalogue mixes the Cyrillic "х" and the Latin "x" as the separator.
DIMENSION_RE = re.compile(r"(\d{3,4})\s*[хx×*]\s*(\d{3,4})", re.IGNORECASE)

TITLE_COLOR = 0x5B5B5B
BADGE_COLOR = 0x434242
HEADING_MAX_Y = 70.0
BIG_TEXT_MIN_SIZE = 13.0
SPEC_COLUMN_MIN_X = 300.0
SPEC_MAX_FONT_SIZE = 10.0


def _clean(text: str) -> str:
    """Collapse whitespace and normalise the punctuation CorelDRAW emits.

    NFKC folds non-breaking spaces and ligatures; what remains is collapsing
    the runs of whitespace left behind by the hand-set line breaks.
    """
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text).strip()
    # The catalogue frequently sets 'Цвет -"Антик медь"' with no space after the
    # dash, which reads as a typo once the value is lifted out of the layout.
    return re.sub(r'(?<=[-–—])(?=["«„])', " ", text)


def slugify(value: str) -> str:
    """Build a URL- and filename-safe identifier from a Cyrillic article code."""
    lowered = _clean(value).lower()
    out = []
    for char in lowered:
        if char in TRANSLIT:
            out.append(TRANSLIT[char])
        elif char.isalnum():
            out.append(char)
        else:
            out.append("-")
    slug = re.sub(r"-+", "-", "".join(out)).strip("-")
    return slug


def _iter_spans(page: pymupdf.Page):
    """Yield every text span on the page together with its geometry."""
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:  # 0 = text, 1 = image
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                if span["text"].strip():
                    yield block, line, span


def read_heading(page: pymupdf.Page) -> str:
    """The running head that names the collection this page belongs to."""
    parts = [
        span["text"]
        for _, _, span in _iter_spans(page)
        if span["bbox"][1] < HEADING_MAX_Y and span["size"] >= 11
    ]
    return _clean(" ".join(parts))


def _row_of(y: float, cfg: LayoutConfig) -> int:
    return 0 if y < cfg.row_split_y else 1


def read_titles(page: pymupdf.Page, cfg: LayoutConfig = LAYOUT) -> dict[int, str]:
    """Product titles keyed by row index."""
    titles: dict[int, str] = {}
    for _, _, span in _iter_spans(page):
        if span["size"] < BIG_TEXT_MIN_SIZE or "Bold" not in span["font"]:
            continue
        if span["color"] != TITLE_COLOR:
            continue
        titles[_row_of(span["bbox"][1], cfg)] = _clean(span["text"])
    return titles


def read_badges(page: pymupdf.Page, cfg: LayoutConfig = LAYOUT) -> dict[int, list[str]]:
    """Status badges ("Новинка", "В наличии") keyed by row index."""
    badges: dict[int, list[str]] = {0: [], 1: []}
    for _, _, span in _iter_spans(page):
        if span["size"] < BIG_TEXT_MIN_SIZE or "Bold" not in span["font"]:
            continue
        if span["color"] != BADGE_COLOR:
            continue
        label = BADGE_LABELS.get(_clean(span["text"]).upper())
        if label:
            row = _row_of(span["bbox"][1], cfg)
            if label not in badges[row]:
                badges[row].append(label)
    return badges


def parse_title(raw: str) -> tuple[str, str, str]:
    """Split a printed title into (name, article, series).

    Falls back to the raw string when the article is missing so that a layout
    surprise degrades into a usable record instead of an exception.
    """
    match = TITLE_RE.match(raw)
    if not match:
        return _clean(raw), "", ""
    thickness, name, article = match.groups()
    #: Every thickness in the catalogue is stated in centimetres (6 … 10,5),
    #: so the unit is re-applied uniformly rather than echoing the typo.
    series = f"{_clean(thickness)} см" if thickness else ""
    return _clean(name), _clean(article), series


def _spec_lines(page: pymupdf.Page, row: int, cfg: LayoutConfig) -> list[str]:
    """Specification lines of one row, in reading order.

    Selection happens per line rather than per block on purpose: on several
    pages PyMuPDF merges the product title (left margin) and the specification
    column into a single block, so a block-level x-filter silently drops the
    whole specification. Lines carry their own geometry and stay reliable.
    """
    lines: list[tuple[float, str]] = []
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            spans = [span for span in line["spans"] if span["text"].strip()]
            if not spans:
                continue
            bbox = line["bbox"]
            if bbox[0] < SPEC_COLUMN_MIN_X:
                continue
            # The running head, the product title and the folio all live in the
            # same horizontal band as the specification column but are set much
            # larger; body copy is 9 pt throughout.
            if max(span["size"] for span in spans) > SPEC_MAX_FONT_SIZE:
                continue
            if _row_of((bbox[1] + bbox[3]) / 2, cfg) != row:
                continue
            lines.append((bbox[1], "".join(span["text"] for span in spans)))

    lines.sort(key=lambda item: item[0])
    return [text for _, text in lines]


def read_specs(
    page: pymupdf.Page, row: int, cfg: LayoutConfig = LAYOUT
) -> tuple[list[SpecEntry], str]:
    """Parse one specification column into entries plus the custom-size note.

    A line whose head matches a known specification label starts a new entry;
    every other line continues the previous value (the catalogue wraps long
    values across two or three lines). The closing "Нестандарт" paragraph runs
    to the foot of the column and is returned separately.
    """
    entries: list[SpecEntry] = []
    custom_sizes = ""
    in_custom_sizes = False

    for raw in _spec_lines(page, row, cfg):
        flat = _clean(raw)
        if not flat:
            continue

        if flat.lower().startswith("нестандарт"):
            in_custom_sizes = True
            custom_sizes = _clean(flat.split(":", 1)[1] if ":" in flat else flat)
            continue

        label, value = _split_label(flat)
        if label is not None:
            entries.append(SpecEntry(label=label, value=_clean(value)))
            in_custom_sizes = False
        elif in_custom_sizes:
            # The closing paragraph is the last thing in the column, so every
            # unlabelled line after it belongs to it rather than to the
            # preceding specification.
            custom_sizes = _join_wrapped(custom_sizes, flat)
        elif entries:
            entries[-1].value = _join_wrapped(entries[-1].value, flat)

    return [e for e in entries if e.value], custom_sizes


def _join_wrapped(head: str, tail: str) -> str:
    """Re-join a value that the catalogue broke across two lines.

    The typesetting breaks words on a hyphen ("…спец заказам, р-" / "р от
    600х1700…"), so a trailing hyphen means the two halves are one word and
    must not be separated by a space.
    """
    head, tail = head.strip(), tail.strip()
    if not head:
        return tail
    if head.endswith("-"):
        return _clean(head + tail)
    return _clean(f"{head} {tail}")


def _split_label(line: str) -> tuple[str | None, str]:
    """Split a line into (canonical label, value) when it starts a new entry.

    Recognition is driven by the closed vocabulary in `SPEC_LABELS` rather than
    by the bold run that precedes the colon. The catalogue's emphasis is not
    dependable — the colon sometimes falls outside the bold run
    ("**Наполнение**: Пенополистирол"), and on the thermal-break pages a few
    labels are not emphasised at all — whereas the label wording is fixed.
    """
    head, separator, value = line.partition(":")
    if not separator:
        return None, ""
    canonical = SPEC_LABELS.get(_clean(head).lower())
    if canonical is None:
        return None, ""
    return canonical, value


def parse_dimensions(entries: list[SpecEntry]) -> list[str]:
    """Standard frame sizes, formatted as "860 × 2050 мм"."""
    for entry in entries:
        if entry.label != "Размер по коробу":
            continue
        return [
            f"{width} × {height} мм"
            for width, height in DIMENSION_RE.findall(entry.value)
        ]
    return []
