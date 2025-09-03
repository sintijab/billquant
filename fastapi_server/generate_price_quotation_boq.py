from datetime import datetime

from docxtpl import DocxTemplate, InlineImage
from docx.shared import Mm
import json
import base64
import io

def image_from_data_url(data_url):
    """
    If the input is a data URL (base64-encoded image), decode and return BytesIO, else return as is.
    """
    if isinstance(data_url, str) and data_url.startswith("data:image/"):
        header, encoded = data_url.split(",", 1)
        return io.BytesIO(base64.b64decode(encoded))
    return data_url


# --- TRANSFORMATION LOGIC FOR FLEXIBLE INPUT ---
def transform_input_to_template_context(data):
    """
    Transform the flexible input JSON into the context expected by the DOCX template.
    Accepts both old and new JSON structures, auto-converting old to new (with internalCosts) if needed.
    """
    from datetime import datetime
    import copy

    # --- Auto-transform old structure to new if needed ---
    cost_keys = [
        "boq", "site_area_summary", "materialsList", "personnel", "logistics", "direct_costs",
        "indirect_costs", "projectSchedule", "equipment", "price_summary", "deprecation_fixed_amount", "risk_analysis"
    ]
    if "internalCosts" not in data:
        internal_costs = {}
        for key in cost_keys:
            if key in data:
                internal_costs[key] = data.pop(key)
        if internal_costs:
            data["internalCosts"] = internal_costs

    # Compose client name
    client = f"{data.get('clientFirstName', '')} {data.get('clientSurname', '')}".strip()
    # Compose address (siteAddress or address)
    address = data.get('address') or data.get('siteAddress') or 'Address:'
    # Compose issued_by (use clientFirstName + clientSurname or issued_by)
    issued_by = data.get('issued_by', '')
    # Compose logo and signature
    logo = data.get('logo') or data.get('companyLogo', '')
    signature = data.get('digitalSignature') or data.get('signature', '')
    # Compose email/pec_email
    email = data.get('email', '')
    pec_email = data.get('pec_email', '')
    # Compose region
    region = data.get('region', 'Comune di Trento')
    # Compose company
    company = data.get('company', 'Company: ')

    # Map items: group by main activities, each with sub-rows for resources
    items = []
    price_quotation = data.get('priceQuotation')
    if price_quotation is None:
        price_quotation = data.get('internalCosts', {}).get('boq', [])

    personnel_list = data.get('internalCosts', {}).get('personnel', [])
    for pq in price_quotation:
        # Only process main activities
        if pq.get('type', '') != 'main':
            continue
        summary = pq.get('summary', {})
        activity_name = summary.get('activityName') or pq.get('activityName') or pq.get('activity') or pq.get('title', '')
        main_category = pq.get('mainCategory', '')

        # Find matching personnel by inclusive substring match of mainCategory in site_works.category
        matched_personnel = []
        for person in personnel_list:
            for sw in person.get('site_works', []):
                main_cat = main_category.strip().lower()
                sw_cat = sw.get('category', '').strip().lower()
                if main_cat and sw_cat and (sw_cat in main_cat or main_cat in sw_cat):
                    matched_personnel.append(person)
                    break

        # Compose estimated_time, people, training
        estimated_time = ', '.join([
            f"{p.get('quantity', '')} {p.get('unit_measure', '')}" for p in matched_personnel if p.get('quantity') and p.get('unit_measure')
        ])
        people = ', '.join([
            f"{p.get('count', '')} {p.get('role', '')}".strip() for p in matched_personnel if p.get('count') or p.get('role')
        ])
        training = ', '.join([
            ', '.join(p.get('safety_courses_requirements', [])) for p in matched_personnel if p.get('safety_courses_requirements')
        ])

        main_row = {
            "activity": activity_name,
            "mainCategory": main_category,
            "code": pq.get('code', ''),
            "title": pq.get('title', ''),
            "unit": str(pq.get('unit', '')).replace('mÂ²', 'm²').replace('m^2', 'm²').replace('Â', ''),
            "quantity": pq.get('quantity', ''),
            "total": summary.get('totalPrice', pq.get('total', pq.get('amount', ''))),
            "totalWithVAT": summary.get('totalPriceWithVAT', ''),
            "breakdown": summary.get('breakdown', {}),
            "resources": [],
            "estimated_time": estimated_time,
            "people": people,
            "training": training
        }
        # Add sub-rows for each resource
        for res in pq.get('resources', []):
            main_row["resources"].append({
                "code": res.get('code', ''),
                "description": res.get('description', ''),
                "formula": res.get('formula', ''),
                "quantity": res.get('quantity', ''),
                "price": f"{res.get('price', '')} / {res.get('unit', '').replace('mÂ²', 'm²').replace('m^2', 'm²').replace('Â', '')}",
                "total": res.get('total', '')
            })
        items.append(main_row)

    # Totals: Extract from internalCosts['price_summary'] if available
    price_total_gross = None
    tax = None
    price_total_net = None
    price_summary = data.get('internalCosts', {}).get('price_summary', {})
    try:
        price_total_gross = float(price_summary.get('application_price_before_vat', price_summary.get('subtotal_price', 0)))
    except Exception:
        price_total_gross = 0.0
    try:
        price_total_net = float(price_summary.get('application_price', price_summary.get('total_price', 0)))
    except Exception:
        price_total_net = 0.0
    try:
        tax = price_total_net - price_total_gross
    except Exception:
        tax = 0.0

    context = {
        "company": company,
        "address": address,
        "email": email,
        "pec_email": pec_email,
        "logo": logo,
        "region": region,
        "client": client,
        "date": datetime.now().strftime("%d/%m/%Y"),
        "issued_by": issued_by,
        "signature": signature,
        "items": items,
        "price_total_gross": f"{price_total_gross:.2f}",
        "tax": f"{tax:.2f}",
        "price_total_net": f"{price_total_net:.2f}",
    }
    return context

# --- MAIN DOCX GENERATION FUNCTION ---
def generate_price_quotation_boq(data):
    """
    Generate a price quotation DOCX using provided data dict (flexible input).
    """
    from docxtpl import DocxTemplate
    from datetime import datetime
    import json
    import base64
    from io import BytesIO
    from docxtpl import InlineImage
    from docx.shared import Mm

    # Transform input to template context
    context = transform_input_to_template_context(data)

    # Instantiate the template first
    doc = DocxTemplate("Price_Quotation_Template_BOQ_new.docx")

    # Create InlineImage objects for logo and signature
    def image_from_data_url(doc, data_url, width):
        if not data_url:
            return None
        if isinstance(data_url, str) and data_url.startswith('data:image'):
            header, b64data = data_url.split(',', 1)
            img_bytes = BytesIO(base64.b64decode(b64data))
            return InlineImage(doc, img_bytes, width=Mm(width))
        else:
            return InlineImage(doc, data_url, width=Mm(width))

    logo_img = image_from_data_url(doc, context["logo"], 70)
    signature_img = image_from_data_url(doc, context["signature"], 70)
    context["logo"] = logo_img
    context["signature"] = signature_img

    # (No need to save context as JSON file)

    # Render DOCX
    doc.render(context)
    doc.save("Price_Quotation_Report.docx")

    return {"message": "Price quotation generated", "output": "Price_Quotation_Report.docx"}