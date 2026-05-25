from io import BytesIO

from docx import Document


def build_run_docx(run: dict) -> bytes:
    doc = Document()
    doc.add_heading("ModelWeave PPC/SEO Agency Workforce Report", level=1)
    doc.add_paragraph(f"Run ID: {run['id']}")
    doc.add_paragraph(f"Created at: {run['created_at']}")

    doc.add_heading("User Request", level=2)
    doc.add_paragraph(run["prompt"])

    doc.add_heading("Final Output", level=2)
    for paragraph in run["output"].split("\n"):
        doc.add_paragraph(paragraph)

    if run.get("evaluation"):
        evaluation = run["evaluation"]
        doc.add_heading("Execution Evaluation", level=2)
        doc.add_paragraph(f"Overall score: {evaluation.get('overall_score')}")
        doc.add_paragraph(f"Citation coverage: {evaluation.get('citation_coverage')}")
        doc.add_paragraph(f"Actionability: {evaluation.get('actionability')}")
        doc.add_paragraph(f"Risk control: {evaluation.get('risk_control')}")
        doc.add_paragraph(f"Completeness: {evaluation.get('completeness')}")
        doc.add_paragraph(evaluation.get("notes", ""))

    if run.get("approvals"):
        doc.add_heading("Approval-Gated Actions", level=2)
        for approval in run["approvals"]:
            doc.add_heading(approval.get("title", "Approval"), level=3)
            doc.add_paragraph(f"Status: {approval.get('status')}")
            doc.add_paragraph(approval.get("summary", ""))

    if run.get("events"):
        doc.add_heading("Execution Timeline", level=2)
        for event in run["events"]:
            doc.add_paragraph(f"{event.get('created_at')} - {event.get('event_type')}: {event.get('title')}")

    doc.add_heading("Agent Trace", level=2)
    for item in run["trace"]:
        doc.add_heading(item.get("agent_name", "Agent"), level=3)
        for paragraph in item.get("output", "").split("\n"):
            doc.add_paragraph(paragraph)

    doc.add_heading("Citations", level=2)
    for index, citation in enumerate(run["citations"], start=1):
        doc.add_paragraph(
            f"{index}. {citation.get('filename')} "
            f"(chunk {citation.get('chunk_index')}, score {citation.get('score'):.3f})"
        )
        snippet = citation.get("content", "")
        doc.add_paragraph(snippet[:900])

    out = BytesIO()
    doc.save(out)
    return out.getvalue()
