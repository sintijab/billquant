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
                "formula": "0.2",
                "unit": "kg",
                "quantity": "3",
                "price": "16.43",
                "total": "None"
            },
            {
                "code": "Z.55.85.0052.010",
                "description": "VERNICIATURA DI STRUTTURE E MANUFATTI ZINCATI - CLASSE C3 fuori opera: strutture e manufatti con elementi reticolari (Costo materiali fc - Costo materiali fc) kg 1,00 1,19 1,190 Spese generali del 15% 0,179 Utile dell'Impresa del 10% 0,137 Per arrotondamento 0,004",
                "formula": "2",
                "unit": "kg",
                "quantity": "3",
                "price": "16.43",
                "total": "72"
            }
        ],
        "summary": {
            "totalPrice": "4210",
            "totalPriceWithVAT": "6201",
            "breakdown": {
                "materials": "2340",
                "labor": "1204",
                "subcontractors": "2345",
                "equipment": "900"
            }
        },
        "activityName": "Demolizione di finestre esistenti"
    }
]

# Internal costs structure with all values stringified and projectSchedule populated
internal_costs = {
  "costBreakdown": {
    "materials": "35000",
    "labor": "30000",
    "subcontractors": "42.23",
    "equipment": "10000",
    "directCosts": "100000",
    "totalCost": "125000",
    "overhead": "10%",
    "profitTarget": "15%",
    "markup": "25%"
  },
  "materialsList": [
    {
      "item": "RIFIUTI INGOMBRANTI NON INERTI serramenti, avvolgibili, pallets e tavolame in legno selezionati CER 170201",
      "quantity": "0.04",
      "unit": "t",
      "unitPrice": "140"
    },
    {
      "item": "Macerie pulite selezionate murature in pietrame",
      "quantity": "1",
      "unit": "m³",
      "unitPrice": "16.43"
    },
    {
      "item": "Wooden Listels",
      "quantity": "1",
      "unit": "m",
      "unitPrice": "0.82"
    },
    {
      "item": "Pavimento tavolette spessore 10 mm teak",
      "quantity": "1.05",
      "unit": "m²",
      "unitPrice": "37.87"
    },
    {
      "item": "Adesivo per legno in secchi da 18 kg",
      "quantity": "0.7",
      "unit": "kg",
      "unitPrice": "1.96"
    },
    {
      "item": "Gel turapori per legno in secchi da 10 l",
      "quantity": "0.1",
      "unit": "l",
      "unitPrice": "5.4"
    },
    {
      "item": "Vernice di fondo per legno in latte da 5 l",
      "quantity": "0.2",
      "unit": "l",
      "unitPrice": "8.54"
    }
  ],
  "personnel": [
    { "role": "Operatori addetti ai mezzi ed ai sollevamenti", "count": "1", "duration": "0.10 hours" },
    { "role": "Operatore addetto alla demolizione", "count": "1", "duration": "0.17 hours" },
    { "role": "Operatore addetto all'assistenza", "count": "1", "duration": "0.17 hours" },
    { "role": "Operatori addetti ai mezzi ed ai sollevamenti: LAVORI DI GENIO CIVILE - INDUSTRIA", "count": "1", "duration": "4.17 hours" },
    { "role": "Operatore addetto alla posa", "count": "1", "duration": "0.29 hours" },
    { "role": "Operatore addetto all'assistenza", "count": "1", "duration": "0.29 hours" },
    { "role": "Operatori addetti ai mezzi ed ai sollevamenti", "count": "1", "duration": "4.17 hours" },
    { "role": "Operatore addetto alla demolizione", "count": "1", "duration": "8 hours" },
    { "role": "Operatore addetto all'assistenza", "count": "1", "duration": "8 hours" }
  ],
  "projectSchedule": [
    { "activity": "Structural Issues", "starting": "1", "finishing": "4", "personnel": [] },
    { "activity": "State of the Roof Terrace", "starting": "5", "finishing": "10", "personnel": [] },
    { "activity": "Plumbing", "starting": "11", "finishing": "18", "personnel": [] },
    { "activity": "Electrical", "starting": "19", "finishing": "26", "personnel": [] },
    { "activity": "Heating", "starting": "27", "finishing": "28", "personnel": [] },
    { "activity": "Windows and Doors", "starting": "29", "finishing": "34", "personnel": [] },
    { "activity": "Doors", "starting": "35", "finishing": "44", "personnel": [] },
    { "activity": "Ceiling", "starting": "45", "finishing": "60", "personnel": [] },
    { "activity": "Walls", "starting": "61", "finishing": "84", "personnel": [] },
    { "activity": "Flooring", "starting": "85", "finishing": "110", "personnel": [] },
    { "activity": "Fixtures", "starting": "111", "finishing": "112", "personnel": [] },
    { "activity": "General Cleaning", "starting": "113", "finishing": "120", "personnel": [] },
    { "activity": "Key Dimensions and Quantities", "starting": "121", "finishing": "122", "personnel": [] },
    { "activity": "Overall Width", "starting": "123", "finishing": "124", "personnel": [] },
    { "activity": "This is broken down into segments", "starting": "125", "finishing": "126", "personnel": [] },
    { "activity": "Wall Thickness", "starting": "127", "finishing": "128", "personnel": [] },
    { "activity": "focusing on what needs renovation and repair", "starting": "129", "finishing": "130", "personnel": [] },
    { "activity": "State of the Room", "starting": "131", "finishing": "134", "personnel": [] },
    { "activity": "Renovation and Repair Needs", "starting": "135", "finishing": "142", "personnel": [] },
    { "activity": "Floor", "starting": "143", "finishing": "152", "personnel": [] }
  ],
  "total_company_costs": {
    "subtotal": "100000",
    "global_costs": "12500",
    "markup": "15000",
    "total": "125000",
    "margin_check": "15000"
  },
  "price_summary": {
    "subtotal_price": "100000",
    "general_expenses": "10000",
    "company_profit": "15000",
    "rounding": "0",
    "total_costs": "125000",
    "application_price": "125000",
    "explanation_of_summary": {
      "subtotal_desc": "Somma di tutti i costi diretti del progetto.",
      "general_expenses_desc": "Spese generali che coprono i costi indiretti del progetto.",
      "company_profit_desc": "Margine di profitto della compagnia.",
      "rounding_desc": "Arrotondamento del totale.",
      "total_amount_desc": "Totale del progetto dopo l'aggiunta delle spese generali e del profitto.",
      "application_price_desc": "Prezzo finale applicato al cliente."
    },
    "summary_by_category": {
      "fuel_cost": "5000",
      "machine_cost": "10000",
      "production_labor_cost": "30000",
      "material_cost_fc": "20000",
      "material_cost_fm": "15000"
    }
  },
  "deprecation_fixed_amount": [
    { "component": "Gru elevatrice", "depreciation_eur": "5000", "percentage": "10", "rounding": "0" },
    { "component": "Autocarro ribaltabile", "depreciation_eur": "3000", "percentage": "10", "rounding": "0" },
    { "component": "Macchine edili", "depreciation_eur": "2000", "percentage": "10", "rounding": "0" }
  ],
  "risk_analysis": {
    "potential_risks": "Ritardi nei fornitori, condizioni meteorologiche avverse, problemi di sicurezza sul cantiere.",
    "cash_flow_risks": "Ritardi nei pagamenti da parte del cliente.",
    "simulation": "Simulazione di scenari di rischio per valutare l'impatto sul progetto.",
    "timeline_simulation": "Simulazione del cronoprogramma per identificare potenziali ritardi."
  },
  "detailed_price_breakdown": [
    {
      "area_type": "area 1",
      "subarea_type": "subarea 1",
      "code": "NOLI1",
      "title": "NOLI A CALDO SENZA OPERATORE",
      "description": "movimentazione 10' per ogni tre serramenti: GRU ELEVATRICE CON ROTAZIONE IN ALTO con altezza di m. 30 e sbraccio di m. 30.",
      "unit": "ora",
      "quantity": "10",
      "unit_price": "150",
      "total_amount": "1500",
      "contractors_needed": "Yes",
      "subcontractors_needed": "No",
      "roles": ["Operatori addetti ai mezzi ed ai sollevamenti", "Operatore addetto alla demolizione"],
      "number_of_workers_and_type": [{ "role": "Operatori addetti ai mezzi ed ai sollevamenti", "count": "1", "duration": "0.10 hours" },
    { "role": "Operatore addetto alla demolizione", "count": "1", "duration": "0.17 hours" }],
      "total_hours": "10",
      "cost_hour": "150",
      "total_cost": "1500",
      "safety_courses_requirements": ""
    },
    {
      "area_type": "area 1",
      "subarea_type": "subarea 2",
      "code": "AUTOC1",
      "title": "AUTOCARRI A CASSA RIBALTABILE",
      "description": "con P.T.T. da t. 11,5 fino a t. 15.",
      "unit": "giorno",
      "quantity": "5",
      "unit_price": "200",
      "total_amount": "1000",
      "contractors_needed": "No",
      "subcontractors_needed": "Yes",
      "roles": ["Operatori addetti ai mezzi ed ai sollevamenti: LAVORI DI GENIO CIVILE - INDUSTRIA", "Operatore addetto alla posa"],
      "number_of_workers_and_type": [{ "role": "Operatori addetti ai mezzi ed ai sollevamenti: LAVORI DI GENIO CIVILE - INDUSTRIA", "count": "1", "duration": "4.17 hours" },
    { "role": "Operatore addetto alla posa", "count": "1", "duration": "0.29 hours" }],
      "total_hours": "5",
      "cost_hour": "200",
      "total_cost": "1000",
      "safety_courses_requirements": ""
    },
    {
      "area_type": "area 2",
      "subarea_type": "subarea 1",
      "code": "MANO1",
      "title": "MANODOPERA operatori addetti ai mezzi ed ai sollevamenti: LAVORI DI GENIO CIVILE - INDUSTRIA operaio specializzato",
      "description": "Manodopera operatori addetti ai mezzi ed ai sollevamenti",
      "unit": "ora",
      "quantity": "40",
      "unit_price": "30",
      "total_amount": "1200",
      "contractors_needed": "Yes",
      "subcontractors_needed": "No",
      "roles": [],
      "number_of_workers_and_type": [],
      "total_hours": "40",
      "cost_hour": "30",
      "total_cost": "1200",
      "safety_courses_requirements": ""
    }
  ],
  "equipment": [
    {
      "name": "GRU ELEVATRICE CON ROTAZIONE IN ALTO",
      "quantity": "0.06",
      "unity": "h",
      "price_per_unit": "10.13",
      "price_of_unity_provider": "10.13",
      "company_cost_eur": "0.56",
      "markup_percentage": "0.08",
      "final_cost_for_client_eur": "0.65"
    },
    {
      "name": "AUTOCARRI A CASSA RIBALTABILE",
      "quantity": "0.05",
      "unity": "h",
      "price_per_unit": "25.3",
      "price_of_unity_provider": "25.3",
      "company_cost_eur": "1.15",
      "markup_percentage": "0.17",
      "final_cost_for_client_eur": "1.32"
    }
  ],
  "materials": [
    {
      "name": "RIFIUTI INGOMBRANTI NON INERTI serramenti, avvolgibili, pallets e tavolame in legno selezionati CER 170201",
      "quantity": "0.04",
      "unity": "t",
      "price_per_unit": "140",
      "price_of_unity_provider": "140",
      "company_cost_eur": "5.6",
      "markup_percentage": "0.84",
      "final_cost_for_client_eur": "6.44"
    },
    {
      "name": "Macerie pulite selezionate murature in pietrame",
      "quantity": "1",
      "unity": "m³",
      "price_per_unit": "16.43",
      "price_of_unity_provider": "16.43",
      "company_cost_eur": "16.43",
      "markup_percentage": "2.46",
      "final_cost_for_client_eur": "18.89"
    }
  ]
}



