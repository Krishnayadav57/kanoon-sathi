from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---- Knowledge base ----

class LegalCategoryOut(BaseModel):
    slug: str
    name_en: str
    name_ne: str
    icon: str
    description_en: str
    description_ne: str

    class Config:
        from_attributes = True


class LegalArticleOut(BaseModel):
    id: str
    category_slug: str
    title_en: str
    title_ne: str
    summary_en: str
    summary_ne: str
    full_text_en: str
    full_text_ne: str
    source_reference: str
    last_verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LegalArticleListItem(BaseModel):
    id: str
    category_slug: str
    title_en: str
    title_ne: str
    summary_en: str
    summary_ne: str
    source_reference: str

    class Config:
        from_attributes = True


# ---- Situation Analyzer ----

class SituationAnalyzeRequest(BaseModel):
    description: str = Field(min_length=5, max_length=3000)
    language: str = Field(default="ne", pattern="^(ne|en)$")


class SituationAnalyzeResponse(BaseModel):
    detected_category: str
    category_name_en: str
    category_name_ne: str
    confidence: str  # 'high' | 'medium' | 'low'
    analysis: str
    suggested_next_steps: list[str]
    related_articles: list[LegalArticleListItem]
    disclaimer: str


# ---- Complaint generator ----

class ComplaintGenerateRequest(BaseModel):
    complaint_type: str = Field(pattern="^(police|cyber_bureau|municipality|consumer|office_grievance)$")
    language: str = Field(default="ne", pattern="^(ne|en)$")
    full_name: str
    address: str
    contact_number: str
    incident_date: str
    incident_location: str
    incident_description: str = Field(min_length=10, max_length=3000)
    respondent_name: Optional[str] = None  # who/what the complaint is against
    additional_details: Optional[str] = None


class ComplaintOut(BaseModel):
    id: str
    complaint_type: str
    generated_text: str
    language: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Scam detection ----

class ScamCheckRequest(BaseModel):
    text: str = Field(min_length=5, max_length=4000)
    language: str = Field(default="ne", pattern="^(ne|en)$")


class ScamCheckResponse(BaseModel):
    risk_level: str
    explanation: str
    red_flags: list[str]
    recommended_action: str
    disclaimer: str
