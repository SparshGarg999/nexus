import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("nexus")

CORS_ORIGINS = [
    "http://localhost:8000",
    "http://localhost:3000",
]
if os.getenv("FRONTEND_URL"):
    cors_url = os.getenv("FRONTEND_URL")
    if cors_url not in CORS_ORIGINS:
        CORS_ORIGINS.append(cors_url)
if os.getenv("RENDER_EXTERNAL_URL"):
    CORS_ORIGINS.append(os.getenv("RENDER_EXTERNAL_URL"))

def get_groq_api_key():
    key = os.getenv("GROQ_API_KEY")
    if not key:
        logger.warning("GROQ_API_KEY is not set.")
    return key
