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
    address = data.get('siteAddress') or data.get('address', '')
    issued_by = f"{data.get('issuedByFirstName', '')} {data.get('issuedBySurname', '')}".strip()
    logo = data.get('logo') or data.get('companyLogo', '')
    signature = data.get('digitalSignature') or data.get('signature', '')
    email = data.get('clientEmail', data.get('email', ''))
    pec_email = data.get('pec_email', email)
    region = data.get('region', 'Comune di Trento')
    company = data.get('issuedByCompany', '')
    offer_title = data.get('internalCosts', {}).get('offer_title', 'Offerta economica lavori')

    # --- Area Summaries ---
    site_area_summary = data.get('internalCosts', {}).get('site_area_summary', [])
    area_tables = []
    for area_idx, area in enumerate(site_area_summary):
        area_name = area.get('area', f'Area {area_idx+1}')
        work_activities = area.get('work_activities', [])
        resource_types = area.get('resource_types', [])
        # Build a table: each row is index, mapped summary
        rows = []
        for i, wa in enumerate(work_activities):
            desc = wa.get('description', '')
            wa_resources = wa.get('resources', [])
            cell_lines = []
            bullet_prefix = "&nbsp;&nbsp;• "  # Two non-breaking spaces for indentation
            sub_bullet_prefix = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;◦ "  # More spaces for sub-bullet
            def clean_unit(unit):
                return str(unit).replace('mÂ²', 'm²').replace('m^2', 'm²').replace('Â', '')

            # Helper to find matching area resource
            def find_area_resource(area_resources, res):
                for ar in area_resources:
                    if ar.get('name') == res.get('name') and ar.get('type') == res.get('type'):
                        return ar
                return None

            # Collect all unique resource types present in wa_resources
            all_types = set([r.get('type') for r in wa_resources if r.get('type')])
            area_resources = area.get('resources', [])
            mapped_resources = set()
            # Always process all types present, not just those in resource_types
            for rtype in all_types:
                rlist = [r for r in wa_resources if r.get('type') == rtype]
                if not rlist:
                    continue
                if rtype == 'operativita':
                    for r in rlist:
                        steps = r.get('steps', [])
                        if steps:
                            cell_lines.append(f"{bullet_prefix}<b>{rtype.capitalize()}:</b>")
                            for step in steps:
                                for sub in [s.strip() for s in step.split(';') if s.strip()]:
                                    cell_lines.append(f"{sub_bullet_prefix}{sub}")
                        mapped_resources.add((r.get('name'), r.get('type')))
                elif rtype == 'servizi':
                    for r in rlist:
                        details = r.get('details', [])
                        if details:
                            cell_lines.append(f"{bullet_prefix}<b>{rtype.capitalize()}:</b>")
                            for detail in details:
                                for sub in [s.strip() for s in detail.split(';') if s.strip()]:
                                    cell_lines.append(f"{sub_bullet_prefix}{sub}")
                        mapped_resources.add((r.get('name'), r.get('type')))
                else:
                    vals = []
                    for r in rlist:
                        name = r.get('name', '')
                        qty = r.get('quantity', '')
                        unit = clean_unit(r.get('unit', ''))
                        unit = str(unit).replace('mÂ²', 'm²').replace('m^2', 'm²').replace('Â', '')
                        res_str = ""
                        if name and qty and unit:
                            res_str = f"{qty} {unit} {name}"
                        elif name and qty:
                            res_str = f"{qty} {name}"
                        elif name:
                            res_str = name
                        area_res = find_area_resource(area_resources, r)
                        if area_res:
                            wa_desc = desc or ''
                            wa_qty = wa.get('quantity', '')
                            wa_unit = clean_unit(wa.get('unit', ''))
                            wa_unit = str(wa_unit).replace('mÂ²', 'm²').replace('m^2', 'm²').replace('Â', '')
                            extra_parts = []
                            if wa_desc:
                                extra_parts.append(str(wa_desc))
                            if wa_qty and wa_unit:
                                extra_parts.append(f"{wa_qty} {wa_unit}")
                            elif wa_qty:
                                extra_parts.append(str(wa_qty))
                            elif wa_unit:
                                extra_parts.append(str(wa_unit))
                            extra = ', '.join(extra_parts)
                            if extra:
                                res_str = f"{res_str}, {extra}"
                        vals.append(res_str)
                        mapped_resources.add((name, r.get('type')))
                    if vals:
                        cell_lines.append(f"{bullet_prefix}<b>{rtype.capitalize()}:</b> " + ', '.join(vals))

            # Add unmapped area.resources
            for ar in area_resources:
                key = (ar.get('name'), ar.get('type'))
                if key not in mapped_resources:
                    name = ar.get('name', '')
                    qty = ar.get('quantity', '')
                    unit = clean_unit(ar.get('unit', ''))
                    unit = str(unit).replace('mÂ²', 'm²').replace('m^2', 'm²').replace('Â', '')
                    res_str = ""
                    if name and qty and unit:
                        res_str = f"{qty} {unit} {name}"
                    elif name and qty:
                        res_str = f"{qty} {name}"
                    elif name:
                        res_str = name
                    cell_lines.append(f"{bullet_prefix}<b>{ar.get('type','').capitalize()}:</b> {res_str}")
            # Also handle operativita and servizi if present but not in all_types
            for rtype in ['operativita', 'servizi']:
                if rtype not in all_types:
                    rlist = [r for r in wa_resources if r.get('type') == rtype]
                    if not rlist:
                        continue
                    if rtype == 'operativita':
                        for r in rlist:
                            steps = r.get('steps', [])
                            if steps:
                                cell_lines.append(f"{bullet_prefix}<b>{rtype.capitalize()}:</b>")
                                for step in steps:
                                    for sub in [s.strip() for s in step.split(';') if s.strip()]:
                                        cell_lines.append(f"{sub_bullet_prefix}{sub}")
                    elif rtype == 'servizi':
                        for r in rlist:
                            details = r.get('details', [])
                            if details:
                                cell_lines.append(f"{bullet_prefix}<b>{rtype.capitalize()}:</b>")
                                for detail in details:
                                    for sub in [s.strip() for s in detail.split(';') if s.strip()]:
                                        cell_lines.append(f"{sub_bullet_prefix}{sub}")
            # Fallback: show all resources as a flat list if nothing else was added
            if not cell_lines and wa_resources:
                vals = []
                for r in wa_resources:
                    name = r.get('name', '')
                    qty = r.get('quantity', '')
                    unit = clean_unit(r.get('unit', ''))
                    if name and qty and unit:
                        vals.append(f"{qty} {name} ({unit})")
                    elif name and qty:
                        vals.append(f"{qty} {name}")
                    elif name:
                        vals.append(name)
                if vals:
                    cell_lines.append(f"{bullet_prefix}" + ', '.join(vals))
            activity_with_space = f"&nbsp;&nbsp;{desc}" if desc else desc
            rows.append({
                'idx': i+1,
                'activity': activity_with_space,
                'summary': '\n'.join(cell_lines)
            })
        area_tables.append({
            'area_name': area_name,
            'rows': rows
        })

    # Totals and summary
    price_summary = data.get('internalCosts', {}).get('price_summary', {})
    currency = price_summary.get('currency', 'EUR')
    total_price = price_summary.get('application_price', price_summary.get('total_price', ''))
    vat = data.get('vat', 22)
    application_price_before_vat = price_summary.get('application_price_before_vat', '')
    quotation_intro = price_summary.get('quotation_intro', 'La presente è lieta di presentarvi la seguente offerta per la fornitura di servizi di pulizia presso le vostre sedi. La nostra proposta è studiata per garantire elevati standard di igiene e sicurezza, con personale qualificato, logistica e spostamenti autonomi da e verso ogni location, oltre alla strumentazione per la pulizia (da concordare separatamente eventuali prodotti o trattamenti specifici e modalità di intervento in base alle peculiarità di ogni struttura). Ci si rendi disponibili inoltre ad utilizzare esclusivamente prodotti pulenti naturali, assicurando ai vostri clienti una migliore respirazione esente da sostanze chimiche, in linea con un approccio sostenibile e attento alla salute.')

    # Clauses
    default_clauses = (
        "1. Prezzi e inclusioni \n I prezzi indicati si intendono comprensivi di tutti i materiali, attrezzature, manodopera, oneri di smaltimento e ogni altra prestazione necessaria per l'esecuzione delle lavorazioni, secondo le specifiche del presente capitolato. In caso di affidamento, verrà redatta una contabilità a consuntivo verificata con la Direzione Lavori, sulla base dei prezzi riportati.\n"
        "2. Lavorazioni extra e varianti \n Eventuali lavorazioni extra, modifiche in corso d'opera o varianti richieste rispetto a quanto preventivato saranno soggette ad approvazione prima dell'esecuzione e svolte in economia come da voce P.\n"
        "3. L'impresa garantisce \n- L'utilizzo di materiali conformi alle normative vigenti; \n- Personale qualificato; \n- Assistenza tecnica durante tutte le fasi di realizzazione.\n"
        "4. A carico della committenza \n- Fornitura di acqua di cantiere; \n- Messa a disposizione di uno spazio per deposito materiali e attrezzature; \n- Eventuali oneri per occupazione suolo pubblico e/o autorizzazioni comunali; \n- IVA di legge (non inclusa nei prezzi).\n"
        "5. Modalità di pagamento \n- 40% a titolo di acconto alla conferma dell'ordine; \n- 50% alla conclusione delle lavorazioni; \n- 10% saldo finale a collaudo avvenuto.\n"
        "6. Tempi di consegna e saluti Tempi di consegna e durata lavori: da definire in accordo con la Direzione Lavori. Ringraziando per l'attenzione e la fiducia, restiamo a disposizione per ogni chiarimento e porgiamo cordiali saluti."
    )
    clauses = data.get('contractTerms', default_clauses)
    import re
    clauses_lines = []
    for line in clauses.split('\n'):
        line_stripped = line.strip()
        if re.match(r"^\d+\.", line_stripped):
            clauses_lines.append({"text": line_stripped, "bold": True})
        else:
            clauses_lines.append({"text": line_stripped, "bold": False})

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
        "offer_title": offer_title,
        "area_tables": area_tables,
        "total_price": total_price,
        "application_price_before_vat": application_price_before_vat,
        "vat": vat,
        "currency": currency,
        "clauses_lines": clauses_lines,
        "quotation_intro": quotation_intro,
    }
    return context

