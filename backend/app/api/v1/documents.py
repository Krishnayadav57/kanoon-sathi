"""
SCAFFOLD: Legal Document Explainer.
Upload works fully (validated, stored, DB row created). Text extraction from
images currently uses a naive PDF-text extraction for PDFs; image OCR is NOT
implemented (wire in Tesseract/cloud OCR before relying on this for scanned
images). The "explain" step calls the same grounded AI service used by chat.
"""
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.document import DocumentStatus, LegalDocument
from app.models.user import User
from app.services import ai_service

router = APIRouter(prefix="/documents", tags=["Legal Document Explainer"])

ALLOWED_MIME = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}


@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Only PDF, PNG, or JPEG files are supported.")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_MB:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    doc = LegalDocument(
        user_id=current_user.id,
        original_filename=file.filename,
        file_path=file_path,
        mime_type=file.content_type,
        status=DocumentStatus.UPLOADED,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "status": doc.status.value, "message": "Uploaded. Call /documents/{id}/explain to process."}


@router.post("/{document_id}/explain")
async def explain_document(document_id: str, language: str = "ne", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.get(LegalDocument, document_id)
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found.")

    extracted = doc.extracted_text
    if not extracted:
        if doc.mime_type == "application/pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(doc.file_path)
                extracted = "\n".join((page.extract_text() or "") for page in reader.pages)[:8000]
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Could not extract text from PDF: {e}")
        else:
            # SCAFFOLD: image OCR not implemented — plug in Tesseract/cloud OCR here.
            raise HTTPException(
                status_code=501,
                detail="Image OCR is not yet implemented in this build. Please upload a text-based PDF for now.",
            )
        doc.extracted_text = extracted
        db.add(doc)
        db.commit()

    if not extracted.strip():
        raise HTTPException(status_code=422, detail="No extractable text found in this document.")

    doc.status = DocumentStatus.PROCESSING
    db.add(doc)
    db.commit()

    try:
        explanation = await ai_service.generate_legal_response(
            user_message=(
                "Explain the following legal document in simple terms a non-lawyer can understand. "
                "Summarize: what type of document it is, key obligations/rights it creates, and anything "
                "the person should pay attention to.\n\nDOCUMENT TEXT:\n" + extracted[:6000]
            ),
            language=language,
            context_snippets=[],
        )
    except ai_service.AIServiceError as e:
        doc.status = DocumentStatus.FAILED
        db.add(doc)
        db.commit()
        raise HTTPException(status_code=503, detail=f"Explanation failed: {e}")

    if language == "ne":
        doc.explanation_ne = explanation
    else:
        doc.explanation_en = explanation
    doc.status = DocumentStatus.EXPLAINED
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "status": doc.status.value,
        "explanation": explanation,
        "disclaimer": ai_service.disclaimer_for(language),
    }


@router.get("/")
def list_my_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(LegalDocument).where(LegalDocument.user_id == current_user.id).order_by(LegalDocument.created_at.desc())
    docs = db.execute(stmt).scalars().all()
    return [
        {
            "id": d.id,
            "original_filename": d.original_filename,
            "status": d.status.value,
            "created_at": d.created_at,
        }
        for d in docs
    ]
