from io import BytesIO

from docx import Document


def build_run_docx(run: dict) -> bytes:
    doc = Document()
    doc.add_heading("ModelWeave Agent Report", level=1)
    doc.add_paragraph(f"Run ID: {run['id']}")
    doc.add_paragraph(f"Created at: {run['created_at']}")

    doc.add_heading("User Request", level=2)
    doc.add_paragraph(run["prompt"])

    doc.add_heading("Final Output", level=2)
    for paragraph in run["output"].split("\n"):
        doc.add_paragraph(paragraph)

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

