import os
import re
import json
from langchain.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv
from langchain_xai import ChatXAI
import getpass

load_dotenv()
# # Mistral setup
# if "MISTRAL_API_KEY" not in os.environ:
#     raise RuntimeError("MISTRAL_API_KEY not found in environment. Please set it in your .env file.")


if "XAI_API_KEY" not in os.environ:
    os.environ["XAI_API_KEY"] = getpass.getpass("Enter your xAI API key: ")
    
llm = ChatXAI(
    model="grok-3-mini",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    # other params...
)


# llm = ChatMistralAI(
#     model="mistral-large-latest",
#     temperature=0,
#     max_retries=2,
# )


BOQ_PROMPT = f"""
Also with a boq key create **draft Bill of Quantities (BOQ)** for the construction site, using the provided **site visit timeline** and **project description**.
If Site visit **Bill of Quantities** is provided, follow strictly the given description of what has to be done including everything from the Bill of Quantities in boq with all operations, exact descriptions and titles, dimensions, quantities, units, materials and other resources, everything that Bill of Quantities has described before 'Bill of quantity prices', and calculate total prices.  
Do not include any explanation, markdown, or commentary.  
Do not wrap the JSON in code blocks.  
Output only a valid JSON array following the given schema exactly.  

## Instructions:
1. Use only **standard construction activities** and **resources** from the official PAT Prezziario: http://www.elencoprezzi2025.provincia.tn.it.
2. Follow the correct **order of construction activities** according to the **timeline** and **industry best practices**.
3. Include **all necessary works**, materials, equipment, labor, and subcontracting costs to make the BOQ realistic and complete.
4. Calculate `total` costs based on: **quantity × price** or by formula when provided.
5. If the quantity or measurements are missing, **estimate them logically** based on the provided project description.
6. Every field in the BOQ must be properly filled based on the definitions below.

## FIELD-BY-FIELD GUIDE:
- **type** → ("main" or "sub"): Defines if the activity is a main activity or a sub-task.
- **activity** → A short name of the construction activity (e.g., "Demolition of old windows").
- **mainCategory** → The main classification of the activity, e.g., "Restauro e ristrutturazione" or "Nuove costruzioni".
- **priceSource** → Always `"pat"` if the resource pricing comes from the PAT Prezziario.
- **code** → The unique PAT Prezziario activity code for the task.
- **title** → The full technical description from the PAT Prezziario for this activity.
- **unit** → The unit of measurement (e.g., "m²", "m³", "kg", "pz").
- **quantity** → The estimated or calculated amount based on the timeline and project description.
- **resources** → A list of all resources needed for the activity:
    - **code** → Resource code from PAT Prezziario.
    - **description** → Technical description of the resource.
    - **formula** → Formula used to calculate quantity if applicable.
    - **unit** → Measurement unit of the resource.
    - **quantity** → Quantity of the resource based on calculation or estimation.
    - **price** → Price per unit from PAT Prezziario.
    - **total** → Automatically calculated = quantity × price.
- **summary** → A cost summary for this activity:
    - **totalPrice** → Total cost without VAT.
    - **totalPriceWithVAT** → Total cost including VAT.
    - **breakdown** → Cost distribution:
        - **materials** → Total cost of materials.
        - **labor** → Total cost of labor.
        - **subcontractors** → Cost of subcontracted works.
        - **equipment** → Cost of rented or used equipment.
- **activityName** → Short descriptive name of the activity the same as activity mapped to projectSchedule.

The final BOQ must be **technically correct**, **financially consistent**, and **ordered by construction sequence**.

The original site information with timeline and site description is following:
{{input}}
"""
# Internal costs structure with all values stringified and projectSchedule populated
internal_costs = {
  "offer_title": "string",
  "cost_description": "string",
  "currency": "string",
  "boq": [
    {
        "type": "string",  # Type of activity, e.g., "main" or "sub"
        "activity": "string",  # Description of the main activity
        "mainCategory": "string",  # Main category (e.g., Restauro e ristrutturazione)
        "priceSource": "string",  # Price source (e.g., pat, internal, etc.)
        "code": "string",  # Unique activity code
        "title": "string",  # Full title or description of the activity
        "unit": "string",  # Measurement unit (e.g., kg, m², etc.)
        "quantity": "number",  # Quantity of the activity
        "resources": [
            {
                "code": "string",  # Resource code identifier
                "description": "string",  # Detailed description of the resource
                "formula": "string",  # Formula used to calculate quantity/cost
                "unit": "string",  # Measurement unit of the resource
                "quantity": "number",  # Resource quantity
                "price": "number",  # Price per unit of the resource
                "total": "number | null"  # Total resource cost (nullable)
            }
        ],
        "summary": {
            "totalPrice": "number",  # Total price without VAT
            "totalPriceWithVAT": "number",  # Total price including VAT
            "breakdown": {
                "materials": "number",       # Total cost of materials
                "labor": "number",          # Total cost of labor
                "subcontractors": "number", # Total cost of subcontractors
                "equipment": "number"       # Total cost of equipment
            }
        },
        "activityName": "string"  # Name of the activity
    }
  ],
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
        f"""
You are an **expert construction cost estimator** and **project construction engineer**.  
Your task is to evalueate and prioritize the defined work operations and construction site status, and generate a **highly detailed, realistic** internal cost estimation JSON object based on the provided **site visit timeline**, **site description**, and **draft bill of quantities (BOQ)** in Italian.  

You must follow the **exact JSON schema**: {internal_costs_str}  
Do NOT copy values, prices, or object counts from the schema example — instead, generate a **completely new and realistic proposal**.
{BOQ_PROMPT}.
---

### **General Rules**
1. **Output strictly JSON** — no explanations, no markdown, no commentary.
2. Do **not wrap** JSON in code blocks.
3. Use only **trusted data sources** for prices, specifically PAT Prezziario 2025:  
   http://www.elencoprezzi2025.provincia.tn.it.
4. Always **follow construction sequencing**:
   - Site preparation → Demolition → Excavation → Foundations → Structural works → Roofing → Systems → Finishes → Landscaping.
5. Fill **all numeric fields** realistically based on the site description, timeline, and industry best practices.
6. Where data is missing, **estimate quantities, dimensions, and unit prices** based on the BOQ, PAT Prezziario, and standard construction norms.
7. Make sure **costs, quantities, unit prices, and totals are mathematically consistent** across the entire JSON.

---

### **Important Guidelines for Each Section**

#### **Top-Level Fields**
- **offer_title** → The project title (e.g., "Renovation of Residential Complex, Block A").
- **cost_description** → A one-sentence description of what the proposal covers.
- **currency** → Always `"EUR"`.

---

#### **site_area_summary** *(Main Core of the Estimate)*
For each **site area** or construction phase:
- **area** → Name of the work zone (e.g., "Foundation works", "Roofing", "External landscaping").
- **total_cost** → Sum of all costs for this specific area.
- **markup_percentage** → Apply realistic markup (8%–25%) depending on project size.
- **final_cost_for_client_eur** → `total_cost + (total_cost × markup_percentage)`.
- **materials / labor / subcontractors / equipment** → Calculate separately.
- **resource_types** → List resource categories (e.g., ["materials", "labor", "equipment"]).
- **resources** → Detailed breakdown of every material, equipment, and subcontracted cost.

---

#### **resources** *(Inside site_area_summary)*
For each resource:
- **name** → Material, machine, or labor type.
- **type** → One of: `"material"`, `"labor"`, `"equipment"`, `"subcontractor"`.
- **quantity** → total quantity required for work estimated based on BOQ and site description.
- **unit** → Measurement unit (`m²`, `m³`, `kg`, `h`, `pz`).
- **unitPrice** → Get realistic price from PAT Prezziario or estimate.
- **totalPrice** → `total quantity × unitPrice`.

---

#### **work_activities** *(Inside site_area_summary)*
For each activity:
- **description** → Technical description from PAT Prezziario.
- **quantity / unit** → Derived from BOQ or estimated.
- **unitPrice** → Taken from Prezziario.
- **totalPrice** → `quantity × unitPrice`.
- **resources** → Link all associated resources here.

---

#### **materialsList**
- Full material inventory, sorted by cost impact.
- Include `provider_name` when possible.
- Prices must match PAT Prezziario whenever available.

---

#### **personnel**
- Include site engineers, workers, supervisors, safety officers, subcontractors.
- **duration** = total working time.
- **safety_courses_requirements** = if safety training is mandatory.

---

#### **logistics**
- Include **gas costs for company vehicles**, **worker hotel stays**, and **meals** if the site is far from the company base.
- Always include **transportation of materials**.

---

#### **direct_costs & indirect_costs**
- Direct = tied directly to production (materials, equipment, subcontractors).
- Indirect = overheads like insurance, permits, safety, office costs.

---

#### **projectSchedule**
- Include **starting** and **finishing dates**.
- Include **activity** equal with activityName
- Assign **personnel** to each activity realistically.

---

#### **equipment**
- Include cranes, scaffolding, mixers, power tools, and vehicles.
- Calculate **company_cost_eur** and apply **markup_percentage** for client pricing.

---

#### **price_summary**
- Ensure all totals match up.
- Include explanations in `explanation_of_summary` describing cost drivers.
- Fill **summary_by_category** with accurate breakdowns.

---

#### **risk_analysis**
- Identify potential risks (e.g., delays, material price fluctuations, safety hazards).
- Add **timeline_simulation** showing possible delays.

---

### **Key Instructions**
- Always cross-check that:
  - `totalPrice` = `quantity × unitPrice`
  - `final_cost_for_client_eur` = `total_cost + markup`
  - All area totals sum correctly to **price_summary.total_price**.
- If uncertain about exact measures, **estimate using standard construction norms**.
- If PAT Prezziario doesn't list a resource, **use typical market price estimates**.

---

### **Input**
The original site information with **timeline**, **site description**, and **draft BOQ** is following:

{{input}}
"""
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

