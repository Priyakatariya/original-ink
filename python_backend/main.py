import os
import io
import re
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import fitz  # PyMuPDF
from docx import Document
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path="../backend/.env")  # Load env from old backend

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Global Memory Caches (Mocking DB)
fixed_document_cache = set()
fixed_lines_cache = set()

# Models
class PlagiarismRequest(BaseModel):
    text: str

class RewriteRequest(BaseModel):
    text: str

class RewriteAllRequest(BaseModel):
    fullText: str
    plagiarizedLines: List[str]


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_text = ""

        if file.filename.endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text() + "\n"
        
        elif file.filename.endswith(".docx"):
            doc = Document(io.BytesIO(content))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
                
        elif file.filename.endswith(".txt"):
            extracted_text = content.decode("utf-8")
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
            
        return {"success": True, "text": extracted_text.strip()}
    
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract text from file")


@app.post("/api/check-plagiarism")
async def check_plagiarism(req: PlagiarismRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Check Cache for AI Humanizer Bypass
    if text in fixed_document_cache:
        return {
            "success": True,
            "overall_plagiarism": 0,
            "ai_content": 0,
            "originality": 100,
            "plagiarized_lines": []
        }

    # Simulate Plagiarism Logic (Fallback mock)
    # Split text into chunks > 15 chars
    chunks = [c for c in re.split(r'\n+', text) if len(c.strip()) > 15]
    if not chunks:
        chunks = re.findall(r'[^.!?]+[.!?]+', text) or [text]

    total_words = len(text.split())
    plagiarized_words = 0
    plagiarized_lines = []

    for idx, chunk in enumerate(chunks):
        clean_chunk = chunk.strip()
        if len(clean_chunk) < 10:
            continue

        if clean_chunk in fixed_lines_cache:
            continue

        # Deterministic dummy logic
        if idx % 3 == 0 or 'using namespace' in clean_chunk.lower():
            chunk_words = len(clean_chunk.split())
            plagiarized_words += chunk_words
            sim_score = 60 + ((len(clean_chunk) * 7) % 35)

            plagiarized_lines.append({
                "text": clean_chunk,
                "score": sim_score
            })

    plag_score = min(100, round((plagiarized_words / max(total_words, 1)) * 100)) if plagiarized_words > 0 else 0
    ai_score = 40 + ((len(text) * 7) % 55)

    return {
        "success": True,
        "overall_plagiarism": plag_score,
        "ai_content": ai_score,
        "originality": 100 - plag_score,
        "plagiarized_lines": plagiarized_lines
    }


@app.post("/api/rewrite")
async def rewrite_text(req: RewriteRequest):
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an expert editor... Rewrite the content to bypass AI detection and remove plagiarism."},
                {"role": "user", "content": req.text}
            ],
            temperature=0.6,
            max_tokens=1024
        )
        rewritten = completion.choices[0].message.content or req.text
        fixed_lines_cache.add(rewritten.strip())
        return {"success": True, "rewritten": rewritten}
    except Exception as e:
        print(f"Rewrite Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to rewrite")


@app.post("/api/rewrite-all")
async def rewrite_all(req: RewriteAllRequest):
    try:
        plag_list = "\n".join([f'- "{l}"' for l in req.plagiarizedLines])
        system_prompt = """You are an expert editor and programmer. Rewrite to remove plagiarism and bypass AI detection.
CRITICAL INSTRUCTIONS:
1. Wrap new text in <fix> and </fix> tags.
2. Maintain academic tone and avoid AI buzzwords.
3. Only wrap changed parts, not the whole document."""

        user_prompt = f"PLAGIARIZED LINES TO FIX:\n{plag_list}\n\nFULL DOCUMENT:\n{req.fullText}"

        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=4000
        )
        
        rewritten = completion.choices[0].message.content or req.fullText
        clean_rewritten = re.sub(r'<\/?fix>', '', rewritten).strip()
        fixed_document_cache.add(clean_rewritten)

        return {"success": True, "rewritten": rewritten}
    except Exception as e:
        print(f"Rewrite All Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to rewrite all")
