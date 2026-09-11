from fastapi import APIRouter, UploadFile, File, HTTPException
from pypdf import PdfReader
from pathlib import Path
import shutil
import uuid


router = APIRouter()


UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_id = str(uuid.uuid4())

    safe_filename = f"{file_id}_{file.filename}"

    file_path = UPLOAD_DIR / safe_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to save file: {str(e)}"
        )

    try:
        reader = PdfReader(str(file_path))

        extracted_text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                extracted_text += page_text + "\n"

    except Exception as e:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail=f"Unable to read PDF: {str(e)}"
        )

    extracted_text = extracted_text.strip()

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail=(
                "No readable text found in this PDF. "
                "Please upload a text-based PDF resume."
            )
        )

    return {
        "success": True,
        "message": "Resume uploaded and text extracted successfully.",
        "filename": file.filename,
        "stored_filename": safe_filename,
        "text_length": len(extracted_text),
        "resume_text": extracted_text
    }