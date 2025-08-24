# BillQuant: Regional and National Prezziario AI Search

BillQuant is a Retrieval-Augmented Generation (RAG) platform for searching and analyzing official Italian construction price lists (Prezziari) using Artificial Intelligence.

##  AI Quotation framework

This project is using techniques within Artificial Intelligence that combines standards of agentic orchestration following solution design, system integration and architecture provided by [CO-FUN](https://cofun.digital/) brand that specialize in AI software engineering.

For general questions, inquiries or project, contact [Sintija Birgele](https://de.linkedin.com/in/sintija-birgele).

Using AI models (like SentenceTransformer) to semantically search a large database of documents or "chunks" (here, items from the Prezziario) and find the most relevant information for a user's query.
Generation: Using a language model like Mistral to interpret, refine, and re-rank the results, or to generate a natural language response based on the retrieved information.
By integrating these, the system can answer complex, open-ended questions about the Prezziario. This approach leverages AI for both understanding user intent and navigating large, structured datasets, making the server much more powerful and dynamic than simple keyword search or static lookup tables.

##  Document sources for the knowledge base
It consists of a modern web client and multiple FastAPI backend servers, each dedicated to a specific Prezziario source:

- **PAT (Trento) Server:**
	Searches the Prezziario for the Trento region, using official data.

- **Piemonte Server:**
	Searches the Prezziario for the Piemonte region, using official data.

- **DEI Server:**
	Searches the national DEI Prezziario, a standardized construction cost list published by DEI Tipografia del Genio Civile, used as a reference across Italy.

**Update Requirement:**
All Prezziari are updated periodically by their respective authorities. To guarantee price accuracy and compliance, the files and embeddings used by each server must be updated each year or whenever a new official version is released.

---

## See Also

- [BillQuant RAG Server (PAT/Trento)](../rag_server_pat/README.md)
- [BillQuant RAG Server (Piemonte)](../rag_server_pat/README.md)
- [BillQuant RAG Server (DEI)](../rag_server_dei/README.md)

---

# BillQuant Setup Guide

## Prerequisites

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
