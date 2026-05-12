from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services.upload_service import process_upload

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        text = await process_upload(file)
        # We can either store this context in a DB/session or just return it to the frontend
        # For simplicity, we return it to the frontend to include in the /chat request
        return {"filename": file.filename, "extracted_text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
