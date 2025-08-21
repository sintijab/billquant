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
from rag_training import rag_query
from fastapi import Form
import os
import re
load_dotenv()
api_key = os.environ.get("MOONDREAM_API_KEY")
model = md.vl(api_key=api_key)

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

@app.post("/mistral_activity_list")
async def mistral(query: str = Form(...)):
    raw_answer = answer_question(query)
    # Remove outer quotes if present
    if raw_answer.startswith('"') and raw_answer.endswith('"'):
        raw_answer = raw_answer[1:-1]

    # Unescape escaped characters
    raw_answer = raw_answer.encode('utf-8').decode('unicode_escape')

    # Extract JSON from code block
    match = re.search(r"```json\s*({[\s\S]*?})\s*```", raw_answer, re.IGNORECASE)
    json_str = match.group(1) if match else raw_answer

    try:
        parsed_json = json.loads(json_str)
        if isinstance(parsed_json, str):
            parsed_json = json.loads(parsed_json)
    except json.JSONDecodeError:
        parsed_json = {"error": "Invalid JSON format", "raw_answer": raw_answer}
    return parsed_json

@app.post("/mistral_activity_categories")
async def mistral(query: str = Form(...)):
    raw_answer = find_categories(query)
    # Remove outer quotes if present
    if raw_answer.startswith('"') and raw_answer.endswith('"'):
        raw_answer = raw_answer[1:-1]

    # Unescape escaped characters
    raw_answer = raw_answer.encode('utf-8').decode('unicode_escape')
    
    match = re.search(r"```json\s*({[\s\S]*?})\s*```", raw_answer, re.IGNORECASE)
    json_str = match.group(1) if match else raw_answer
    
    print(raw_answer)
    # Extract JSON from code block
    # match = re.search(r"```json\s*({[\s\S]*?})\s*```", raw_answer, re.IGNORECASE)
    # json_str = match.group(1) if match else raw_answer

    try:
        parsed_json = json.loads(json_str)
        if isinstance(parsed_json, str):
            parsed_json = json.loads(parsed_json)
    except json.JSONDecodeError:
        parsed_json = {"error": "Invalid JSON format", "raw_answer": raw_answer}
    return parsed_json

@app.post("/extract_pdf_text")
async def extract_pdf_text(file: UploadFile = File(...)):
    """
    Extract text from an uploaded PDF file using PyMuPDF (fitz).
    Expects a PDF file upload (multipart/form-data).
    Returns the extracted text from all pages.
    """
    try:
        import fitz  # PyMuPDF
        contents = await file.read()
        with fitz.open(stream=contents, filetype="pdf") as doc:
            text = "\n".join(page.get_text() for page in doc)
        return {"text": text}
    except Exception as e:
        return {"error": str(e)}
    
@app.post("/analyze_image_moondream")
async def analyze_image_moondream(
    file: UploadFile = File(...),
    ocr: bool = Query(default=False, description="If true, use OCR-focused prompt."),
    notes: str = Query(default="", description="Additional notes for the analysis.")
):
    """
    Analyze an uploaded image using the Moondream model.
    Expects an image file upload (multipart/form-data).
    Returns the answer and request_id from Moondream.
    If ocr=true, uses a prompt focused on extracting all measurements, units, and quantities from floor maps or notes.
    If notes has text, uses a prompt focused on extracting all information from images with notes.
    """
    try:
        model = md.vl(api_key=api_key)
        from PIL import Image
        import io
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        if ocr:
            prompt = "Describe from image floor map notes all measurements, unity of measures and quantities, do not skip anything."
            prompt = (
                f"Describe from image floor map notes all measurements, unity of measures and quantities, do not skip anything. You must describe each type of room that you can find in the image. If the following text- {notes} - is about the image of the building you should describe from construction site what is the state and what has to be renovated and repaired."
            )
        else:
            prompt = "Describe from construction site what is the state and what has to be renovated and repaired. If it is floor map then give rooms and precise measurements the numbers. Add what objects are visible in the area if you find any. In addition you should add any suggestions for example paint and primer to be used for the walls and site access."
        result = model.query(image, prompt)

        answer = result.get("answer", "")
        request_id = result.get("request_id", "")
        answer_clean = answer.replace("\n", " ").replace("\r", " ").strip()
        return {"answer": answer_clean, "request_id": request_id}
    except Exception as e:
        return {"error": str(e)}

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
        print(refined_query)
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
        print(refined_query)
        results = embed_and_retrieve_dei(refined_query, all_chunks_file="DEI_chunks.txt", top_k=3, embeddings_path="chunk_embeddings_dei.pt")
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}
    