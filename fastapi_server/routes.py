import moondream as md
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
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

@app.post("/analyze_image_moondream")
async def analyze_image_moondream(file: UploadFile = File(...)):
    """
    Analyze an uploaded image using the Moondream model.
    Expects an image file upload (multipart/form-data).
    Returns the answer and request_id from Moondream.
    """
    try:
        # Initialize Moondream model (replace with your actual API key)
        model = md.vl(api_key=api_key)
        from PIL import Image
        import io
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        result = model.query(image, "Describe from construction engineering point what has to be renovated and repaired. Don't repeat sentences and skip words disrepair and construction. Count objects and measures if possible. If it is floor map then give rooms and precise measurements with the numbers.")
        answer = result.get("answer", "")
        request_id = result.get("request_id", "")
        # Remove line breaks from answer
        answer_clean = answer.replace("\n", " ").replace("\r", " ").strip()
        return {"answer": answer_clean, "request_id": request_id}
    except Exception as e:
        return {"error": str(e)}