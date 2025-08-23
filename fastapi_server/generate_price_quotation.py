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
    """
    from datetime import datetime
    # Compose client name
    client = f"{data.get('clientFirstName', '')} {data.get('clientSurname', '')}".strip()
    # Compose address (siteAddress or address)
    address = data.get('address') or data.get('address', 'Address:')
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

    # Extract items from priceQuotation, loop through resources for each item
    items = []
    price_quotation = data.get('priceQuotation', [])
    project_schedule = data.get('internalCosts', {}).get('projectSchedule', [])
    for pq in price_quotation:
        activity_name = pq.get('activityName') or pq.get('activity') or pq.get('title', '')
        # Find matching projectSchedule entry
        schedule_matches = [s for s in project_schedule if s.get('activity') == activity_name]
        estimated_time = ''
        people = ''
        if schedule_matches:
            personnel = schedule_matches[0].get('personnel', [])
            # estimated_time: join all durations by comma if multiple
            estimated_time = ', '.join([p.get('duration', '') for p in personnel if p.get('duration')])
            # people: join as "count role" for each
            people = ', '.join([f"{p.get('count', '')} {p.get('role', '')}".strip() for p in personnel if p.get('count') or p.get('role')])
        # Loop through resources for detailed items
        resources = pq.get('resources', [])
        if resources:
            for res in resources:
                total_val = res.get('total', pq.get('amount', ''))
                # Only append if total is not None, not empty, and not the string 'None'
                if total_val is not None and str(total_val).strip() != '' and str(total_val).strip().lower() != 'none':
                    items.append({
                        "work": f"{pq.get('mainCategory', '')}, {pq.get('title', pq.get('activity', ''))}",
                        "quantity": res.get('quantity', pq.get('quantity', '')),
                        "price_unit": res.get('price', pq.get('unit_price', '')),
                        "total": total_val,
                        "work_method": pq.get('mainCategory', ''),
                        "estimated_time": estimated_time,
                        "people": people,
                    })
        else:
            # fallback: add one item if no resources
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

    # Totals
    # Try to get from summary or internalCosts
    price_total_gross = None
    tax = None
    price_total_net = None
    if price_quotation and 'summary' in price_quotation[0]:
        summary = price_quotation[0]['summary']
        try:
            price_total_gross = float(summary.get('totalPrice', '0').replace(',', '.'))
        except Exception:
            price_total_gross = 0.0
        # Try to parse VAT if possible
        try:
            if 'totalPriceWithVAT' in summary:
                # e.g. "38.463 * 1.22"
                expr = summary['totalPriceWithVAT']
                if '*' in expr:
                    base, mult = expr.split('*')
                    price_total_net = float(base.strip().replace(',', '.')) * float(mult.strip())
                    tax = price_total_net - price_total_gross
        except Exception:
            price_total_net = None
            tax = None
    if price_total_gross is None:
        # fallback to internalCosts
        internal = data.get('internalCosts', {})
        try:
            price_total_gross = float(internal.get('costBreakdown', {}).get('totalCost', '0').replace(',', '.'))
        except Exception:
            price_total_gross = 0.0
    if price_total_net is None:
        # fallback: add 22% VAT
        price_total_net = price_total_gross * 1.22
        tax = price_total_net - price_total_gross

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
def generate_price_quotation(data):
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
    doc = DocxTemplate("Price_Quotation_Template.docx")

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

    # Add introduction paragraph below client info, above first table (compact, font 11, no line breaks)
    # Instruct template users to set line height 1.15 and no space before for this paragraph style
    context["quotation_intro"] = (
        "Il presente Rapporto di Preventivo Prezzi è stato redatto al fine di fornire una stima dettagliata e trasparente dei costi, delle risorse e dei tempi previsti per i lavori di costruzione e ristrutturazione proposti. "
        "Lo scopo di questo documento è delineare l’ambito dei lavori, i materiali e le attrezzature necessari, nonché i costi della manodopera correlati, al fine di realizzare il progetto in conformità alle normative vigenti e agli standard di qualità applicabili."
    )

    # Render DOCX
    doc.render(context)
    # Post-process: justify intro and set line height 1.15
    from docx import Document as DocxDocument
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt
    output_path = "Price_Quotation_Report.docx"
    doc.save(output_path)

    # Open and adjust the intro paragraph
    docx = DocxDocument(output_path)
    for para in docx.paragraphs:
        if para.text.strip().startswith("Il presente Rapporto di Preventivo Prezzi"):
            para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            para.paragraph_format.line_spacing = 1.15
            break
    docx.save(output_path)

    return {"message": "Price quotation generated", "output": output_path}