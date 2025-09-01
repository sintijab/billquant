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

    # Map items in the order of projectSchedule activities
    items = []
    price_quotation = data.get('priceQuotation')
    if price_quotation is None:
        price_quotation = data.get('internalCosts', {}).get('boq', [])
    project_schedule = data.get('internalCosts', {}).get('projectSchedule', [])
    # Build a mapping from activity name to BOQ entry
    pq_by_activity = {}
    for pq in price_quotation:
        activity_name = pq.get('activityName') or pq.get('activity') or pq.get('title', '')
        pq_by_activity[activity_name] = pq

    # Iterate project_schedule in order, and for each, add items for that activity
    for sched in project_schedule:
        sched_activity = sched.get('activity', '')
        pq = pq_by_activity.get(sched_activity)
        if not pq:
            continue
        # Find matching projectSchedule entry (should be sched itself)
        personnel = sched.get('personnel', [])
        estimated_time = ', '.join([p.get('duration', '') for p in personnel if p.get('duration')])
        people = ', '.join([f"{p.get('count', '')} {p.get('role', '')}".strip() for p in personnel if p.get('count') or p.get('role')])
        resources = pq.get('resources', [])
        if resources:
            for res in resources:
                total_val = res.get('total', pq.get('amount', ''))
                if total_val is not None and str(total_val).strip() != '' and str(total_val).strip().lower() != 'none':
                    items.append({
                        "work": res.get('description', ''),
                        "quantity": res.get('quantity', pq.get('quantity', '')),
                        "price_unit": f"{res.get('price', pq.get('unit_price', ''))} / {str(res.get('unit', pq.get('unit', ''))).replace('mÂ²', 'm²').replace('m^2', 'm²').replace('Â', '')}",
                        "total": total_val,
                        "work_method": f"{pq.get('mainCategory', '')}, {pq.get('title', pq.get('activity', ''))}",
                        "estimated_time": estimated_time,
                        "people": people,
                    })
        else:
            summary = pq.get('summary', {})
            items.append({
                "work": pq.get('title', pq.get('activity', '')),
                "quantity": f"{pq.get('quantity', '')} {pq.get('unit', '')}",
                "price_unit": pq.get('unit_price', ''),
                "total": summary.get('totalPrice', pq.get('total', pq.get('amount', ''))),
                "work_method": pq.get('mainCategory', ''),
                "estimated_time": estimated_time,
                "people": people,
            })

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
    doc = DocxTemplate("Price_Quotation_Template_BOQ.docx")

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