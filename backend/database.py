import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client


# ---------------------------------------------------------
# LOAD BACKEND .ENV
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


# ---------------------------------------------------------
# SUPABASE CONFIGURATION
# ---------------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_SECRET_KEY = os.getenv(
    "SUPABASE_SECRET_KEY"
)


# ---------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------

if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is not configured in backend/.env"
    )


if not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "SUPABASE_SECRET_KEY is not configured in backend/.env"
    )


# ---------------------------------------------------------
# SUPABASE CLIENT
# ---------------------------------------------------------

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)