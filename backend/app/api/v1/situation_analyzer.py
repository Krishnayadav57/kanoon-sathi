from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.legal import SituationAnalyzeRequest, SituationAnalyzeResponse
from app.services import ai_service
from app.services.knowledge_base import build_context_snippets, get_category_by_slug, guess_category, retrieve_relevant_articles

router = APIRouter(prefix="/situation-analyzer", tags=["Situation Analyzer"])

CATEGORY_NAMES = {
    "traffic": ("Traffic Law", "सवारी कानून"),
    "cyber": ("Cyber Law", "साइबर कानून"),
    "consumer": ("Consumer Rights", "उपभोक्ता अधिकार"),
    "labor": ("Labor Law", "श्रम कानून"),
    "property": ("Property Law", "सम्पत्ति कानून"),
    "business": ("Business Law", "व्यवसाय कानून"),
    "family": ("Family Law", "पारिवारिक कानून"),
    "constitution": ("Constitutional Law", "संवैधानिक कानून"),
    "general": ("General Legal Matter", "सामान्य कानूनी विषय"),
}

NEXT_STEPS_TEMPLATES = {
    "traffic": ["Keep all accident/citation documents safe", "Visit the nearest Traffic Police office", "Contact your insurance provider if a vehicle is involved"],
    "cyber": ["Take screenshots of all evidence", "Do not delete the suspicious messages/account", "File a complaint with the Cyber Bureau, Nepal Police"],
    "consumer": ["Keep your purchase receipt/bill", "Contact the seller in writing first", "File a complaint with the Department of Consumer Protection if unresolved"],
    "labor": ["Keep your employment contract and payslips", "Raise the issue in writing with HR/employer first", "Contact the Labor Office if unresolved"],
    "property": ["Gather all land/property ownership documents", "Consult the Land Revenue/Survey Office", "Consider mediation before litigation"],
    "business": ["Review your company registration documents", "Check compliance deadlines (tax, renewal)", "Consult the Office of Company Registrar if needed"],
    "family": ["Prioritize safety if there is any risk of harm", "Keep relevant documents (marriage certificate, etc.)", "Consider family mediation services or a family-law lawyer"],
    "constitution": ["Identify which fundamental right is involved", "Document any violation clearly", "Consult a constitutional law expert for formal recourse"],
    "general": ["Document the situation with dates and evidence", "Identify which office or authority handles this area", "Consult a licensed lawyer for case-specific advice"],
}


@router.post("/analyze", response_model=SituationAnalyzeResponse)
async def analyze_situation(
    payload: SituationAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category_slug, confidence = guess_category(payload.description)
    name_en, name_ne = CATEGORY_NAMES.get(category_slug, CATEGORY_NAMES["general"])

    articles = retrieve_relevant_articles(db, payload.description)
    context_snippets = build_context_snippets(articles, language=payload.language)

    try:
        analysis_text = await ai_service.generate_legal_response(
            user_message=(
                f"Analyze this situation and explain the relevant law, possible issues, and what it means "
                f"for the person:\n\n{payload.description}"
            ),
            language=payload.language,
            context_snippets=context_snippets,
        )
    except ai_service.AIServiceError:
        analysis_text = (
            "यो विषय हाल AI विश्लेषणको लागि उपलब्ध छैन, तर तलका सान्दर्भिक कानूनी जानकारी हेर्नुहोस्।"
            if payload.language == "ne"
            else "AI analysis is temporarily unavailable, but please see the relevant legal information below."
        )

    return SituationAnalyzeResponse(
        detected_category=category_slug,
        category_name_en=name_en,
        category_name_ne=name_ne,
        confidence=confidence,
        analysis=analysis_text,
        suggested_next_steps=NEXT_STEPS_TEMPLATES.get(category_slug, NEXT_STEPS_TEMPLATES["general"]),
        related_articles=articles,
        disclaimer=ai_service.disclaimer_for(payload.language),
    )
