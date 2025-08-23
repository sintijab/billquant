# --- New endpoint for DOCX generation ---
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from rag_training import rag_query
from fastapi import Form

load_dotenv()

app = FastAPI()

# Allow CORS for local dev and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://billquant-1.onrender.com"],
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
