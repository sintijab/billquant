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
If Site visit **Bill of Quantities** is provided, follow strictly the given description of what has to be done including everything from the Bill of Quantities in boq with all operations, exact descriptions and titles, exact dimensions, exact quantities, exact unit, exact price, exact total if provided, read provided table format and include all values that Bill of Quantities has, until 'Bill of quantity prices', if total price is provided then copy paste, if not then calculate it.  
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
7. If the Bill of Quantities total price is provided it must align with the Bill of Quantity source, and all the works must be included with its original description or original title.

## FIELD-BY-FIELD GUIDE:
- **type** → ("main" or "sub"): Defines if the activity is a main activity or a sub-task.
- **activity** → The full original name or full activity description of the construction activity copy paste from the original Bill of Quantity.
- **mainCategory** → The main classification of the activity, e.g., "Restauro e ristrutturazione" or "Nuove costruzioni".
- **priceSource** → Always `"pat"` if the resource pricing comes from the PAT Prezziario
- **code** → The code or number NR of the activity from the Bill of Quantity, or PAT Prezziario activity code.
- **title** → A full original name or full activity description of the construction activity from the Bill of Quantity, or from the PAT Prezziario for this activity.
- **unit** → The unit of measurement (e.g., "m²", "m³", "kg", "pz").
- **quantity** → The estimated or calculated amount based on the timeline and project description.
- **resources** → A list of all resources needed for the activity if it is in the Bill of Quantity or required, if it is not in Bill of Quantity then do not add it:
    - **code** → Resource code from the activity from the Bill of Quantity or PAT Prezziario.
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
        "type": "string",
        "activity": "string",
        "mainCategory": "string",
        "priceSource": "string",
        "code": "string",
        "title": "string",
        "unit": "string",
        "quantity": "number",
        "resources": [
            {
                "code": "string",
                "description": "string",
                "formula": "string",
                "unit": "string",
                "quantity": "number",
                "price": "number",
                "total": "number | null"
            }
        ],
        "summary": {
            "totalPrice": "number",
            "totalPriceWithVAT": "number",
            "breakdown": {
                "materials": "number",
                "labor": "number",
                "subcontractors": "number",
                "equipment": "number"
            }
        },
        "activityName": "string"
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
- **quantity** → total quantity required for work estimated, use quantity from Bill of Quantities if provided or estimate.
- **unit** → Measurement unit (`m²`, `m³`, `kg`, `h`, `pz`). Use this measure from Bill of Quantities if provided.
- **unitPrice** → Use price from Bill of Quantities if provided. Otherwise get realistic price from PAT Prezziario.
- **totalPrice** → Use total price from Bill of Quantities if provided, if not then follow formula `total quantity × unitPrice`.

---

#### **work_activities** *(Inside site_area_summary)*
For each activity:
- **description** → Technical description from rom Bill of Quantities if provided, if not then PAT Prezziario.
- **quantity / unit** →  Use price from Bill of Quantities if provided, if not then estimate.
- **unitPrice** → Use unit from Bill of Quantities if provided, if not then estimate from Prezziario.
- **totalPrice** → Use price from Bill of Quantities if provided, if not then follow formula `quantity × unitPrice`.
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
  # Prioritize splitting at the second pattern if present, otherwise the first
  pattern2 = r"Use following Bill of quantity prices"
  pattern1 = r"Bill of quantity is following"
  match2 = re.search(pattern2, query, re.IGNORECASE)
  if match2:
    split_idx = match2.start()
    part1 = query[:split_idx].strip()
    part2 = query[split_idx:].strip()
    part1_escaped = escape_curly_braces(part1)
    part2_escaped = escape_curly_braces(part2)
    # Reuse the original full prompt as the first system message, replacing {input} with PART 1
    sys_message = messages[0][1].replace('{input}', part1_escaped)
    prompt = ChatPromptTemplate.from_messages([
      ("system", sys_message),
      ("system", f"Here is PART 2: {part2_escaped}. Now, based on the provided information, generate the internal cost estimation JSON as instructed above."),
      ("human", "Continue and output only the JSON.")
    ])
    chain2 = prompt | llm
    response = chain2.invoke({})
  else:
    match1 = re.search(pattern1, query, re.IGNORECASE)
    if match1:
      split_idx = match1.start()
      part1 = query[:split_idx].strip()
      part2 = query[split_idx:].strip()
      part1_escaped = escape_curly_braces(part1)
      part2_escaped = escape_curly_braces(part2)
      sys_message = messages[0][1].replace('{input}', part1_escaped)
      prompt = ChatPromptTemplate.from_messages([
        ("system", sys_message),
        ("system", f"Here is PART 2: {part2_escaped}. Now, based on the provided information, generate the internal cost estimation JSON as instructed above."),
        ("human", "Continue and output only the JSON, do not include the comments in JSON.")
      ])
      chain2 = prompt | llm
      response = chain2.invoke({})
    else:
      response = chain.invoke({
        "input": query,
      })
  try:
    parsed_output = response.content
    return json.dumps(parsed_output, ensure_ascii=False)
  except Exception:
    return response.content.strip()

