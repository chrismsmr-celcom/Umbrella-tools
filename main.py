from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from pdf2image import convert_from_path
from PIL import Image
import os
from pathlib import Path
import tempfile

app = FastAPI(title="Umbrella PDF Tools")

UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

# -------------------------------
# Image → PDF
# -------------------------------
@app.post("/convert/images-to-pdf")
async def images_to_pdf(files: list[UploadFile] = File(...)):
    if not files:
        return {"error": "Aucun fichier envoyé."}

    images = []
    for file in files:
        image = Image.open(file.file).convert("RGB")
        images.append(image)

    output_pdf_path = UPLOAD_FOLDER / "output.pdf"
    images[0].save(output_pdf_path, save_all=True, append_images=images[1:])
    return FileResponse(output_pdf_path, filename="output.pdf")


# -------------------------------
# PDF → Images
# -------------------------------
@app.post("/convert/pdf-to-images")
async def pdf_to_images(file: UploadFile = File(...)):
    if not file:
        return {"error": "Aucun fichier envoyé."}

    temp_pdf = UPLOAD_FOLDER / "temp.pdf"
    with open(temp_pdf, "wb") as f:
        f.write(await file.read())

    # Indique le chemin vers Poppler sur Render si besoin
    poppler_path = None  # Exemple: "/opt/render/project/src/poppler-25.12.0/Library/bin"

    images = convert_from_path(str(temp_pdf), poppler_path=poppler_path)
    output_folder = UPLOAD_FOLDER / "pdf_images"
    output_folder.mkdir(exist_ok=True)

    output_files = []
    for i, img in enumerate(images):
        img_path = output_folder / f"page_{i+1}.png"
        img.save(img_path, "PNG")
        output_files.append(img_path)

    return {"images": [str(f) for f in output_files]}

