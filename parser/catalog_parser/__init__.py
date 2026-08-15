"""Catalogue extraction pipeline.

Turns the printed door catalogue (PDF) into the two artefacts the storefront
needs: composited product shots and a structured catalogue dataset.
"""

from .models import Catalog, Collection, Door, DoorImages, DoorSpecs, SpecEntry
from .pipeline import extract

__all__ = [
    "Catalog",
    "Collection",
    "Door",
    "DoorImages",
    "DoorSpecs",
    "SpecEntry",
    "extract",
]

__version__ = "1.0.0"
