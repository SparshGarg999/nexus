import os
import PyPDF2
from fastapi import UploadFile

async def process_upload(file: UploadFile) -> str:
    # If it's a pdf
    if file.filename.endswith(".pdf"):
        # Save temp file
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
            
        text = ""
        try:
            with open(temp_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            text = f"Error reading PDF: {str(e)}"
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        return text
        
    # If it's a text file
    elif file.filename.endswith(".txt") or file.filename.endswith(".md"):
        content = await file.read()
        return content.decode("utf-8", errors="ignore")
        
    else:
        return f"File type not fully supported for text extraction: {file.filename}"
