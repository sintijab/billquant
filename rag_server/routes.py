from fastapi.responses import FileResponse
# --- New endpoint for DOCX generation ---
from fastapi import Request

from rag_txt_chunk_pipeline import embed_and_retrieve
from rag_txt_chunk_pipeline_dei import embed_and_retrieve_dei
import moondream as md
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import Query, Body
import json
from mistral_utils import answer_question
from mistral_general import find_categories

from mistral_price_quotation import create_quotation

from rag_training import rag_query
from fastapi import Form
import os
import re

load_dotenv()

# Lazy singleton for Moondream model
_moondream_model = None
def get_moondream_model():
    global _moondream_model
    if _moondream_model is None:
        api_key = os.environ.get("MOONDREAM_API_KEY")
        _moondream_model = md.vl(api_key=api_key)
    return _moondream_model

app = FastAPI()

# Allow CORS for local dev and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/search_pat")
def search(query: str = Form(...)):
    # First, ask Mistral to redefine the construction activity category
    try:
        results = rag_query(query)
    except Exception as e:
        return {"error": str(e)}
    # If results is an error dict, return it directly
    if isinstance(results, dict) and "error" in results:
        return results
    # If results is a list of dicts, convert to strings and filter out None
    if isinstance(results, list):
        results = [r if isinstance(r, str) else str(r) for r in results if r is not None]
    else:
        results = [results] if results is not None else []
    from parse_activity_chunks import parse_activity_chunks
    parsed = parse_activity_chunks(results)
    return {"results": parsed}


# Piemonte RAG search endpoint
@app.post("/search_piemonte")
def search_piemonte(query: str = Form(...)):
    # First, ask Mistral to redefine the construction activity category
    try:
        refined_query = answer_question(f"Define the construction activity category in italian that describes it best in Prezziario with one to max five words, first word must be the most accurate for: {query}")
        if isinstance(refined_query, dict) and "error" in refined_query:
            return refined_query
        # Use the refined query for retrieval
        results = embed_and_retrieve(refined_query, all_chunks_file="all_chunks.txt", top_k=3, embeddings_path="chunk_embeddings_piemonte.pt")
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}

@app.post("/search_dei")
def search_piemonte(query: str = Form(...)):
    # First, ask Mistral to redefine the construction activity category
    try:
        refined_query = answer_question(f"Define the construction activity category in italian that describes it best in Prezziario with one to max five words, first word must be the most accurate for: {query}")
        if isinstance(refined_query, dict) and "error" in refined_query:
            return refined_query
        # Use the refined query for retrieval
        results = embed_and_retrieve_dei(refined_query, all_chunks_file="DEI_chunks.txt", top_k=3, embeddings_path="chunk_embeddings_dei.pt")
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}
    