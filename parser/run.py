"""CLI entry point for the catalogue extraction pipeline.

    python parser/run.py                     # full run, default paths
    python parser/run.py --pdf other.pdf     # different source catalogue
    python parser/run.py --keep              # do not wipe the image folder first
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from maestro_parser import extract  # noqa: E402
from maestro_parser.config import (  # noqa: E402
    DEFAULT_DATA_PATH,
    DEFAULT_IMAGE_DIR,
    DEFAULT_PDF_PATH,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="maestro-parser",
        description="Извлекает изображения и характеристики дверей из PDF-каталога.",
    )
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF_PATH, help="исходный каталог")
    parser.add_argument("--images", type=Path, default=DEFAULT_IMAGE_DIR, help="каталог для изображений")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH, help="файл датасета")
    parser.add_argument("--keep", action="store_true", help="не очищать каталог изображений")
    parser.add_argument("--quiet", action="store_true", help="без построчного вывода")
    args = parser.parse_args()

    print(f"Источник : {args.pdf}")
    print(f"Картинки : {args.images}")
    print(f"Данные   : {args.data}\n")

    try:
        catalog = extract(
            pdf_path=args.pdf,
            image_dir=args.images,
            data_path=args.data,
            clean=not args.keep,
            verbose=not args.quiet,
        )
    except FileNotFoundError as error:
        print(f"Ошибка: {error}", file=sys.stderr)
        return 1

    images = len(list(args.images.glob("*.webp")))
    print(
        f"\nГотово. Дверей: {len(catalog.doors)}, "
        f"коллекций: {len(catalog.collections)}, файлов изображений: {images}."
    )
    for collection in catalog.collections:
        print(f"   {collection.title:<20} {collection.count:>3} шт.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
