import json
from collections import defaultdict
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from typing import Any, Dict

def set_run_font(run, font_name, font_size, bold=False, color=None):
    """Apply font style and color to a run."""
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)
    else:
        run.font.color.rgb = RGBColor(0, 0, 0)
    # Set line height and space before for the paragraph containing this run
    para = run._element.getparent()
    if hasattr(run, 'paragraph'):
        para = run.paragraph
    if para is not None and hasattr(para, 'paragraph_format'):
        para.paragraph_format.line_spacing = 1.5
        para.paragraph_format.space_before = Pt(6)

def set_table_header_bg_color(cell, rgb_hex="EDEDED"):
    """Set the background color of a table header cell."""
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), rgb_hex)
    tc_pr.append(shd)

def format_label(label):
    """Format JSON keys into human-readable labels."""
    return label.replace("_", " ").capitalize()

# -------------------------------
# Table Creation
# -------------------------------

def add_table(doc, title, data, columns):
    heading = doc.add_heading(level=3)
    run = heading.add_run(title)
    set_run_font(run, "Cambria", 15, bold=True, color=(26, 35, 126))
    heading.paragraph_format.space_after = Pt(12)

    if not data or not isinstance(data, list):
        p = doc.add_paragraph("No data available.")
        set_run_font(p.runs[0], "Cambria", 11)
        return

    formatted_columns = [format_label(col) for col in columns]
    table = doc.add_table(rows=1, cols=len(formatted_columns))
    table.style = "Table Grid"

    hdr_cells = table.rows[0].cells
    for i, col in enumerate(formatted_columns):
        cell_run = hdr_cells[i].paragraphs[0].add_run(col)
        set_run_font(cell_run, "Cambria", 10, bold=True, color=(255,255,255))
        set_table_header_bg_color(hdr_cells[i], "17365c")
        hdr_cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        hdr_cells[i].paragraphs[0].paragraph_format.line_spacing = 1.5
        hdr_cells[i].paragraphs[0].paragraph_format.space_before = Pt(6)

    # Fill table rows
    for row in data:
        if not isinstance(row, dict):
            continue
        row_cells = table.add_row().cells
        for i, col in enumerate(columns):
            value = row.get(col, "")
            # If value is False, empty list, or None, use empty string
            if value is False or value == [] or value is None:
                value = ""
            if isinstance(value, float):
                value = f"{value:.2f}"
            # Special style for total prices
            if str(col).lower() in {"total", "total_amount", "totalcost", "total price", "total price (€)", "total_cost", "totalcosts", "application_price"}:
                run = row_cells[i].paragraphs[0].add_run(str(value))
                set_run_font(run, "Arial", 10, bold=True)
            else:
                run = row_cells[i].paragraphs[0].add_run(str(value))
                set_run_font(run, "Cambria", 11)
            row_cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
            row_cells[i].paragraphs[0].paragraph_format.line_spacing = 1.5
            row_cells[i].paragraphs[0].paragraph_format.space_before = Pt(6)

# -------------------------------
# Cost Summary Section
# -------------------------------

def add_cost_summary(doc, cost_summary):
    heading = doc.add_heading("Internal Cost Summary", level=2)
    set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
    heading.paragraph_format.space_after = Pt(12)

    for key, value in cost_summary.items():
        label = format_label(key)
        p = doc.add_paragraph()
        run_label = p.add_run(f"{label}: ")
        set_run_font(run_label, "Cambria", 13, bold=True)
        run_value = p.add_run(f"{value}")
        set_run_font(run_value, "Cambria", 13, color=(26, 35, 126))  # Highlight totals in dark blue

# -------------------------------
# Main Report Generation
# -------------------------------

