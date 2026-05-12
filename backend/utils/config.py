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
    # Add deployed frontend URLs here via ENV variables later
]
if os.getenv("FRONTEND_URL"):
    CORS_ORIGINS.append(os.getenv("FRONTEND_URL"))

def get_groq_api_key():
    key = os.getenv("GROQ_API_KEY")
    if not key:
        logger.warning("GROQ_API_KEY is not set.")
    return key
