from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.tasks.manager import task_manager
import json
import asyncio

router = APIRouter()

async def sse_generator(task_id: str):
    try:
        while True:
            event = await task_manager.get_event(task_id)
            if not event:
                await asyncio.sleep(0.1)
                continue
                
            yield f"data: {json.dumps(event)}\n\n"
            
            if event.get("type") == "complete":
                break
    except asyncio.CancelledError:
        pass
    finally:
        task_manager.remove_task(task_id)

@router.get("/stream/{task_id}")
async def stream_task(task_id: str):
    if task_id not in task_manager.active_tasks:
        raise HTTPException(status_code=404, detail="Task not found or already completed")
    return StreamingResponse(sse_generator(task_id), media_type="text/event-stream")

@router.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    if task_manager.cancel_task(task_id):
        return {"status": "cancelled", "task_id": task_id}
    raise HTTPException(status_code=404, detail="Task not found")
