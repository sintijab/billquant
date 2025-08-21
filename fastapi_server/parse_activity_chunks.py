import re
import ast

def parse_activity_chunks(raw_results):
    """
    Accepts a list of raw activity chunk strings (as returned by /search endpoint),
    parses each into structured JSON with code, title, unit, quantity, resources, and summary.
    """
    parsed_activities = []
    code_pattern = r"[A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3}"
    for chunk_str in raw_results:
        # Find the first code and title
        code_title_match = re.match(r"([A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3})\s+(.+?)\s+Unit: (.*?), Quantity: (.*?) ", chunk_str)
        if code_title_match:
            code = code_title_match.group(1)
            title = code_title_match.group(2)
            unit = code_title_match.group(3)
            quantity = code_title_match.group(4)
        else:
            # fallback: try to get code and title only
            code_title_match = re.match(r"([A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3})\s+(.+)", chunk_str)
            code = code_title_match.group(1) if code_title_match else ''
            title = code_title_match.group(2) if code_title_match else chunk_str
            unit = ''
            quantity = ''

        # Find all resource blocks (start with code pattern, not the first one)
        resource_blocks = []
        for m in re.finditer(code_pattern, chunk_str):
            if m.start() == 0:
                continue  # skip the first code (main activity)
            resource_blocks.append(m.start())
        # Add end of string for last resource
        resource_blocks.append(len(chunk_str))

        # Extract resource strings
        resources = []
        if len(resource_blocks) > 1:
            for i in range(len(resource_blocks)-1):
                res_str = chunk_str[resource_blocks[i]:resource_blocks[i+1]]
                # Parse resource details
                res_code_match = re.match(r"([A-Z]\.\d{2}\.\d{2}\.\d{4}\.\d{3})\s+([\s\S]+?)\|", res_str)
                if res_code_match:
                    res_code = res_code_match.group(1)
                    res_desc = res_code_match.group(2).strip()
                else:
                    res_code = ''
                    res_desc = res_str.strip()
                # Parse key-value pairs
                res = {
                    'code': res_code,
                    'description': res_desc,
                    'formula': '',
                    'unit': '',
                    'quantity': '',
                    'price': '',
                    'total': ''
                }
                for kv in res_str.split('|')[1:]:
                    if ':' in kv:
                        k, v = kv.split(':', 1)
                        k = k.strip().lower()
                        v = v.strip()
                        if 'formula' in k:
                            res['formula'] = v
                        elif 'um' in k:
                            res['unit'] = v
                        elif 'qty' in k:
                            res['quantity'] = v
                        elif 'price' in k:
                            res['price'] = v
                        elif 'total' in k:
                            res['total'] = v
                resources.append(res)

        # Parse summary (look for 'Summary:' and parse dict)
        summary = {}
        summary_match = re.search(r"Summary:\s*(\{.*\})", chunk_str)
        if summary_match:
            try:
                summary_dict = ast.literal_eval(summary_match.group(1))
                summary = {
                    'total_analysis_amount': summary_dict.get('importo_totale_analisi'),
                    'application_price': summary_dict.get('prezzo_applicazione'),
                    'category_summary': {
                        'fuel_cost': summary_dict.get('riepilogo_categoria', {}).get('Costo carburanti'),
                        'machine_cost': summary_dict.get('riepilogo_categoria', {}).get('Costo macchine'),
                        'labor_cost': summary_dict.get('riepilogo_categoria', {}).get('Costo manodopera alla produzione'),
                        'material_fc_cost': summary_dict.get('riepilogo_categoria', {}).get('Costo materiali fc'),
                        'material_fm_cost': summary_dict.get('riepilogo_categoria', {}).get('Costo materiali fm'),
                        'amortization_and_other': summary_dict.get('riepilogo_categoria', {}).get('Ammortamenti, Componenti ad importo, Percentuali ed arrotondamenti'),
                    }
                }
            except Exception:
                summary = {'raw': summary_match.group(1)}

        parsed_activities.append({
            'code': code,
            'title': title,
            'unit': unit,
            'quantity': quantity,
            'resources': resources,
            'summary': summary
        })
    return parsed_activities
