import moondream as md
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import Query
import os
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
            prompt = "Describe from image floor map notes all measurements, unity of measures and quantities, do not skip anything. You must describe each type of room that you can find in the image."
        elif notes:
            prompt = (
                f"Describe from image floor map notes all measurements, unity of measures and quantities, do not skip anything. You must describe each type of room that you can find in the image. If the following text- {notes} - is about the image of the building you should describe from construction site what is the state and what has to be renovated and repaired."
            )
        else:
            prompt = "Describe from construction site what is the state and what has to be renovated and repaired. If it is floor map then give rooms and precise measurements the numbers. Add what objects are visible in the area if you find any."
        result = model.query(image, prompt)

        answer = result.get("answer", "")
        request_id = result.get("request_id", "")
        answer_clean = answer.replace("\n", " ").replace("\r", " ").strip()
        return {"answer": answer_clean, "request_id": request_id}
    except Exception as e:
        return {"error": str(e)}