"""
Real-time Voice Assistant — WebSocket proxy to Gemini Live API.

Architecture:
  Browser <--WebSocket--> FastAPI backend <--WebSocket--> Gemini Live API

The Gemini API key NEVER reaches the browser.
Free users get FREE_PLAN_DAILY_VOICE_SECONDS per day (default 300 = 5 min).
Premium users get unlimited.
Language defaults to Nepali as requested.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone

import websockets
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models.user import SubscriptionPlan, User

router = APIRouter(tags=["Voice Assistant"])

logger = logging.getLogger("voice")

SYSTEM_INSTRUCTION_NE = (
    "तपाईं कानून मित्र हुनुहुन्छ — नेपालको कानूनी जागरूकता भ्वाइस सहायक। "
    "स्वाभाविक र मित्रवत् बोलीचाली शैलीमा, छोटा र स्पष्ट वाक्यमा जवाफ दिनुहोस्। "
    "नेपाली कानून सरल भाषामा व्याख्या गर्नुहोस्। "
    "सधैं स्पष्ट गर्नुहोस् कि यो सामान्य कानूनी जानकारी हो, आधिकारिक कानूनी सल्लाह होइन। "
    "विशेष अवस्थाको लागि योग्य वकिलसँग परामर्श लिन सुझाव दिनुहोस्।"
)

SYSTEM_INSTRUCTION_EN = (
    "You are Kanoon Mitra, a Nepal legal-awareness voice assistant. "
    "Speak naturally and conversationally in short, clear sentences suited for audio. "
    "Explain Nepal law in plain terms. Always clarify this is general legal information, "
    "not official legal advice, and suggest consulting a licensed lawyer for specific cases."
)


def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _get_user_from_token(db: Session, token: str):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.get(User, user_id)


def _is_premium_active(user: User) -> bool:
    if user.subscription_plan != SubscriptionPlan.PREMIUM:
        return False
    if (user.subscription_expires_at and
            user.subscription_expires_at < datetime.now(timezone.utc).replace(tzinfo=None)):
        return False
    return True


def _get_or_create_voice_usage(db: Session, user_id: str):
    """Lazy import to avoid circular if VoiceUsage model isn't yet in this codebase."""
    try:
        from app.models.extras import VoiceUsage
        today = _today_str()
        row = db.execute(
            select(VoiceUsage).where(
                VoiceUsage.user_id == user_id,
                VoiceUsage.usage_date == today,
            )
        ).scalar_one_or_none()
        if row is None:
            row = VoiceUsage(user_id=user_id, usage_date=today, seconds_used=0)
            db.add(row)
            db.commit()
            db.refresh(row)
        return row
    except Exception:
        logger.exception("Could not load/create VoiceUsage row")
        return None  # graceful degradation if VoiceUsage table not yet migrated


async def _safe_send_json(websocket: WebSocket, payload: dict) -> None:
    """Send only if the client socket is still open; never raise."""
    try:
        if websocket.client_state.name == "CONNECTED":
            await websocket.send_json(payload)
    except Exception:
        pass


