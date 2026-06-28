"""
Thin wrapper around the Google AI Studio (Gemini) generateContent REST API.

Design choices (read before changing prompts):
- The API key NEVER reaches the client. All calls happen here, server-side.
- Every legal-chat call is grounded with retrieved knowledge-base snippets
  (see services/knowledge_base.py) rather than asking the model to recall
  Nepal law from training data — this reduces hallucinated penalties/citations,
  but the knowledge base content itself still needs legal review.
- A disclaimer is appended at the service layer, not left to the model,
  so it can never be dropped regardless of what the model returns.
"""
import json
from typing import Optional

import httpx

from app.core.config import settings

DISCLAIMER_NE = (
    "⚠️ यो जानकारी सामान्य कानूनी शिक्षाका लागि मात्र हो र यो आधिकारिक कानूनी सल्लाह होइन। "
    "तपाईंको विशेष अवस्थाको लागि कृपया इजलासी वा कानून व्यवसायीसँग सम्पर्क गर्नुहोस्।"
)
DISCLAIMER_EN = (
    "⚠️ This information is for general legal awareness only and is not official legal advice. "
    "For your specific situation, please consult a licensed lawyer."
)


class AIServiceError(Exception):
    pass


def _build_system_prompt(language: str, context_snippets: list[str]) -> str:
    context_block = "\n\n".join(context_snippets) if context_snippets else "(no specific matching articles found — answer cautiously and generally)"
    lang_instruction = (
        "Respond in Nepali (Devanagari script), in a warm, clear, conversational tone."
        if language == "ne"
        else "Respond in English, in a warm, clear, conversational tone."
    )
    return f"""You are Kanoon Mitra, a Nepal legal-awareness assistant. You help everyday people in Nepal understand
laws, possible violations, possible penalties, and recommended next steps — for EDUCATIONAL purposes only.

Rules you must always follow:
1. Base your answer primarily on the CONTEXT below, which is drawn from a curated Nepal legal knowledge base.
   If the context does not clearly cover the question, say so plainly rather than guessing at specific penalty
   amounts, section numbers, or citations.
2. Never claim to be a lawyer or to give official legal advice. Always frame answers as general legal information.
3. Structure your answer with: (a) what law/area applies, (b) what the situation suggests (possible violation, if
   any), (c) possible consequences IF mentioned in context, (d) clear recommended next steps (e.g. which office to
   contact, what document to file).
4. {lang_instruction}
5. Keep the answer focused and practical — avoid long generic preambles.
6. Do not invent statute numbers, fines, or court procedures that are not present in the CONTEXT.

CONTEXT (Nepal legal knowledge base excerpts):
{context_block}
"""


async def generate_legal_response(
    user_message: str,
    language: str = "ne",
    context_snippets: Optional[list[str]] = None,
    conversation_history: Optional[list[dict]] = None,
) -> str:
    """
    Calls Gemini generateContent with a grounded system prompt.
    Raises AIServiceError on failure (caller should catch and show a friendly message).
    """
    if not settings.GEMINI_API_KEY:
        raise AIServiceError(
            "AI service is not configured. Set GEMINI_API_KEY in the backend .env file "
            "(get one from https://aistudio.google.com/app/apikey)."
        )

    system_prompt = _build_system_prompt(language, context_snippets or [])

    contents = []
    for turn in (conversation_history or [])[-10:]:  # cap history to last 10 turns
        gemini_role = "model" if turn["role"] == "assistant" else "user"
        contents.append({"role": gemini_role, "parts": [{"text": turn["content"]}]})
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    url = f"{settings.GEMINI_API_BASE}/models/{settings.GEMINI_MODEL}:generateContent"
    params = {"key": settings.GEMINI_API_KEY}
    body = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, params=params, json=body)
        if resp.status_code != 200:
            raise AIServiceError(f"AI provider returned {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise AIServiceError("AI provider returned no candidates (possibly blocked by safety filters).")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts).strip()
        if not text:
            raise AIServiceError("AI provider returned an empty response.")
        return text
    except httpx.RequestError as e:
        raise AIServiceError(f"Could not reach AI provider: {e}") from e


def disclaimer_for(language: str) -> str:
    return DISCLAIMER_NE if language == "ne" else DISCLAIMER_EN


async def generate_scam_analysis(text: str, language: str = "ne") -> dict:
    """Reuses the same grounded-call pattern for scam/fraud message analysis."""
    lang_instruction = "Respond in Nepali." if language == "ne" else "Respond in English."
    system_prompt = f"""You are a fraud-detection assistant for Nepali users. Analyze the suspicious message the user
provides and assess scam risk. {lang_instruction}
Respond ONLY with valid JSON, no markdown fences, in this exact shape:
{{"risk_level": "low|medium|high", "explanation": "short paragraph", "red_flags": ["flag1","flag2"], "recommended_action": "short actionable advice"}}
"""
    url = f"{settings.GEMINI_API_BASE}/models/{settings.GEMINI_MODEL}:generateContent"
    params = {"key": settings.GEMINI_API_KEY}
    body = {
        "contents": [{"role": "user", "parts": [{"text": text}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 512},
    }
    if not settings.GEMINI_API_KEY:
        raise AIServiceError("AI service is not configured. Set GEMINI_API_KEY in the backend .env file.")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, params=params, json=body)
        if resp.status_code != 200:
            raise AIServiceError(f"AI provider returned {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        parts = data["candidates"][0]["content"]["parts"]
        raw = "".join(p.get("text", "") for p in parts).strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(raw)
        return parsed
    except (httpx.RequestError, KeyError, IndexError, json.JSONDecodeError) as e:
        raise AIServiceError(f"Scam analysis failed: {e}") from e
