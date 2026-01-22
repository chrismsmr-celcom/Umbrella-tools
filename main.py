from fastapi import FastAPI, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pdf2docx import Converter
import os

app = FastAPI(title="Umbrella PDF Converter")

# Autoriser le front en ligne
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # plus tard, tu peux restreindre à ton front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dossier temporaire fixe
TMP_DIR = "/tmp/umbrella"
os.makedirs(TMP_DIR, exist_ok=True)

# Fonction pour supprimer fichiers après envoi
def cleanup_files(*files):
    for f in files:
        try:
            os.remove(f)
        except FileNotFoundError:
            pass

# Endpoint PDF → Word
@app.post("/convert/pdf-to-word")
async def convert_pdf_to_word(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    pdf_path = os.path.join(TMP_DIR, file.filename)
    docx_path = os.path.join(TMP_DIR, file.filename.replace(".pdf", ".docx"))

    # Sauvegarde PDF
    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    # Conversion PDF → DOCX
    try:
        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
    except Exception as e:
        # Nettoyage immédiat si erreur
        cleanup_files(pdf_path, docx_path)
        return {"error": str(e)}

    # Supprime les fichiers après téléchargement
    background_tasks.add_task(cleanup_files, pdf_path, docx_path)

    # Retourner le DOCX
    return FileResponse(docx_path, filename=file.filename.replace(".pdf", ".docx"))
