# BillQuant Setup Guide

## Prerequisites
- Node.js (v18+ recommended)
- Python 3.8+
- (Optional, for local env vars) `python-dotenv`

---

## 1. Running the Client (Frontend)

```
cd client
npm install
npm run dev
```
- The app will be available at http://localhost:5173 (or as shown in your terminal).

---

## 2. Running the Server (FastAPI Backend)

```
cd fastapi_server
pip install -r requirements.txt
# (Optional) Create a .env file and add your API keys, e.g.:
# MOONDREAM_API_KEY=your_api_key_here
uvicorn routes:app --reload
```
- The API will be available at http://localhost:8000

---

## 3. Environment Variables
- Store sensitive keys (like API keys) in a `.env` file or your deployment environment.
- If using `.env`, make sure `python-dotenv` is installed and loaded in your FastAPI app.

---

## 4. Usage
- Open the client in your browser and follow the UI to create projects, upload images, and generate site visit documentation.
- The client will communicate with the FastAPI backend for AI-powered features.

---

## 5. Troubleshooting
- If you see errors about missing packages, re-run the install commands above.
- For CORS/API errors, ensure both client and server are running and accessible.
- For API key issues, check your environment variable setup.

---

## 6. Project Structure
- `client/` — React frontend
- `fastapi_server/` — FastAPI backend

---

## 7. Deployment
- Deploy client and server separately (e.g., Vercel for frontend, Render/Heroku for backend).
- Set environment variables in your deployment dashboard for security.

---

For more help, contact the project maintainer.
