from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.extras import ScamCheck
from app.models.user import User
from app.schemas.legal import ScamCheckRequest, ScamCheckResponse
from app.services import ai_service

router = APIRouter(prefix="/scam-detection", tags=["Scam Detection"])


@router.post("/check", response_model=ScamCheckResponse)
async def check_scam(
    payload: ScamCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = await ai_service.generate_scam_analysis(payload.text, payload.language)
    except ai_service.AIServiceError as e:
        raise HTTPException(status_code=503, detail=f"Scam analysis unavailable: {e}")

    record = ScamCheck(
        user_id=current_user.id,
        submitted_text=payload.text,
        risk_level=result.get("risk_level", "unknown"),
        explanation=result.get("explanation", ""),
    )
    db.add(record)
    db.commit()

    return ScamCheckResponse(
        risk_level=result.get("risk_level", "unknown"),
        explanation=result.get("explanation", ""),
        red_flags=result.get("red_flags", []),
        recommended_action=result.get("recommended_action", ""),
        disclaimer=ai_service.disclaimer_for(payload.language),
    )
