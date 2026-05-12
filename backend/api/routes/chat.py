from fastapi import APIRouter, BackgroundTasks
from backend.models.schemas import ChatRequest, ChatResponse
from backend.tasks.manager import task_manager
from backend.services.pipeline_service import run_research_pipeline
import asyncio

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    task_id = task_manager.create_task()
    
    # Start the pipeline as a background asyncio task managed by our manager
    # We use asyncio.create_task to get an actual Task object that we can cancel
    loop = asyncio.get_event_loop()
    task = loop.create_task(run_research_pipeline(task_id, request.topic, request.context))
    task_manager.set_asyncio_task(task_id, task)
    
    return ChatResponse(task_id=task_id, message="Research session started")
