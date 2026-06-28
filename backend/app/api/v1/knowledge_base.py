from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.knowledge_base import LegalArticle, LegalCategory, LegalNewsUpdate
from app.schemas.legal import LegalArticleListItem, LegalArticleOut, LegalCategoryOut

router = APIRouter(prefix="/knowledge-base", tags=["Legal Knowledge Base"])


@router.get("/categories", response_model=list[LegalCategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.execute(select(LegalCategory)).scalars().all()


@router.get("/articles", response_model=list[LegalArticleListItem])
def list_articles(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(LegalArticle)
    if category:
        stmt = stmt.where(LegalArticle.category_slug == category)
    articles = db.execute(stmt).scalars().all()
    if search:
        s = search.lower()
        articles = [
            a for a in articles
            if s in a.title_en.lower() or s in a.title_ne.lower() or s in a.summary_en.lower()
        ]
    return articles


@router.get("/articles/{article_id}", response_model=LegalArticleOut)
def get_article(article_id: str, db: Session = Depends(get_db)):
    article = db.get(LegalArticle, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")
    return article


@router.get("/news")
def list_news(db: Session = Depends(get_db)):
    news = db.execute(select(LegalNewsUpdate).order_by(LegalNewsUpdate.published_at.desc())).scalars().all()
    return news
