from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---- Public read models ----

class LawSectionListItem(BaseModel):
    id: str
    section_number: str
    title_en: str
    title_ne: str

    class Config:
        from_attributes = True


class LawSectionDetail(LawSectionListItem):
    text_en: str
    text_ne: str
    explanation_en: str
    explanation_ne: str
    examples: list = []
    important_notes_en: str
    important_notes_ne: str
    audio_url_en: Optional[str] = None
    audio_url_ne: Optional[str] = None

    class Config:
        from_attributes = True


class LawChapterOut(BaseModel):
    id: str
    order_index: int
    title_en: str
    title_ne: str
    sections: list[LawSectionListItem] = []

    class Config:
        from_attributes = True


class LawListItem(BaseModel):
    id: str
    slug: str
    title_en: str
    title_ne: str
    category_slug: str
    short_description_en: str
    short_description_ne: str
    cover_icon: str

    class Config:
        from_attributes = True


class LawDetail(LawListItem):
    chapters: list[LawChapterOut] = []

    class Config:
        from_attributes = True


# ---- Admin CMS write models ----

class LawCreate(BaseModel):
    slug: str
    title_en: str
    title_ne: str
    category_slug: str
    short_description_en: str = ""
    short_description_ne: str = ""
    year_bs: Optional[str] = None
    source_reference: str = ""
    cover_icon: str = "scale"


class LawChapterCreate(BaseModel):
    law_id: str
    order_index: int = 0
    title_en: str
    title_ne: str


class LawSectionCreate(BaseModel):
    chapter_id: str
    order_index: int = 0
    section_number: str = ""
    title_en: str
    title_ne: str
    text_en: str = ""
    text_ne: str = ""
    explanation_en: str = ""
    explanation_ne: str = ""
    examples: list = []
    important_notes_en: str = ""
    important_notes_ne: str = ""


class PublishStatusUpdate(BaseModel):
    status: str = Field(pattern="^(draft|published|scheduled|archived)$")
    publish_at: Optional[datetime] = None


# ---- Gamification / personal area ----

class LearningProfileOut(BaseModel):
    xp_total: int
    level: str
    current_streak_days: int
    longest_streak_days: int
    daily_goal_sections: int
    sections_completed_today: int = 0

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    section_id: str
    content: str = Field(min_length=1, max_length=5000)
