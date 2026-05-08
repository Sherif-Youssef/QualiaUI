from io import BytesIO
from datetime import datetime, timezone

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from src.runs.models import TestSuiteRun, RunStatus

def generate_test_suite_report(run: TestSuiteRun) -> bytes:
    """
    Generates a professional PDF report for a TestSuiteRun.
    """
    buffer = BytesIO()
    
    # Set up the document
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=50,
        bottomMargin=50
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e293b"),
        alignment=TA_CENTER,
        spaceAfter=25,
        fontName="Helvetica-Bold"
    )
    
    subtitle_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor("#334155"),
        spaceBefore=15,
        spaceAfter=15,
        fontName="Helvetica-Bold"
    )

    metadata_label_style = ParagraphStyle(
        'MetaDataLabel',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        fontName="Helvetica-Bold"
    )

    metadata_value_style = ParagraphStyle(
        'MetaDataValue',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica"
    )

    failure_title_style = ParagraphStyle(
        'FailureTitle',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor("#b91c1c"),
        spaceBefore=10,
        spaceAfter=5,
        fontName="Helvetica-Bold"
    )

    failure_text_style = ParagraphStyle(
        'FailureText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8,
        fontName="Helvetica"
    )
    
    # helper for status colors
    def get_status_color(status_val):
        s = status_val.upper()
        if s in ['PASSED', 'SUCCESS', 'EXECUTED']:
            return colors.HexColor("#059669") # Emerald
        elif s in ['FAILED', 'FAILURE', 'ERROR']:
            return colors.HexColor("#dc2626") # Red
        elif s == 'ABORTED':
            return colors.HexColor("#64748b") # Grey
        else:
            return colors.HexColor("#94a3b8") # Light Grey for others
    
    # Add Title
    elements.append(Paragraph("Test Suite Execution Report", title_style))
    
    # Add Summary Information
    triggered_at_str = run.created_at.strftime('%B %d, %Y at %I:%M %p') if run.created_at else "N/A"
    
    runs = run.testcase_runs if hasattr(run, "testcase_runs") and run.testcase_runs else []
    total_tests = len(runs)
    passed_tests = sum(1 for r in runs if r.status == RunStatus.PASSED)
    
    # Determine overall status color
    status_color = get_status_color(run.status.value)
    status_formatted = f'<font color="{status_color.hexval()}"><b>{run.status.value.upper()}</b></font>'

    meta_data = [
        [Paragraph("Status:", metadata_label_style), Paragraph(status_formatted, metadata_value_style),
         Paragraph("Passed:", metadata_label_style), Paragraph(f"{passed_tests} / {total_tests}", metadata_value_style)],
        [Paragraph("Triggered at:", metadata_label_style), Paragraph(triggered_at_str, metadata_value_style),
         "", ""],
    ]
    
    meta_table = Table(meta_data, colWidths=[80, 180, 80, 180])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor("#e2e8f0")),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor("#e2e8f0")),
    ]))
    
    elements.append(meta_table)
    elements.append(Spacer(1, 20))
    
    # Section: Tests Summary
    elements.append(Paragraph("Test Results Summary", subtitle_style))
    
    # Prepare table data, with Header row
    table_data = [["ID", "Name", "Status", "Duration"]]
    failures = []
    
    for case_run in runs:
        # Calculate duration if possible
        duration_str = "-"
        if case_run.started_at and case_run.finished_at:
            delta = case_run.finished_at - case_run.started_at
            duration_str = f"{delta.total_seconds():.2f}s"
            
        name = getattr(case_run, "name", None) or "N/A"
        if len(name) > 70:
            name = name[:67] + "..."
            
        table_data.append([
            str(case_run.testcase_id),
            name,
            case_run.status.value.upper(),
            duration_str
        ])
        
        # Track failures for the detailed section later
        if case_run.status in (RunStatus.FAILED, RunStatus.ERROR):
            failures.append(case_run)
            
    # Create the Summary Table
    # colWidths adjust widths of (ID, Name, Status, Duration)
    summary_table = Table(table_data, colWidths=[60, 320, 80, 70], repeatRows=1)
    
    # Style for the summary table
    table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#334155")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'), # Center Status and Duration
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor("#cbd5e1")),
    ]
    
    # Add subtle striping and conditional status colors
    for i, row in enumerate(table_data[1:], start=1):
        bg_color = colors.white if i % 2 == 1 else colors.HexColor("#fafafa") # Subtle alternation
        table_style.append(('BACKGROUND', (0, i), (-1, i), bg_color))
        table_style.append(('FONTNAME', (0, i), (-1, i), 'Helvetica'))
        table_style.append(('FONTSIZE', (0, i), (-1, i), 9))
        table_style.append(('BOTTOMPADDING', (0, i), (-1, i), 10))
        table_style.append(('TOPPADDING', (0, i), (-1, i), 10))
        table_style.append(('LINEBELOW', (0, i), (-1, i), 1, colors.HexColor("#f1f5f9")))
        
        # Color the status conditionally
        status_val = row[2]
        c = get_status_color(status_val)
        table_style.append(('TEXTCOLOR', (2, i), (2, i), c))

    summary_table.setStyle(TableStyle(table_style))
    elements.append(summary_table)
    
    # Section: Failures and Errors Detail
    if failures:
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("Failures Detail", subtitle_style))
        
        # Add a subtle line below the subtitle using a 1-row table
        line_table = Table([[""]], colWidths=[530])
        line_table.setStyle(TableStyle([('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor("#e2e8f0"))]))
        elements.append(line_table)
        elements.append(Spacer(1, 10))
        
        for failed_case in failures:
            block = []
            
            c = get_status_color(failed_case.status.value)
            title_html = f'<b>Test Case #{failed_case.testcase_id}</b> &mdash; <font color="{c.hexval()}">{failed_case.status.value.upper()}</font>'
            
            block.append(Paragraph(title_html, failure_title_style))
            
            name = getattr(failed_case, "name", None) or "N/A"
            block.append(Paragraph(f"<b>Name:</b> {name}", failure_text_style))
            
            reason = failed_case.termination_reason or "No termination reason provided."
            # Render reason with line breaks if any
            reason_formatted = reason.replace('\n', '<br/>')
            block.append(Paragraph(f"<b>Reason:</b> {reason_formatted}", failure_text_style))
            
            block.append(Spacer(1, 15))
            
            # Use KeepTogether to prevent a single failure block from splitting across pages badly
            elements.append(KeepTogether(block))
    
    # Build the PDF document
    doc.build(elements)
    
    # Extract bytes and close buffer
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
