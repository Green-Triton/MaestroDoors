"""Locate the product slots on a catalogue page.

The catalogue is a CorelDRAW export: every product page carries up to two doors
stacked vertically, each shown twice — exterior view on the left, interior view
on the right. Small pieces of artwork (handles, glazing, lock plates) are placed
as separate images on top of those two shots, and CorelDRAW leaves a fair amount
of off-canvas debris behind, so raw `page.get_images()` output cannot be used
directly. This module reduces that noise to clean slot geometry.
"""

from __future__ import annotations

import pymupdf

from .config import LAYOUT, LayoutConfig
from .models import SlotGeometry


def _placed_rects(page: pymupdf.Page) -> list[pymupdf.Rect]:
    """Every image placement on `page`, clipped to the visible page area.

    A single XObject can be placed several times (mirrored glazing strips, for
    example), and CorelDRAW parks unused artwork far off-canvas at negative
    coordinates. Intersecting with the page rectangle discards that debris.
    """
    rects: list[pymupdf.Rect] = []
    for image in page.get_images(full=True):
        xref = image[0]
        for rect in page.get_image_rects(xref):
            visible = rect & page.rect
            if not visible.is_empty and visible.width > 1 and visible.height > 1:
                rects.append(visible)
    return rects


def _pick_primary(
    candidates: list[pymupdf.Rect], cfg: LayoutConfig
) -> pymupdf.Rect | None:
    """The largest rectangle that is big enough to be a product shot."""
    eligible = [
        r
        for r in candidates
        if r.width >= cfg.min_primary_width and r.height >= cfg.min_primary_height
    ]
    if not eligible:
        return None
    return max(eligible, key=lambda r: r.width * r.height)


def _expand_with_overlays(
    primary: pymupdf.Rect, rects: list[pymupdf.Rect], cfg: LayoutConfig
) -> pymupdf.Rect:
    """Grow `primary` so it covers overlay artwork that sits on top of it.

    Decorative pieces are normally fully inside the primary shot, but a few
    lock plates overhang its edge by a millimetre or two. Anything that is
    mostly inside is absorbed; unrelated artwork elsewhere on the page is not.
    """
    result = pymupdf.Rect(primary)
    for rect in rects:
        area = rect.width * rect.height
        if area <= 0:
            continue
        overlap = rect & primary
        if overlap.is_empty:
            continue
        if (overlap.width * overlap.height) / area >= cfg.overlay_containment:
            result |= rect
    return result


def find_slots(
    page: pymupdf.Page, page_index: int, cfg: LayoutConfig = LAYOUT
) -> list[SlotGeometry]:
    """Return the door slots on `page`, ordered top to bottom.

    The exterior shot defines the vertical band of the row because it includes
    the frame; the interior shot is re-clipped to that same band so both views
    share one coordinate system.
    """
    rects = _placed_rects(page)
    if not rects:
        return []

    slots: list[SlotGeometry] = []
    for row in (0, 1):
        in_row = [
            r
            for r in rects
            if ((r.y0 + r.y1) / 2 < cfg.row_split_y) == (row == 0)
        ]
        if not in_row:
            continue

        left = [r for r in in_row if (r.x0 + r.x1) / 2 < cfg.view_split_x]
        right = [r for r in in_row if (r.x0 + r.x1) / 2 >= cfg.view_split_x]

        front = _pick_primary(left, cfg)
        if front is None:
            # No exterior shot means this row is decoration, not a product.
            continue
        front = _expand_with_overlays(front, left, cfg)

        # A hairline is shaved off the bottom of both views: the grey rule that
        # separates the two rows butts directly against the artwork.
        front = pymupdf.Rect(front.x0, front.y0, front.x1, front.y1 - cfg.row_bottom_inset)

        back_primary = _pick_primary(right, cfg)
        back: pymupdf.Rect | None = None
        if back_primary is not None:
            back_primary = _expand_with_overlays(back_primary, right, cfg)
            back = pymupdf.Rect(
                back_primary.x0,
                back_primary.y0,
                back_primary.x1,
                back_primary.y1 - cfg.row_bottom_inset,
            )

        slots.append(
            SlotGeometry(
                page_index=page_index,
                row=row,
                front=front,
                back=back,
                band_height=front.height,
            )
        )

    return slots