INTERNAL_COSTS_MAPPING_INSTRUCTIONS = (
  "For each field in the internal_costs schema:'costBreakdown': Calculate or map from summaries. materials = material_cost_fc + material_cost_fm from summary_by_category, labor = production_labor_cost, subcontractors sum from subcontractors tables, equipment = machine_cost, directCosts = subtotal from summary_estimates, totalCost = total_amount, overhead = '15%' (from markup in document), profitTarget = '10%' (infer from depreciation percentages or adjust), markup = '35%' (adjust based on document markups). 'materialsList': Simplify and aggregate from all materials tables in the document, using name as item, quantity, udm as unit, e_udm_prezzario as unitPrice. 'personnel': Aggregate from all personnel list tables, using personnel_list as role, count from nr_people_involved_type if available or infer 1, duration from hours or 'unknown'. 'projectSchedule': Use timeline_simulation.detailed_activities, with activity, start_day as starting, end_day as finishing, personnel from associated personnel lists if possible, or empty. Depreciation fixed amount components percentages and roundings, with depreciation_eur = depreciation (€). 'detailed_price_breakdown': Create an array combining the general detailed price breakdown and work_activities from each floor mapped by area_type, subarea_type. For general: code, title, description, unit, quantity, unit_price, total_amount = amount, contractors_needed: Yes, subcontractors_needed: Yes or no (or infer), roles: [], number_of_workers_and_type: '', total_hours: quantity if unit 'ora', cost_hour: unit_price if applicable, total_cost: amount, safety_courses_requirements: ''. For per area: code = code_prezzario, title = work_activity, description = operation_full_title_and_description, unit from quantity_udm (parse, e.g., 'h' from '4 h'), quantity from quantity_udm, unit_price: cost_hour if unit 'h' else null, total_amount: total_cost, contractors_needed: true if internal_external = 'Internal' else false, subcontractors_needed: true if internal_external = 'External' else false, roles: parse from nr_people_involved_type into array (e.g., split by ',' or infer), number_of_workers_and_type = nr_people_involved_type, total_hours, cost_hour, total_cost, safety_courses_requirements. Order by project timeline where possible. 'equipment’: find all information about machinery, with name, quantity, unity = udm, price_per_unit = e_udm_prezzario, price_of_unity_provider = e_udm_provider, company_cost_eur = company_cost, markup_percentage = markup (parse as number), final_cost_for_client_eur = final_cost_for_client. 'materials': output similar to equipment."
)

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

