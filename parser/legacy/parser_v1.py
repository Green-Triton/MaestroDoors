"""АРХИВ. Первая версия парсера, в сборке не участвует.

Оставлена как история: именно её ограничения (составные двери, маски
прозрачности в соседних объектах, разное кадрирование двух видов) описаны
в parser/README.md и привели к текущей реализации в catalog_parser/.

Рабочая версия — `python parser/run.py`.
"""

""" first version """

# import fitz  # PyMuPDF
# import os

# pdf_path = "catalog.pdf"
# output_dir = "output"

# os.makedirs(output_dir, exist_ok=True)
# doc = fitz.open(pdf_path)

# for page_index in range(len(doc)):
#     page = doc[page_index]
#     image_list = page.get_images(full=True)

#     for img_index, img in enumerate(image_list):
#         xref = img[0]
#         smask = img[1]  # ID маски прозрачности

#         try:
#             # 1. Загружаем базовое изображение
#             pix = fitz.Pixmap(doc, xref)

#             # 2. Если есть маска прозрачности, накладываем её на картинку
#             if smask > 0:
#                 mask = fitz.Pixmap(doc, smask)
#                 # Переводим из CMYK в RGB перед наложением маски, если требуется
#                 if pix.n - pix.alpha > 3:
#                     pix = fitz.Pixmap(fitz.csRGB, pix)
                
#                 # Объединяем изображение с его маской
#                 pix = fitz.Pixmap(pix, mask)
#                 mask = None

#             # 3. Приводим цветовой профиль к RGB для корректного сохранения в PNG
#             if pix.n - pix.alpha > 3:
#                 pix = fitz.Pixmap(fitz.csRGB, pix)

#             # 4. Порог размера снижен до 100px, чтобы не пропускать маленькие задники дверей
#             if pix.width < 100 or pix.height < 100:
#                 pix = None
#                 continue

#             file_name = f"door_page_{page_index + 1}_img_{img_index + 1}.png"
#             file_path = os.path.join(output_dir, file_name)

#             pix.save(file_path)
#             print(f"Сохранено: {file_name} [{pix.width}x{pix.height}px]")

#         except Exception as e:
#             print(f"Ошибка при обработке картинки {img_index + 1} на стр. {page_index + 1}: {e}")
#         finally:
#             pix = None

# print("Готово!")


""" second version """

import fitz  # PyMuPDF
import os

pdf_path = "catalog.pdf"
output_dir = "output"

os.makedirs(output_dir, exist_ok=True)
doc = fitz.open(pdf_path)

ZOOM = 3 
mat = fitz.Matrix(ZOOM, ZOOM)

for page_index in range(len(doc)):
    page = doc[page_index]
    image_list = page.get_images(full=True)

    for img_index, img in enumerate(image_list):
        xref = img[0]
        rects = page.get_image_rects(xref)
        
        for r_index, rect in enumerate(rects):
            # 1. Ограничиваем rect рамками страницы (пересечение)
            safe_rect = rect & page.rect

            # 2. Проверяем, что область не пустая и не слишком маленькая
            if safe_rect.is_empty or safe_rect.width < 30 or safe_rect.height < 30:
                continue

            # 3. Рендерим кадрированную область
            pix = page.get_pixmap(matrix=mat, clip=safe_rect, alpha=True)

            # Проверка размеры рендер-пиксмапа
            if pix.width == 0 or pix.height == 0:
                pix = None
                continue

            file_name = f"door_p{page_index + 1}_img{img_index + 1}_{r_index + 1}.png"
            file_path = os.path.join(output_dir, file_name)

            # 4. Безопасное сохранение
            try:
                pix.save(file_path)
                print(f"Сохранено: {file_name} [{pix.width}x{pix.height}px]")
            except Exception as e:
                print(f"Пропущено {file_name} из-за ошибки сохранения: {e}")
            finally:
                pix = None

print("Готово! Все изображения успешно обработаны.")