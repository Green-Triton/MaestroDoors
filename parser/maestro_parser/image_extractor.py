"""Render clean product shots out of the catalogue PDF.

Why not simply export the embedded images?
--------------------------------------------------
The naive approach — walking `page.get_images()` and saving each XObject — is
what produced the unusable first attempt, for three reasons:

1. **Half the doors are layered.** Glazing, handles, lock plates and mirror
   inserts are separate images stacked on top of the door. Exporting the base
   image alone yields a door with holes where the glass should be.
2. **Alpha lives in a sibling object.** Most shots are a JPEG plus a separate
   soft mask, so exporting XObjects blindly writes out a pile of black-and-white
   mask files next to the real artwork.
3. **Framing is inconsistent.** The exterior shot includes the frame and the
   interior shot does not, so exporting raw bounding boxes makes the door jump
   in size the moment you toggle between the two views.

This module instead *rasterises the page* through the clip rectangle of each
slot. The PDF renderer composites the whole stack — base image, soft mask and
every overlay — exactly as the catalogue is printed. Both views are then padded
onto one canvas geometry so the grid stays visually calm.
"""

from __future__ import annotations

from pathlib import Path

import pymupdf
from PIL import Image, ImageFilter

from .config import RENDER, PUBLIC_IMAGE_BASE, RenderConfig


def render_slot(
    page: pymupdf.Page, clip: pymupdf.Rect, cfg: RenderConfig = RENDER
) -> Image.Image:
    """Rasterise one view at supersampled resolution.

    Rendering through a clip rectangle is what makes the overlay artwork come
    out composited; `alpha=True` keeps the soft masks intact so the door can be
    flattened onto a known background instead of whatever the page happened to
    have underneath it.
    """
    matrix = pymupdf.Matrix(cfg.supersample, cfg.supersample)
    pixmap = page.get_pixmap(matrix=matrix, clip=clip, alpha=True)
    return Image.frombytes(
        "RGBA", (pixmap.width, pixmap.height), pixmap.samples
    )


def flatten(image: Image.Image, cfg: RenderConfig = RENDER) -> Image.Image:
    """Composite onto the flat catalogue background.

    The embedded artwork is inconsistent — some doors carry a soft mask, others
    are opaque JPEGs already sitting on white — so every shot is normalised onto
    the same plate. Trying to key out the background instead would fringe the
    masked doors and mangle the ones whose interior panel is white.
    """
    plate = Image.new("RGB", image.size, cfg.background)
    plate.paste(image, mask=image.getchannel("A"))
    return plate


def fit_to_canvas(
    image: Image.Image, band_height_px: float, cfg: RenderConfig = RENDER
) -> Image.Image:
    """Centre `image` on the slot's shared canvas.

    `band_height_px` is the height of the exterior view, which acts as the
    common reference for the whole slot. Padding both views onto that canvas —
    rather than scaling each to fill it — is what keeps them at one scale: the
    interior view is shot without the outer frame and is genuinely a little
    shorter and narrower, so stretching it to fit would make the same door
    appear to grow when the visitor flips the card.
    """
    width, height = image.size
    target_height = max(height, round(band_height_px))
    target_width = max(width, round(target_height * cfg.canvas_aspect))
    if (target_width, target_height) == (width, height):
        return image

    canvas = Image.new("RGB", (target_width, target_height), cfg.background)
    canvas.paste(image, ((target_width - width) // 2, (target_height - height) // 2))
    return canvas


def resize_variant(
    image: Image.Image, height: int, cfg: RenderConfig = RENDER
) -> Image.Image:
    """Lanczos-downsample to a delivery size and restore micro-contrast.

    Downsampling from the supersampled render is what keeps the vector overlays
    (handles, hinges, glazing bars) free of stair-stepping; the unsharp mask
    afterwards compensates for the softness the resample introduces.
    """
    width = max(1, round(image.width * height / image.height))
    resized = image.resize((width, height), Image.Resampling.LANCZOS)
    return resized.filter(
        ImageFilter.UnsharpMask(
            radius=cfg.unsharp_radius,
            percent=cfg.unsharp_percent,
            threshold=cfg.unsharp_threshold,
        )
    )


def export_cover(
    page: pymupdf.Page,
    out_dir: Path,
    filename: str = "cover.webp",
    target_width: int = 1400,
    cfg: RenderConfig = RENDER,
) -> str | None:
    """Export the lifestyle photograph from the catalogue cover.

    Unlike the product shots this is a single full-bleed photo, so it is taken
    as-is: the largest image on the page, rendered through its own placement
    rectangle.
    """
    candidates = [
        (rect, rect.width * rect.height)
        for image in page.get_images(full=True)
        for rect in page.get_image_rects(image[0])
        if not (rect & page.rect).is_empty
    ]
    if not candidates:
        return None

    rect = max(candidates, key=lambda item: item[1])[0] & page.rect
    zoom = max(1.0, target_width / rect.width)
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect, alpha=False)
    image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)

    out_dir.mkdir(parents=True, exist_ok=True)
    image.save(out_dir / filename, format="WEBP", quality=86, method=6)
    return filename


def export_views(
    page: pymupdf.Page,
    clip: pymupdf.Rect,
    band_height: float,
    slug: str,
    view: str,
    out_dir: Path,
    cfg: RenderConfig = RENDER,
) -> dict[str, str]:
    """Render one view and write every delivery size.

    `band_height` is the slot's shared vertical reference in PDF points.
    Returns a mapping of variant name to public URL.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    master = fit_to_canvas(
        flatten(render_slot(page, clip, cfg), cfg),
        band_height * cfg.supersample,
        cfg,
    )

    urls: dict[str, str] = {}
    for variant in cfg.variants:
        suffix = "" if variant.name == "full" else f"-{variant.name}"
        filename = f"{slug}-{view}{suffix}.webp"
        resize_variant(master, variant.height, cfg).save(
            out_dir / filename,
            format="WEBP",
            quality=variant.quality,
            method=6,
        )
        urls[variant.name] = f"{PUBLIC_IMAGE_BASE}/{filename}"

    return urls
