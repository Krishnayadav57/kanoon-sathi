"""
Lightweight retrieval over the legal knowledge base to ground AI chat answers.

This uses simple keyword scoring rather than vector embeddings, which keeps the
stack free of an extra vector-DB dependency. It's adequate for a curated KB of a
few hundred articles. If the KB grows much larger, swap this for pgvector +
embeddings without changing the calling code (the function signature stays the
same: text in, ranked LegalArticle list out).
"""
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.knowledge_base import LegalArticle, LegalCategory

# Maps common keywords (English + Nepali) to category slugs, used both for
# the Situation Analyzer's category guess and to bias retrieval.
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "traffic": ["traffic", "license", "accident", "vehicle", "speeding", "helmet",
                "सवारी", "दुर्घटना", "लाइसेन्स", "ट्राफिक"],
    "cyber": ["cyber", "hacking", "online fraud", "facebook", "password", "social media", "harassment online",
              "साइबर", "ह्याक", "अनलाइन ठगी"],
    "consumer": ["consumer", "refund", "warranty", "defective product", "overcharge",
                 "उपभोक्ता", "रिफन्ड", "ठगी"],
    "labor": ["labor", "labour", "salary", "wages", "employer", "termination", "workplace",
              "ज्याला", "तलब", "श्रमिक", "कामदार"],
    "property": ["property", "land", "ownership", "tenant", "landlord", "rent",
                 "जमिन", "सम्पत्ति", "घरबहाल"],
    "business": ["business", "company", "registration", "tax", "vat", "pan",
                 "व्यवसाय", "कम्पनी", "कर"],
    "family": ["family", "marriage", "divorce", "custody", "domestic violence", "inheritance",
              "विवाह", "सम्बन्ध विच्छेद", "पारिवारिक"],
    "constitution": ["constitution", "fundamental rights", "citizenship",
                     "संविधान", "नागरिकता", "मौलिक हक"],
}


def guess_category(text: str) -> tuple[str, str]:
    """Returns (category_slug, confidence) based on keyword overlap."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for slug, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score:
            scores[slug] = score
    if not scores:
        return "general", "low"
    best_slug = max(scores, key=lambda s: scores[s])
    confidence = "high" if scores[best_slug] >= 2 else "medium"
    return best_slug, confidence


def retrieve_relevant_articles(db: Session, query_text: str, limit: int = 4) -> list[LegalArticle]:
    """Naive keyword-overlap ranking across title/summary fields, biased toward the guessed category."""
    category_slug, _ = guess_category(query_text)
    words = set(re.findall(r"[a-zA-Z\u0900-\u097F]{3,}", query_text.lower()))

    stmt = select(LegalArticle)
    if category_slug != "general":
        stmt = stmt.where(LegalArticle.category_slug == category_slug)
    candidates = db.execute(stmt).scalars().all()

    if not candidates:
        candidates = db.execute(select(LegalArticle)).scalars().all()

    def score(article: LegalArticle) -> int:
        haystack = f"{article.title_en} {article.title_ne} {article.summary_en} {article.summary_ne}".lower()
        return sum(1 for w in words if w in haystack)

    ranked = sorted(candidates, key=score, reverse=True)
    return ranked[:limit]


def build_context_snippets(articles: list[LegalArticle], language: str = "ne") -> list[str]:
    snippets = []
    for a in articles:
        title = a.title_ne if language == "ne" else a.title_en
        summary = a.summary_ne if language == "ne" else a.summary_en
        full = a.full_text_ne if language == "ne" else a.full_text_en
        body = full or summary
        snippets.append(f"[{a.source_reference or a.category_slug}] {title}\n{body}")
    return snippets


def get_category_by_slug(db: Session, slug: str) -> LegalCategory | None:
    return db.execute(select(LegalCategory).where(LegalCategory.slug == slug)).scalar_one_or_none()
