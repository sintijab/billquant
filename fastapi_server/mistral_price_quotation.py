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

# Internal costs structure with all values stringified and projectSchedule populated
internal_costs = {
  "offer_title": "string",
  "cost_description": "string",
  "currency": "string",
  "site_area_summary": [
    {
      "area": "string",
      "total_cost": "number",
      "markup_percentage": "number",
      "final_cost_for_client_eur": "number",
      "materials": "number",
      "labor": "number",
      "subcontractors": "number",
      "equipment": "number",
      "resource_types": ["string"],
      "resources": [
        {
          "name": "string",
          "type": "string",
          "quantity": "number",
          "unit": "string",
          "unitPrice": "number",
          "totalPrice": "number"
        }
      ],
      "work_activities": [
        {
          "description": "string",
          "quantity": "number",
          "unit": "string",
          "unitPrice": "number",
          "totalPrice": "number",
          "resources": [
            {
              "name": "string",
              "type": "string",
              "quantity": "number",
              "unit": "string",
              "unitPrice": "number",
              "totalPrice": "number"
            }
          ],
        }
      ]
    }
  ],
  "materialsList": [
    {
      "item": "string",
      "quantity": "number",
      "unit": "string",
      "unitPrice": "number",
      "total_quantity": "number",
      "provider_name": "string",
      "price_of_unity_provider": "number",
      "total_price": "number",
      "company_cost_eur": "number",
      "markup_percentage": "number",
      "final_cost_for_client_eur": "number"
    }
  ],
  "personnel": [
    {
      "role": "string",
      "count": "number",
      "duration": "string",
      "type": "string",
      "unit_measure": "string (optional for subcontractors)",
      "price_per_unit": "number (optional)",
      "quantity": "number (optional)",
      "total": "number (optional)",
      "site_works": [
        {
          "type": "string",
          "category": "string"
        }
      ],
      "safety_courses_requirements": ["string"]
    }
  ],
  "logistics": [
    {
      "description": "string",
      "duration": "number",
      "unity": "string",
      "total_price": "number",
      "site_category": ["string"],
      "site_works": [
        {
          "type": "string",
          "category": "string"
        }
      ]
    }
  ],
  "direct_costs": [
    {
      "category": "string",
      "description": "string",
      "unit": "string",
      "price": "number",
      "total_price": "number"
    }
  ],
  "indirect_costs": [
    {
      "category": "string",
      "description": "string",
      "unit": "string",
      "price": "number",
      "total_price": "number"
    }
  ],
  "projectSchedule": [
    {
      "activity": "string",
      "starting": "number",
      "finishing": "number",
      "personnel": [
        {
          "role": "string",
          "count": "number",
          "duration": "string"
        }
      ]
    }
  ],
  "equipment": [
    {
      "name": "string",
      "quantity": "number",
      "unity": "string",
      "price_per_unit": "number",
      "price_of_unity_provider": "number",
      "company_cost_eur": "number",
      "markup_percentage": "number",
      "final_cost_for_client_eur": "number"
    }
  ],
  "price_summary": {
    "subtotal_price": "number",
    "global_costs": "number",
    "company_profit": "number",
    "margin_check": "number",
    "markup": "number",
    "vat": "string",
    "rounding": "number",
    "total_price": "number",
    "application_price_before_vat": "number",
    "application_price": "number",
    "explanation_of_summary": {
      "subtotal_desc": "string",
      "global_costs_desc": "string",
      "company_profit_desc": "string",
      "margin_check_desc": "string",
      "markup_desc": "string",
      "rounding_desc": "string",
      "total_amount_desc": "string",
      "application_price_desc": "string"
    },
    "summary_by_category": {
      "fuel_cost": "number",
      "activity_cost": "number",
      "workers_cost": "number",
      "subcontractors_cost": "number",
      "equipment_cost": "number",
      "production_labor_cost": "number",
      "material_cost_fc": "number",
      "material_cost_fm": "number"
    }
  },
  "deprecation_fixed_amount": [
    {
      "component": "string",
      "depreciation_eur": "number",
      "percentage": "number",
      "rounding": "number"
    }
  ],
  "risk_analysis": {
    "potential_risks": "string",
    "cash_flow_risks": "string",
    "simulation": "string",
    "timeline_simulation": "string"
  }
}



def escape_curly_braces(s: str) -> str:
    return s.replace('{', '{{').replace('}', '}}')

# boq_str = escape_curly_braces(json.dumps(boq, ensure_ascii=False, indent=2))
internal_costs_str = escape_curly_braces(json.dumps(internal_costs, ensure_ascii=False, indent=2))

# Read activity keywords from file
with open(os.path.join(os.path.dirname(__file__), 'activity_keywords.txt'), 'r', encoding='utf-8') as f:
    activity_keywords = f.read().strip()

messages = [
  (
    "system",
    f"Based on the provided site visit timeline and description and bill of quantities, return only a valid JSON object as specified. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. Based on the book https://psu.pb.unizin.org/buildingconstructionmanagement/ and following standard: {activity_keywords}. Do site price quotation planning in right order of construction timeline, you should prepare object in JSON format in exact following schema with different estimates of all key values, number of objects of internal_costs, use this only as a schema and do not copy paste anything from this JSON: {internal_costs_str} Do not use the same prices or any other other values and number of objects from this JSON, but generate new proposal JSON from provided details of construction site. You must evaluate the project as an expert construction engineer to prepare price quotation and internal costs official report, add all necessary construction works for the site in the correct order according to the timeline and construction standard and calculate total price for each resource based on quantity, dimensions, unity of price, formula, if quantity or measures are not clear you should estimate it from site description. You should estimate what is required and what is not according to the provided construction timeline. Logistics includes cost of the gas from vehicle in working area and the hotel if workers are far away from starting point and meals for the workers when staying overnight. You must include it in overhead costs. If the prices are not provided you should search only from the trusted sources like PAT Prezziario http://www.elencoprezzi2025.provincia.tn.it. You should update and include timeline. The original site information with timeline, site description and draft bill of quantities is following:",
  ),
  ("human", "{input}"),
]

prompt = ChatPromptTemplate.from_messages(messages)
chain = prompt | llm

def create_quotation(query: str) -> str:
    response = chain.invoke({
        "input": query,
    })
        # Model loading logic can be added here if needed
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

