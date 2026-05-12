from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.utils.config import CORS_ORIGINS
from backend.api.routes import chat, stream, upload

app = FastAPI(title="NEXUS Multimodal AI Research Platform")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(chat.router, prefix="/api")
app.include_router(stream.router, prefix="/api")
app.include_router(upload.router, prefix="/api")

# Serve frontend static files
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def root():
    return FileResponse("frontend/index.html")
