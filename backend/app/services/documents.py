from io import BytesIO
from pathlib import Path
from uuid import uuid4

from docx import Document as DocxDocument
from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}


async def extract_text(file: UploadFile) -> tuple[str, str]:
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if ext in {".txt", ".md"}:
        return data.decode("utf-8", errors="ignore"), ext
    if ext == ".pdf":
        reader = PdfReader(BytesIO(data))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        return text, ext
    if ext == ".docx":
        doc = DocxDocument(BytesIO(data))
        text = "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return text, ext
    raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")


def chunk_text(text: str, max_chars: int = 1200, overlap: int = 180) -> list[str]:
    cleaned = "\n".join(line.strip() for line in text.splitlines())
    paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if len(paragraph) <= max_chars:
            current = paragraph
            continue
        start = 0
        while start < len(paragraph):
            chunks.append(paragraph[start : start + max_chars])
            start += max_chars - overlap
        current = ""
    if current:
        chunks.append(current)
    return chunks

