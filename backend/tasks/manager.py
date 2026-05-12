import asyncio
import uuid
from typing import Dict, Any

class TaskManager:
    def __init__(self):
        # task_id -> {"task": asyncio.Task, "queue": asyncio.Queue}
        self.active_tasks: Dict[str, Dict[str, Any]] = {}

    def create_task(self) -> str:
        task_id = str(uuid.uuid4())
        self.active_tasks[task_id] = {
            "task": None,
            "queue": asyncio.Queue()
        }
        return task_id

    def set_asyncio_task(self, task_id: str, task: asyncio.Task):
        if task_id in self.active_tasks:
            self.active_tasks[task_id]["task"] = task

    async def put_event(self, task_id: str, event: dict):
        if task_id in self.active_tasks:
            await self.active_tasks[task_id]["queue"].put(event)

    async def get_event(self, task_id: str) -> dict:
        if task_id in self.active_tasks:
            return await self.active_tasks[task_id]["queue"].get()
        return None

    def cancel_task(self, task_id: str) -> bool:
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]["task"]
            if task and not task.done():
                task.cancel()
            
            # Send a cancellation event so the stream closes
            try:
                self.active_tasks[task_id]["queue"].put_nowait({"type": "error", "message": "Research cancelled by user."})
                self.active_tasks[task_id]["queue"].put_nowait({"type": "complete"})
            except asyncio.QueueFull:
                pass

            return True
        return False

    def remove_task(self, task_id: str):
        if task_id in self.active_tasks:
            del self.active_tasks[task_id]

# Global instance
task_manager = TaskManager()
