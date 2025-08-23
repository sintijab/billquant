import os
import re
import json
from langchain.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv

load_dotenv()
# Mistral setup
if "MISTRAL_API_KEY" not in os.environ:
    raise RuntimeError("MISTRAL_API_KEY not found in environment. Please set it in your .env file.")

llm = ChatMistralAI(
    model="mistral-small-latest",
    temperature=0,
    max_retries=2,
)

boq = [
    {
        "type": "main",
        "activity": "Demolizione di finestre esistenti",
        "mainCategory": "Restauro e ristrutturazione",
        "priceSource": "pat",
        "code": "B.39.05.0052.010",
        "title": "VERNICIATURA DI STRUTTURE E MANUFATTI ZINCATI - CLASSE C3 fuori opera: strutture e manufatti con elementi reticolari kg 1",
        "unit": "kg",
        "quantity": "1.0",
        "resources": [
            {
                "code": "B.39.05.0052.010",
                "description": "VERNICIATURA DI STRUTTURE E MANUFATTI ZINCATI - CLASSE C3 fuori opera: strutture e manufatti con elementi reticolari kg 1",
                "formula": "",
                "unit": "kg",
                "quantity": "None",
                "price": "None",
                "total": "None"
            },
            {
                "code": "Z.55.85.0052.010",
                "description": "VERNICIATURA DI STRUTTURE E MANUFATTI ZINCATI - CLASSE C3 fuori opera: strutture e manufatti con elementi reticolari (Costo materiali fc - Costo materiali fc) kg 1,00 1,19 1,190 Spese generali del 15% 0,179 Utile dell'Impresa del 10% 0,137 Per arrotondamento 0,004",
                "formula": "",
                "unit": "kg",
                "quantity": "None",
                "price": "None",
                "total": "None"
            }
        ],
        "summary": {
            "totalPrice": "",
            "totalPriceWithVAT": "",
            "breakdown": {
                "materials": "None",
                "labor": "None",
                "subcontractors": "None",
                "equipment": "None"
            }
        },
        "activityName": "Demolizione di finestre esistenti"
    }
]

# Internal costs structure with all values stringified and projectSchedule populated
internal_costs = {
    "costBreakdown": {
        "materials": "1200.00",
        "labor": "480.00",
        "subcontractors": "294.86",
        "equipment": "150.00",
        "directCosts": "2124.86",
        "totalCost": "265.61",
        "overhead": "15%",
        "profitTarget": "10%",
        "markup": "35%",
    },
    "materialsList": [
        { "item": "Ceramic tiles", "quantity": "30", "unit": "m²", "unitPrice": "35" },
        { "item": "Electrical outlets", "quantity": "8", "unit": "pcs", "unitPrice": "25" },
        { "item": "Paint (premium)", "quantity": "15", "unit": "L", "unitPrice": "45" },
        { "item": "Adhesive", "quantity": "10", "unit": "bags", "unitPrice": "12" }
    ],
    "personnel": [
        { "role": "Demolition crew", "count": "2", "duration": "3 days" },
        { "role": "Electrician", "count": "1", "duration": "5 days" },
        { "role": "Tile installer", "count": "1", "duration": "4 days" },
        { "role": "Painter", "count": "1", "duration": "2 days" }
    ],
    "projectSchedule": [
        { "activity": "Demolition", "starting": "1", "finishing": "3", "personnel": [{ "role": "Demolition crew", "count": "3", "duration": "3 days" }] },
        { "activity": "Electrical installation", "starting": "4", "finishing": "8", "personnel": [{ "role": "Electrician", "count": "1", "duration": "5 days" }] },
        { "activity": "Tiling", "starting": "9", "finishing": "12", "personnel": [{ "role": "Tile installer", "count": "2", "duration": "4 days" }] },
        { "activity": "Painting", "starting": "13", "finishing": "14", "personnel": [{ "role": "Painter", "count": "2", "duration": "2 days" }] }
    ]
}

def escape_curly_braces(s: str) -> str:
    return s.replace('{', '{{').replace('}', '}}')

boq_str = escape_curly_braces(json.dumps(boq, ensure_ascii=False, indent=2))
internal_costs_str = escape_curly_braces(json.dumps(internal_costs, ensure_ascii=False, indent=2))

# Read activity keywords from file
with open(os.path.join(os.path.dirname(__file__), 'activity_keywords.txt'), 'r', encoding='utf-8') as f:
    activity_keywords = f.read().strip()

messages = [
    (
        "system",
        f"Based on the provided site visit timeline and description and bill of quantities, return only a valid JSON object as specified. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. Based on the book https://psu.pb.unizin.org/buildingconstructionmanagement/ and following standard: {activity_keywords}. Do site price quotation planning in right order of construction timeline, you should prepare object in JSON format in exact following structure with three keys: price_quotation: {boq_str} and internal_costs: {internal_costs_str}. You must evaluate the project as an expert construction engineer to prepare price quotation and internal costs official report, add all necessary construction works for the site in the correct order according to the timeline and construction standard and calculate total price for each resource based on quantity, dimensions, unity of price, formula, if quantity or measures are not clear you should estimate it from site description. You should estimate what is required and what is not according to the provided construction timeline. Logistics includes cost of the gas from vehicle in working area and the hotel if workers are far away from starting point and meals for the workers when staying overnight. You must include it in overhead costs. If the prices are not provided you should search only from the trusted sources like PAT Prezziario http://www.elencoprezzi2025.provincia.tn.it. You should update and include timeline. The original site information with timeline, site description and draft bill of quantities is following:",
    ),
    ("human", "{input}"),
]

prompt = ChatPromptTemplate.from_messages(messages)
chain = prompt | llm

def answer_question(query: str) -> str:
    response = chain.invoke({
        "input": query,
    })
        # Model loading logic can be added here if needed
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

