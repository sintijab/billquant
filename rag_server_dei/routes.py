# --- New endpoint for DOCX generation ---
from fastapi import Request

from rag_txt_chunk_pipeline_dei import embed_and_retrieve_dei
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from mistral_utils import answer_question
from fastapi import Form
import os
import re

load_dotenv()

app = FastAPI()

# Allow CORS for local dev and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://billquant-1.onrender.com", "http://localhost:5173/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/search_dei")
def search_piemonte(query: str = Form(...)):
    try:
        refined_query = answer_question(f"Define the construction activity category in italian that describes it best in Prezziario with one to max five words, first word must be the most accurate for: {query}")
        if isinstance(refined_query, dict) and "error" in refined_query:
            return refined_query
        results = embed_and_retrieve_dei(refined_query, all_chunks_file="DEI_chunks.txt", top_k=3, embeddings_path="chunk_embeddings_dei.pt")
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}
    