"""
Centralized application configuration.
All values are overridable via environment variables / .env file.
Never hardcode secrets here — this file defines shape and safe defaults only.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- App ---
    APP_NAME: str = "Kanoon Mitra API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # --- Security ---
    SECRET_KEY: str = "CHANGE_ME_INSECURE_DEV_KEY_DO_NOT_USE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:3000"


    # --- Database ---
    DATABASE_URL: str = (
        "postgresql+psycopg2://kanoon:kanoon@localhost:5432/kanoon_mitra"
    )

    # --- AI Provider (Google AI Studio / Gemini) ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_API_BASE: str = "https://generativelanguage.googleapis.com/v1beta"
    # --- Gemini Live API (real-time voice) ---
    GEMINI_LIVE_MODEL: str = "models/gemini-live-2.5-flash-native-audio"
    FREE_PLAN_DAILY_VOICE_SECONDS: int = 300   # 5 minutes for free users


    # --- Subscription limits ---
    FREE_PLAN_DAILY_MESSAGES: int = 10
    PREMIUM_MONTHLY_PRICE_NPR: int = 499

    # --- Payments: eSewa / Khalti (manual verification mode) ---
    # MANUAL mode: user pays directly to your eSewa/Khalti number via QR or mobile number,
    # then submits a transaction reference + screenshot for admin review — no live gateway
    # API integration needed. Set to "api" later if you get merchant API credentials.
    ESEWA_MODE: str = "manual"  # "manual" | "api"
    ESEWA_RECEIVER_NUMBER: str = ""       # your eSewa-registered mobile number
    ESEWA_RECEIVER_NAME: str = ""         # name on the eSewa account
    ESEWA_MERCHANT_CODE: str = "EPAYTEST"
    ESEWA_SECRET_KEY: str = ""
    ESEWA_BASE_URL: str = "https://rc-epay.esewa.com.np"

    KHALTI_MODE: str = "manual"
    KHALTI_RECEIVER_NUMBER: str = ""      # your Khalti-registered mobile number
    KHALTI_RECEIVER_NAME: str = ""        # name on the Khalti account
    KHALTI_PUBLIC_KEY: str = ""
    KHALTI_SECRET_KEY: str = ""
    KHALTI_BASE_URL: str = "https://a.khalti.com"

    # --- Stripe (card payments, international/test mode) ---
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_NPR_TO_USD_CENTS: int = 400  # fallback flat USD-cents price if you don't set up a Stripe Price object

    # --- File uploads ---
    MAX_UPLOAD_MB: int = 10
    UPLOAD_DIR: str = "./uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