@router.websocket("/ws/voice")
async def voice_ws(
    websocket: WebSocket,
    token: str = Query(...),
    language: str = Query(default="ne"),
):
    db = SessionLocal()
    usage_row = None
    session_start = None
    try:
        user = _get_user_from_token(db, token)
        if user is None or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid session.")
            return

        is_premium = _is_premium_active(user)
        usage_row = _get_or_create_voice_usage(db, user.id)

        # Daily limit check for free users
        if not is_premium and usage_row is not None:
            limit = getattr(settings, "FREE_PLAN_DAILY_VOICE_SECONDS", 300)
            if usage_row.seconds_used >= limit:
                await websocket.accept()
                await _safe_send_json(websocket, {
                    "type": "limit_reached",
                    "message": (
                        "तपाईंले आजको ५ मिनेट नि:शुल्क भ्वाइस समय सकाउनुभयो। "
                        "असीमित पहुँचको लागि प्रिमियममा अपग्रेड गर्नुहोस्।"
                        if language == "ne" else
                        "You've used today's 5-minute free voice limit. "
                        "Upgrade to Premium for unlimited access."
                    ),
                })
                await websocket.close()
                return

        if not settings.GEMINI_API_KEY:
            await websocket.accept()
            await _safe_send_json(websocket, {
                "type": "error",
                "message": "Voice assistant not configured (missing GEMINI_API_KEY).",
            })
            await websocket.close()
            return

        await websocket.accept()

        # Tell client how much time is left
        remaining = None
        if not is_premium and usage_row is not None:
            limit = getattr(settings, "FREE_PLAN_DAILY_VOICE_SECONDS", 300)
            remaining = max(0, limit - usage_row.seconds_used)

        await _safe_send_json(websocket, {"type": "ready", "remaining_seconds": remaining})

        # Build Gemini Live URL
        live_model = getattr(settings, "GEMINI_LIVE_MODEL", "models/gemini-live-2.5-flash-native-audio")
        gemini_url = (
            f"wss://generativelanguage.googleapis.com/ws/"
            f"google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
            f"?key={settings.GEMINI_API_KEY}"
        )

        system_instruction = SYSTEM_INSTRUCTION_NE if language == "ne" else SYSTEM_INSTRUCTION_EN

        # session_start must be set BEFORE we attempt the Gemini connection so
        # that even a connection that fails instantly still logs elapsed time
        # (usually ~0s) and, more importantly, so the finally block below can
        # always compute a valid elapsed duration no matter where we fail.
        session_start = asyncio.get_event_loop().time()

        try:
            async with websockets.connect(
                gemini_url,
                max_size=None,
                open_timeout=15,
                close_timeout=5,
            ) as gemini_ws:
                # Send setup message
                await gemini_ws.send(json.dumps({
                    "setup": {
                        "model": live_model,
                        "generationConfig": {
                            "responseModalities": ["AUDIO"],
                            "speechConfig": {
                                "voiceConfig": {
                                    "prebuiltVoiceConfig": {"voiceName": "Aoede"}
                                }
                            },
                        },
                        "systemInstruction": {"parts": [{"text": system_instruction}]},
                    }
                }))

                # Wait for Gemini's setupComplete acknowledgement (or an error)
                # before declaring the call "active". This surfaces bad model
                # names / auth issues as a clear error instead of an instant,
                # silent disconnect.
                try:
                    first_msg = await asyncio.wait_for(gemini_ws.recv(), timeout=10)
                    parsed_first = json.loads(first_msg) if isinstance(first_msg, (str, bytes)) else {}
                    if isinstance(parsed_first, dict) and "error" in parsed_first:
                        raise RuntimeError(f"Gemini Live setup rejected: {parsed_first['error']}")
                except asyncio.TimeoutError:
                    raise RuntimeError(
                        "Timed out waiting for Gemini Live to acknowledge setup. "
                        "Check GEMINI_LIVE_MODEL and that your API key has Live API access."
                    )

                stop_event = asyncio.Event()

                async def time_limit_watcher():
                    """Enforce daily limit for free users."""
                    if is_premium or remaining is None:
                        return
                    while not stop_event.is_set():
                        elapsed = asyncio.get_event_loop().time() - session_start
                        if elapsed >= remaining:
                            await _safe_send_json(websocket, {
                                "type": "limit_reached",
                                "message": (
                                    "तपाईंको नि:शुल्क भ्वाइस समय सकियो। प्रिमियममा अपग्रेड गर्नुहोस्।"
                                    if language == "ne" else
                                    "Your free voice time has ended. Upgrade to Premium."
                                ),
                            })
                            stop_event.set()
                            break
                        await asyncio.sleep(1)

                async def browser_to_gemini():
                    try:
                        while not stop_event.is_set():
                            data = await websocket.receive_text()
                            await gemini_ws.send(data)
                    except WebSocketDisconnect:
                        stop_event.set()
                    except Exception:
                        stop_event.set()

                async def gemini_to_browser():
                    try:
                        # Replay the first message we already consumed above
                        await websocket.send_text(
                            first_msg if isinstance(first_msg, str) else first_msg.decode("utf-8", errors="ignore")
                        )
                        while not stop_event.is_set():
                            msg = await gemini_ws.recv()
                            text = msg if isinstance(msg, str) else msg.decode("utf-8", errors="ignore")
                            await websocket.send_text(text)
                    except websockets.exceptions.ConnectionClosed:
                        stop_event.set()
                    except Exception:
                        stop_event.set()

                tasks = [
                    asyncio.create_task(browser_to_gemini()),
                    asyncio.create_task(gemini_to_browser()),
                    asyncio.create_task(time_limit_watcher()),
                ]
                await stop_event.wait()
                for t in tasks:
                    t.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)

        except Exception as e:
            logger.exception("Voice session error")
            await _safe_send_json(websocket, {"type": "error", "message": f"Voice session error: {e}"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.exception("Unhandled voice_ws error")
        await _safe_send_json(websocket, {"type": "error", "message": str(e)})
    finally:
        # ALWAYS persist elapsed usage, regardless of how/where the session
        # ended (clean close, exception, disconnect). This is the fix for
        # "5-minute limit resets on refresh" — previously this only ran when
        # the Gemini `async with` block exited normally.
        try:
            if usage_row is not None and session_start is not None:
                elapsed_s = int(asyncio.get_event_loop().time() - session_start)
                if elapsed_s > 0:
                    usage_row.seconds_used += elapsed_s
                    db.add(usage_row)
                    db.commit()
        except Exception:
            logger.exception("Failed to persist voice usage")
        db.close()
        try:
            await websocket.close()
        except Exception:
            pass


@router.get("/voice/usage-today")
def voice_usage_today(token: str = Query(...)):
    """Returns remaining free seconds for today — called before connecting to show the timer."""
    from fastapi import HTTPException
    db = SessionLocal()
    try:
        user = _get_user_from_token(db, token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session.")
        is_premium = _is_premium_active(user)
        if is_premium:
            return {"is_premium": True, "remaining_seconds": None}
        usage_row = _get_or_create_voice_usage(db, user.id)
        limit = getattr(settings, "FREE_PLAN_DAILY_VOICE_SECONDS", 300)
        remaining = max(0, limit - (usage_row.seconds_used if usage_row else 0))
        return {"is_premium": False, "remaining_seconds": remaining, "daily_limit_seconds": limit}
    finally:
        db.close()
