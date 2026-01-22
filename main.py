from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pdf2docx import Converter
import tempfile
import os

app = FastAPI(title="Umbrella PDF Converter")

# ⚡ CORS pour front-end distant
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tu pourras limiter plus tard à ton front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/convert/pdf-to-word")
async def convert_pdf_to_word(file: UploadFile = File(...)):
    # créer un fichier temporaire
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
        tmp_pdf.write(await file.read())
        tmp_pdf_path = tmp_pdf.name

    docx_path = tmp_pdf_path.replace(".pdf", ".docx")
    
    try:
        cv = Converter(tmp_pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
    except Exception as e:
        return {"error": str(e)}
    
    # renvoyer le fichier DOCX
    response = FileResponse(path=docx_path, filename=file.filename.replace(".pdf", ".docx"))

    # cleanup après envoi
    os.remove(tmp_pdf_path)
    os.remove(docx_path)

    return response
