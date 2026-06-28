# Kanoon Mitra — Architecture Plan (Phase 1: Core)

## Scope for this build (Path A)
FULLY WORKING:
- Auth (JWT, register/login, roles: user/admin)
- AI Legal Chat (Gemini API, grounded in knowledge base context, Nepali+English, disclaimers)
- Nepal Legal Knowledge Base (8 categories, browsable, seeded with real structured content + citations)
- Situation Analyzer (rule-assisted categorization + AI explanation)
- Complaint Generator (template engine, 5 complaint types, downloadable)
- User Dashboard (saved chats, saved documents, history)
- Subscription model (Free/Premium - DB + gating logic, no live payment yet)

SCAFFOLDED (DB models + API stub + minimal UI, clearly marked TODO):
- Payments (eSewa/Khalti) - full schema + webhook route shape + signature verification stub
- Legal Document Explainer (upload endpoint + OCR hook stub)
- Voice Assistant (STT/TTS hook stub using Web Speech API client-side)
- Scam Detection (endpoint stub using same AI grounding pattern)
- Legal Learning Mode (quiz schema + 1 seeded quiz)
- Legal News (model + static seed)
- Office Locator (model + seed data, static map)
- Lawyer Marketplace (model + listing stub)
- Business Compliance Assistant (model + reminder stub)
- Student/Senior/Emergency modes (UI flags, simplified routes)
- Ads system (placement component, flag-gated)
- Admin dashboard (user/revenue/sub views with real queries on seeded data)

## Stack
- Backend: FastAPI + SQLAlchemy + PostgreSQL + Alembic + JWT (python-jose) + Pydantic v2
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind
- AI: Google Gemini API (gemini-2.0-flash) via REST, server-side only, key in env
- Containerization: Docker + docker-compose (postgres + backend + frontend)

## Folder structure
kanoon-mitra/
  backend/
    app/
      main.py
      core/ (config, security, deps)
      db/ (session, base)
      models/
      schemas/
      api/v1/ (routers per feature)
      services/ (ai_service, knowledge_base, complaint_templates)
      seed/
    alembic/
    requirements.txt
    Dockerfile
  frontend/
    app/ (Next App Router pages)
    components/
    lib/
    Dockerfile
  docker-compose.yml
  .env.example
  README.md
