from fastapi.responses import FileResponse
# --- New endpoint for DOCX generation ---
from fastapi import Request

import moondream as md
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import Query
import json
from mistral_utils import answer_question
from mistral_general import find_categories

from mistral_price_quotation import create_quotation

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

@app.post("/mistral_activity_list")
async def mistral(query: str = Form(...)):
    raw_answer = answer_question(query)
    # Remove outer quotes if present
    if raw_answer.startswith('"') and raw_answer.endswith('"'):
        raw_answer = raw_answer[1:-1]

    # Unescape escaped characters, but only if possible
    try:
        raw_answer = raw_answer.encode('utf-8').decode('unicode_escape')
    except Exception:
        pass

    # Extract JSON from code block
    # Extract JSON (object or array) from code block
    match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_answer, re.IGNORECASE)
    json_str = match.group(1) if match else raw_answer

    try:
        parsed_json = json.loads(json_str)
        if isinstance(parsed_json, str):
            parsed_json = json.loads(parsed_json)
    except json.JSONDecodeError:
        # Edge case: try to extract a JSON array from raw_answer/code block
        array_match = re.search(r"\[\s*{[\s\S]*?}\s*\]", raw_answer)
        if array_match:
            try:
                parsed_json = json.loads(array_match.group(0))
            except Exception:
                parsed_json = {"error": "Invalid JSON format", "raw_answer": raw_answer}
        else:
            parsed_json = {"error": "Invalid JSON format", "raw_answer": raw_answer}
    return parsed_json

@app.post("/mistral_activity_categories")
async def mistral(query: str = Form(...)):
    raw_answer = find_categories(query)
    # Remove outer quotes if present
    if raw_answer.startswith('"') and raw_answer.endswith('"'):
        raw_answer = raw_answer[1:-1]

    # Unescape escaped characters, but only if possible
    try:
        raw_answer = raw_answer.encode('utf-8').decode('unicode_escape')
    except Exception:
        pass
    
    match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_answer, re.IGNORECASE)
    json_str = match.group(1) if match else raw_answer

    def try_parse_any_json(s):
        # Try to extract and parse a JSON array or object from anywhere in the string
        array_match = re.search(r"\[\s*{[\s\S]*?}\s*\]", s)
        if array_match:
            try:
                return json.loads(array_match.group(0))
            except Exception:
                pass
        obj_match = re.search(r"{[\s\S]*?}", s)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except Exception:
                pass
        return None

    try:
        parsed_json = json.loads(json_str)
        if isinstance(parsed_json, str):
            parsed_json = json.loads(parsed_json)
    except json.JSONDecodeError:
        # Try to extract and parse any JSON array or object from the string
        parsed_json = try_parse_any_json(raw_answer)
        if parsed_json is None:
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
        from PIL import Image
        import io
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        if ocr:
            prompt = (
                f"Describe from image floor map notes all measurements, unity of measures and quantities, do not skip anything. You must describe each type of room that you can find in the image. If the following text- {notes} - is about the image of the building you should describe from construction site what is the state and what has to be renovated and repaired."
            )
        else:
            prompt = "Describe from construction site what is the state and what has to be renovated and repaired. If it is floor map then give rooms and precise measurements the numbers. Add what objects are visible in the area if you find any. In addition you should add any suggestions for example paint and primer to be used for the walls and site access."
        model = get_moondream_model()
        result = model.query(image, prompt)

        answer = result.get("answer", "")
        request_id = result.get("request_id", "")
        answer_clean = answer.replace("\n", " ").replace("\r", " ").strip()
        return {"answer": answer_clean, "request_id": request_id}
    except Exception as e:
        return {"error": str(e)}

@app.post("/mistral_price_quotation")
async def mistral_price_quotation(query: str = Form(...)):
    """
    Generate a price quotation and internal costs report using the Mistral LLM.
    Expects a string input (site description, timeline, draft BOQ, etc) via form data.
    Returns the LLM's JSON output (price_quotation and internal_costs).
    """
    try:
        raw_answer = create_quotation(query)
        # Remove outer quotes if present
        if raw_answer.startswith('"') and raw_answer.endswith('"'):
            raw_answer = raw_answer[1:-1]
        # Unescape escaped characters, but only if possible
        try:
            raw_answer = raw_answer.encode('utf-8').decode('unicode_escape')
        except Exception:
            pass
        # Extract JSON from code block if present
        import re
        match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_answer, re.IGNORECASE)
        json_str = match.group(1) if match else raw_answer
        # Try to parse JSON
        import json
        try:
            parsed_json = json.loads(json_str)
            if isinstance(parsed_json, str):
                parsed_json = json.loads(parsed_json)
        except Exception:
            parsed_json = {"error": "Invalid JSON format", "raw_answer": raw_answer}
        return parsed_json
    except Exception as e:
        return {"error": str(e)}
    
    
import os
from generate_price_quotation import generate_price_quotation
from generate_internal_costs import generate_internal_costs_doc

@app.post("/generate_price_quotation_docx")
async def generate_price_quotation_docx(request: Request):
    data = await request.json()
    # Try to call generate_price_quotation with both dict and object input
    try:
        output = generate_price_quotation(data)
    except Exception:
        # fallback: try to import and instantiate model if available
        try:
            from generate_price_quotation import PriceQuotationRequest
            req_obj = PriceQuotationRequest(**data)
            output = generate_price_quotation(req_obj)
        except Exception:
            return {"error": "Failed to generate price quotation document."}
    # Support both dict and string return for backward compatibility
    if isinstance(output, dict):
        output_path = output.get("output")
    else:
        output_path = output
    if not output_path or not isinstance(output_path, str) or not os.path.exists(output_path):
        return {"error": "Document not generated or file not found", "output_path": output_path}
    return FileResponse(output_path, filename="Price_Quotation_Report.docx", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


# --- New endpoint for internal costs DOCX generation ---
@app.post("/generate_internal_costs_docx")
async def generate_internal_costs_docx(request: Request):
    data = await request.json()
    try:
        output_path = generate_internal_costs_doc(data)
    except Exception as e:
        return {"error": f"Failed to generate internal costs document: {str(e)}"}
    if not output_path or not isinstance(output_path, str) or not os.path.exists(output_path):
        return {"error": "Document not generated or file not found", "output_path": output_path}
    return FileResponse(output_path, filename="Internal_Costs_Report.docx", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")