def generate_internal_costs_doc(data: Dict[str, Any], output_path: str = "Internal_Costs_Report.docx"):
    doc = Document()

    # Set margins
    for section in doc.sections:
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)

    # Title Page
    heading = doc.add_heading(level=1)
    run = heading.add_run("Internal Company Costs")
    set_run_font(run, "Cambria", 15, bold=True, color=(26, 35, 126))
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    heading.paragraph_format.space_after = Pt(18)
    doc.add_paragraph("")

    # Site info
    p = doc.add_paragraph(f"Site Address: {data.get('siteAddress', '')}")
    set_run_font(p.runs[0], "Times New Roman", 12)
    p = doc.add_paragraph(f"Client: {data.get('clientFirstName', '')} {data.get('clientSurname', '')}")
    set_run_font(p.runs[0], "Times New Roman", 12)
    doc.add_paragraph("")

    # Introduction section with bold before arrows (without alignment/disclaimer)
    intro_lines = [
        "The Internal Costs consolidates information from multiple project planning and cost estimation processes, including:",
        "Cost Breakdown → A summary of projected expenses, including materials, labor, subcontractors, equipment, and overhead.",
        "Price Summary → An overview of the estimated pricing structure and profit margins.",
        "Detailed Price Breakdown → Itemized costs for all components, categorized by activity and work area.",
        "Personnel Allocation → Staffing requirements, roles, and estimated work durations.",
        "Project Schedule → A timeline of construction activities, reflecting the planned sequence of work.",
        "Equipment & Materials Lists → Summaries of required machinery, tools, and material procurement details.",
        "Risk Analysis → Identification of potential risks and their impact on project timelines and costs."
    ]
    for line in intro_lines:
        para = doc.add_paragraph()
        if '→' in line:
            before, after = line.split('→', 1)
            run_bold = para.add_run(before.strip() + ' ')
            set_run_font(run_bold, "Cambria", 11, bold=True)
            run_normal = para.add_run('→' + after.strip())
            set_run_font(run_normal, "Cambria", 11, bold=False)
        else:
            run = para.add_run(line.strip())
            set_run_font(run, "Cambria", 11, bold=False)
        para.paragraph_format.line_spacing = 1.15
        para.paragraph_format.space_before = Pt(0)
        para.paragraph_format.space_after = Pt(0)
    # Add a bit of space after the intro section
    doc.add_paragraph("")

    # ...existing code for the rest of the document...

    # Add alignment/disclaimer at the end
    end_lines = [
        "This document ensures alignment between the project team, stakeholders, and financial planners, enabling:",
        "• Better cost control",
        "• Improved resource allocation",
        "• Early identification of risks and budget constraints",
        "• A clear reference for internal and client reporting.",
        "The figures and schedules contained herein are based on the best available data at the time of preparation. Any variations, design changes, or unforeseen circumstances may affect the final project cost and timeline."
    ]
    for line in end_lines:
        para = doc.add_paragraph()
        run = para.add_run(line.strip())
        set_run_font(run, "Cambria", 11, bold=False)
        para.paragraph_format.line_spacing = 1.15
        para.paragraph_format.space_before = Pt(0)
        para.paragraph_format.space_after = Pt(0)

    internal_costs = data.get("internalCosts", {})


    # --- Price Summary Bullet List ---
    price_summary = internal_costs.get("price_summary", {})
    if price_summary:
        heading = doc.add_heading("Price Summary", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        for key in ["subtotal_price", "general_expenses", "company_profit", "rounding", "total_costs", "application_price"]:
            value = price_summary.get(key, None)
            if value is not None:
                p = doc.add_paragraph(style=None)
                run = p.add_run(f"• {format_label(key)}: ")
                set_run_font(run, "Cambria", 11, bold=True)
                run2 = p.add_run(str(value))
                set_run_font(run2, "Cambria", 11)

    # --- Total Company Costs Bullet List ---
    total_company_costs = internal_costs.get("total_company_costs", {})
    if total_company_costs:
        heading = doc.add_heading("Total Company Costs", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        for key in ["subtotal", "global_costs", "markup", "total", "margin_check"]:
            value = total_company_costs.get(key, None)
            if value is not None:
                p = doc.add_paragraph(style=None)
                run = p.add_run(f"• {format_label(key)}: ")
                set_run_font(run, "Cambria", 11, bold=True)
                run2 = p.add_run(str(value))
                set_run_font(run2, "Cambria", 11)

    # --- Cost Breakdown Bullet List (moved after Total Company Costs) ---
    cost_breakdown = internal_costs.get("costBreakdown", {})
    if cost_breakdown:
        heading = doc.add_heading("Cost Breakdown", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        for key in ["materials", "labor", "subcontractors", "equipment", "directCosts", "totalCost", "overhead", "profitTarget", "markup"]:
            value = cost_breakdown.get(key, None)
            if value is not None:
                p = doc.add_paragraph(style=None)
                run = p.add_run(f"• {format_label(key)}: ")
                set_run_font(run, "Cambria", 11, bold=True)
                run2 = p.add_run(str(value))
                set_run_font(run2, "Cambria", 11)

    # Price Summary Table
    price_summary = internal_costs.get("price_summary", {})
    if price_summary:
        heading = doc.add_heading("Price Summary", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        # --- Price Summary Bullet List ---
        for key in ["subtotal_price", "general_expenses", "company_profit", "rounding", "total_costs", "application_price"]:
            value = price_summary.get(key, None)
            if value is not None:
                p = doc.add_paragraph(style=None)
                run = p.add_run(f"• {format_label(key)}: ")
                set_run_font(run, "Cambria", 11, bold=True)
                run2 = p.add_run(str(value))
                set_run_font(run2, "Cambria", 11)

    # Total Company Costs Table
    total_company_costs = internal_costs.get("total_company_costs", {})
    if total_company_costs:
        heading = doc.add_heading("Total Company Costs", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        # --- Total Company Costs Bullet List ---
        for key in ["subtotal", "global_costs", "markup", "total", "margin_check"]:
            value = total_company_costs.get(key, None)
            if value is not None:
                p = doc.add_paragraph(style=None)
                run = p.add_run(f"• {format_label(key)}: ")
                set_run_font(run, "Cambria", 11, bold=True)
                run2 = p.add_run(str(value))
                set_run_font(run2, "Cambria", 11)

    # Risk Analysis Section
    risk_analysis = internal_costs.get("risk_analysis", {})
    if risk_analysis:
        heading = doc.add_heading("Risk Analysis", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        for key, value in risk_analysis.items():
            label = format_label(key)
            p = doc.add_paragraph()
            run_label = p.add_run(f"{label}: ")
            set_run_font(run_label, "Cambria", 12, bold=True)
            run_value = p.add_run(str(value))
            set_run_font(run_value, "Cambria", 12)

    # Detailed Price Breakdown Tables by area_type and subarea_type
    detailed_price_breakdown = internal_costs.get("detailed_price_breakdown", [])
    if detailed_price_breakdown:
        area_groups = defaultdict(list)
        for item in detailed_price_breakdown:
            # Map 'roles' to comma-separated string
            roles = item.get("roles", [])
            if isinstance(roles, list):
                item["roles"] = ", ".join(str(r) for r in roles)
            # Map 'number_of_workers_and_type' to 'count role / duration' string(s)
            nwt = item.get("number_of_workers_and_type", [])
            if isinstance(nwt, list):
                nwt_strs = []
                for n in nwt:
                    if isinstance(n, dict):
                        count = n.get("count", "")
                        role = n.get("role", "")
                        duration = n.get("duration", "")
                        part = f"{count} {role}".strip()
                        if duration:
                            part += f" / {duration}"
                        nwt_strs.append(part.strip())
                    else:
                        nwt_strs.append(str(n))
                item["number_of_workers_and_type"] = ", ".join(nwt_strs)
            area = item.get("area_type", "General") or "General"
            area_groups[area].append(item)
        dpb_cols = ["subarea_type", "code", "title", "description", "unit", "quantity", "unit_price", "total_amount", "contractors_needed", "subcontractors_needed", "roles", "number_of_workers_and_type", "total_hours", "cost_hour", "total_cost", "safety_courses_requirements"]
        for area_type, items in area_groups.items():
            heading = doc.add_heading(f"Detailed Price Breakdown for {area_type}", level=2)
            set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
            heading.paragraph_format.space_after = Pt(12)
            # Group by subarea_type within each area
            subarea_groups = defaultdict(list)
            for item in items:
                subarea = item.get("subarea_type", "") or "general"
                subarea_groups[subarea].append(item)
            for subarea_type, subitems in subarea_groups.items():
                table_title = f"Subarea: {subarea_type}" if subarea_type else "Subarea: general"
                add_table(doc, table_title, subitems, dpb_cols)

    # Personnel Table
    personnel = internal_costs.get("personnel", [])
    if personnel:
        heading = doc.add_heading("Personnel", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        people_cols = ["role", "count", "duration"]
        add_table(doc, "", personnel, people_cols)

    # Project Schedule Table
    schedule = internal_costs.get("projectSchedule", [])
    if schedule:
        heading = doc.add_heading("Project Schedule", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)

        def personnel_to_str(personnel):
            return "\n".join([
                f"{p.get('role', '')} ({p.get('duration', '')})" for p in personnel if isinstance(p, dict)
            ]) if isinstance(personnel, list) else str(personnel)

        schedule_rows = []
        for entry in schedule:
            row = dict(entry)
            row["personnel"] = personnel_to_str(entry.get("personnel", []))
            for k in ["starting", "finishing"]:
                v = row.get(k, None)
                if v is not None and str(v).strip() != "":
                    row[k] = f"{v} days"
            schedule_rows.append(row)
        sched_cols = ["activity", "starting", "finishing", "personnel"]
        add_table(doc, "", schedule_rows, sched_cols)

    # Equipment Table
    equipment = internal_costs.get("equipment", [])
    if equipment:
        heading = doc.add_heading("Equipment", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        eq_cols = ["name", "quantity", "unity", "price_per_unit", "price_of_unity_provider", "company_cost_eur", "markup_percentage", "final_cost_for_client_eur"]
        add_table(doc, "", equipment, eq_cols)

    # Materials Table
    materials = internal_costs.get("materials", [])
    if materials:
        heading = doc.add_heading("Materials", level=2)
        set_run_font(heading.runs[0], "Cambria", 15, bold=True, color=(26, 35, 126))
        heading.paragraph_format.space_after = Pt(12)
        mat_cols = ["name", "quantity", "unity", "price_per_unit", "price_of_unity_provider", "company_cost_eur", "markup_percentage", "final_cost_for_client_eur"]
        add_table(doc, "", materials, mat_cols)

    # Save file
    doc.save(output_path)
    return output_path