# --- MAIN DOCX GENERATION FUNCTION ---
def generate_price_quotation(data):
    """
    Generate a price quotation DOCX using provided data dict (flexible input).
    """
    from docxtpl import DocxTemplate, InlineImage
    from docx.shared import Mm
    import os
    tpl_path = "Price_Quotation_Template.docx"
    doc = DocxTemplate(tpl_path)

    # Transform input to template context
    context = transform_input_to_template_context(data)

    # Prepare images for docxtpl if needed
    if context["logo"]:
        try:
            if isinstance(context["logo"], str) and context["logo"].startswith("data:image"):
                header, b64data = context["logo"].split(",", 1)
                img_bytes = io.BytesIO(base64.b64decode(b64data))
                context["logo"] = InlineImage(doc, img_bytes, width=Mm(40))
            else:
                context["logo"] = InlineImage(doc, context["logo"], width=Mm(40))
        except Exception:
            context["logo"] = ""
    if context["signature"]:
        try:
            if isinstance(context["signature"], str) and context["signature"].startswith("data:image"):
                header, b64data = context["signature"].split(",", 1)
                img_bytes = io.BytesIO(base64.b64decode(b64data))
                context["signature"] = InlineImage(doc, img_bytes, width=Mm(40))
            else:
                context["signature"] = InlineImage(doc, context["signature"], width=Mm(40))
        except Exception:
            context["signature"] = ""

    # Load and render the template
    tpl_path = "Price_Quotation_Template.docx"
    output_path = "Price_Quotation_Report.docx"
    try:
        doc.render(context)
        doc.save(output_path)
        return {"message": "Price quotation generated", "output": output_path}
    except Exception as e:
        print("DOCX generation error:", e)
        return {"error": str(e), "output_path": None}
