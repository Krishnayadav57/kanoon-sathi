# कानून मित्र — Kanoon Mitra

Nepal legal-awareness and assistance platform. Provides general legal education
based on Nepal law — **not a substitute for a licensed lawyer**.

## ⚠️ Before you do anything else: rotate your secrets

If you ever pasted a Stripe key, payment account number, or API key into a chat,
document, ticket, or anywhere outside your own `.env` file, **rotate it now**:

- Stripe: Dashboard → Developers → API keys → roll the secret key
- Gemini: Google AI Studio → delete the old key, generate a new one
- Treat eSewa/Khalti personal account numbers as semi-public once shared (they're
  payment *destinations*, not secrets, but double check no PINs/passwords were
  shared alongside them)

This project reads all credentials from environment variables only. Nothing is
hardcoded in source. **Never commit a real `.env` file** — `.gitignore` already
excludes it, keep it that way.

## What's real vs. what's scaffolded

**Fully working, tested end-to-end:**
- JWT auth (register/login/refresh)
- AI Legal Chat grounded in a Nepal-law knowledge base (Gemini API)
- Knowledge base browser (8 legal categories, seeded articles)
- Situation Analyzer
- Complaint Generator (police/cyber/municipality/consumer/grievance, NE+EN templates)
- User dashboard
- Subscription gating (free daily message limit vs premium)
- **Payments**: Stripe Checkout (card), eSewa/Khalti manual-verification flow
  (pay to your number → user submits screenshot + reference → admin approves
  in the admin panel → premium auto-activates)
- Admin dashboard: payment review queue, revenue summary, user list
- Browser-based voice (Web Speech API — mic input, text-to-speech output)
- Legal Learning quizzes, Office Locator, Lawyer Marketplace (demo data),
  Business Compliance reminders

**Scaffolded (DB models + endpoints exist, need more work before launch):**
- Image OCR for the Document Explainer (PDF text extraction works; scanned
  image OCR is not wired in — add Tesseract or a cloud OCR API)
- eSewa/Khalti *live merchant API* mode (manual mode is the default and is
  fully working; API mode is scaffolded for if/when you get merchant credentials)
- Ad placement components (model exists; AdSense script not embedded)
- Lawyer/office data is demo content — replace with verified real data

## ⚠️ Legal content needs human review

The knowledge-base articles (penalties, citations, procedures) are a
reasonable-effort starting point, **not verified by a licensed Nepali lawyer**.
Have someone with legal training review `backend/app/seed/seed_data.py` before
relying on this in production. The AI chat is grounded in this same content, so
fixing it there improves both the library and the chat.

## Local development

### Backend
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate  |  On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in real values

# For local dev, swap DATABASE_URL in .env to: sqlite:///./dev.db
alembic upgrade head    # or just run the app once — seed_data also creates tables
python -m app.seed.seed_data
# Manually copy .env.example to .env and fill in the values.
# For local dev, set DATABASE_URL in .env to: sqlite:///./dev.db
# After editing .env, run the following:

alembic upgrade head          # Create/update database tables
python -m app.seed.seed_data  # Seed the database with initial content
uvicorn app.main:app --reload
# For local dev, you can set DATABASE_URL in .env to: sqlite:///./dev.db
python run.py seed            # Create DB tables and seed initial data
python run.py                 # Start the development server
```
API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
App: http://localhost:3000

### Default admin login (CHANGE IMMEDIATELY)
```
email: admin@kanoonmitra.np
password: ChangeThisPassword123!
```

## Docker (recommended for production)

```bash
cp backend/.env.example backend/.env   # fill in real values
docker compose up --build -d
```
This starts Postgres, runs migrations + seed automatically, and serves the
backend on :8000 and frontend on :3000. Put a reverse proxy (Caddy/Nginx) with
TLS in front of both for a real domain.

## Configuring payments

### eSewa / Khalti (manual mode — default, no merchant API needed)
Set in `backend/.env`:
```
ESEWA_RECEIVER_NUMBER=9807778833
ESEWA_RECEIVER_NAME=Your Name
KHALTI_RECEIVER_NUMBER=9807778833
KHALTI_RECEIVER_NAME=Your Name
```
Users see these on `/pricing`, pay directly via the eSewa/Khalti app, then
submit a transaction reference + screenshot. You approve/reject from `/admin`.

### Stripe
1. Get keys from https://dashboard.stripe.com/apikeys
2. Set `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` in `backend/.env`
3. Create a webhook endpoint in the Stripe dashboard pointing to
   `https://yourdomain.com/api/v1/payments/stripe/webhook`, subscribed to
   `checkout.session.completed`, and put its signing secret in
   `STRIPE_WEBHOOK_SECRET`
4. Test with Stripe's test card `4242 4242 4242 4242` before going live

## Security checklist before going live

- [ ] Rotate every credential that was ever shared outside your own `.env`
- [ ] Set a strong random `SECRET_KEY` (`python -c "import secrets; print(secrets.token_urlsafe(64))"`)
- [ ] Set `DEBUG=false` in production
- [ ] Restrict `CORS_ORIGINS` to your real domain only
- [ ] Put the backend behind HTTPS (terminate TLS at your reverse proxy/load balancer)
- [ ] Change the seeded admin password immediately after first login
- [ ] Review rate limits in `app/main.py` for your expected traffic
- [ ] Have a lawyer review the legal knowledge-base content
- [ ] Set up regular Postgres backups
- [ ] Switch Stripe from test keys to live keys only after the above is done

## Project structure
```
kanoon-mitra/
  backend/        FastAPI + SQLAlchemy + PostgreSQL
  frontend/       Next.js 14 (App Router) + Tailwind
  docker-compose.yml
```
See `backend/app/api/v1/` for all API routes, `backend/app/models/` for the
full DB schema, and `frontend/app/` for every page.
