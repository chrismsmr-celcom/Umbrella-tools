from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import uuid
import zipfile

from pdf2docx import Converter
from docx2pdf import convert
from PIL import Image
from pdf2image import convert_from_path

# ======================
# APP CONFIG
# ======================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TMP_DIR = "/tmp"


def safe_remove(path: str):
    if os.path.exists(path):
        os.remove(path)

# ======================
# PDF → WORD
# ======================
@app.post("/convert/pdf-to-word")
async def pdf_to_word(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    uid = str(uuid.uuid4())
    pdf_path = f"{TMP_DIR}/{uid}.pdf"
    docx_path = f"{TMP_DIR}/{uid}.docx"

    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    cv = Converter(pdf_path)
    cv.convert(docx_path)
    cv.close()

    if not os.path.exists(docx_path):
        raise RuntimeError("Erreur conversion PDF → Word")

    background_tasks.add_task(safe_remove, pdf_path)
    background_tasks.add_task(safe_remove, docx_path)

    return FileResponse(docx_path, filename="pdf-to-word.docx")


# ======================
# WORD → PDF
# ======================
@app.post("/convert/word-to-pdf")
async def word_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    uid = str(uuid.uuid4())
    docx_path = f"{TMP_DIR}/{uid}.docx"
    pdf_path = f"{TMP_DIR}/{uid}.pdf"

    with open(docx_path, "wb") as f:
        f.write(await file.read())

    convert(docx_path, pdf_path)

    if not os.path.exists(pdf_path):
        raise RuntimeError("Erreur conversion Word → PDF")

    background_tasks.add_task(safe_remove, docx_path)
    background_tasks.add_task(safe_remove, pdf_path)

    return FileResponse(pdf_path, filename="word-to-pdf.pdf")


# ======================
# IMAGES → PDF
# ======================
@app.post("/convert/images-to-pdf")
async def images_to_pdf(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...)
):
    images = []

    for file in files:
        img = Image.open(file.file)
        if img.mode != "RGB":
            img = img.convert("RGB")
        images.append(img)

    if not images:
        raise RuntimeError("Aucune image reçue")

    uid = str(uuid.uuid4())
    pdf_path = f"{TMP_DIR}/{uid}.pdf"

    images[0].save(pdf_path, save_all=True, append_images=images[1:])

    if not os.path.exists(pdf_path):
        raise RuntimeError("Erreur Images → PDF")

    background_tasks.add_task(safe_remove, pdf_path)

    return FileResponse(pdf_path, filename="images-to-pdf.pdf")


# ======================
# PDF → IMAGES (ZIP)
# ======================
@app.post("/convert/pdf-to-images")
async def pdf_to_images(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    uid = str(uuid.uuid4())
    pdf_path = f"{TMP_DIR}/{uid}.pdf"
    zip_path = f"{TMP_DIR}/{uid}.zip"

    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    images = convert_from_path(pdf_path)

    with zipfile.ZipFile(zip_path, "w") as zipf:
        for i, img in enumerate(images, start=1):
            img_path = f"{TMP_DIR}/page_{i}.png"
            img.save(img_path, "PNG")
            zipf.write(img_path, f"page_{i}.png")
            os.remove(img_path)

    if not os.path.exists(zip_path):
        raise RuntimeError("Erreur PDF → Images")

    background_tasks.add_task(safe_remove, pdf_path)
    background_tasks.add_task(safe_remove, zip_path)

    return FileResponse(zip_path, filename="pdf-to-images.zip")
