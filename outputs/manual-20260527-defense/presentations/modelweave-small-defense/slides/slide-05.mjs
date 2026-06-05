import { COLORS, addBody, addCard, addHeader, addPill, setBase } from "./shared.mjs";

function formulaBox(slide, ctx, title, formula, note, left, top, width, accent) {
  addCard(slide, ctx, { left, top, width, height: 130, fill: COLORS.white, stroke: "#D8E3EE" });
  ctx.addShape(slide, { left, top, width: 7, height: 130, fill: accent });
  addBody(slide, ctx, title, left + 24, top + 16, width - 44, 24, { fontSize: 14, color: COLORS.teal, bold: true });
  addBody(slide, ctx, formula, left + 24, top + 46, width - 44, 34, { fontSize: 18, color: COLORS.navy, bold: true, typeface: "Aptos Mono" });
  addBody(slide, ctx, note, left + 24, top + 86, width - 44, 34, { fontSize: 12, color: COLORS.muted });
}

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Math: RAG", 5);
  addHeader(slide, ctx, "Mathematical model I", "RAG turns documents into vectors, then ranks evidence before generation");

  addCard(slide, ctx, { left: 64, top: 156, width: 1090, height: 76, fill: COLORS.faint });
  addBody(slide, ctx, "Document corpus", 92, 174, 190, 24, { fontSize: 15, color: COLORS.teal, bold: true });
  addBody(slide, ctx, "D = {d1, d2, ..., dn};   di = {ci,1, ci,2, ..., ci,mi};   φ(cj) = ej ∈ Rᵈ", 278, 174, 760, 24, {
    fontSize: 18,
    color: COLORS.navy,
    bold: true,
    typeface: "Aptos Mono",
  });
  addBody(slide, ctx, "Documents are parsed, chunked, embedded, and stored as searchable vectors.", 278, 202, 680, 22, {
    fontSize: 13,
    color: COLORS.muted,
  });

  formulaBox(
    slide,
    ctx,
    "Similarity",
    "sim(q, cj) = (vq · ej) / (||vq|| ||ej||)",
    "Cosine similarity ranks text chunks by semantic closeness to the query.",
    64,
    270,
    510,
    COLORS.blue
  );
  formulaBox(
    slide,
    ctx,
    "Top-k retrieval",
    "Rk(q) = arg top-k cj∈C sim(q, cj)",
    "Only the most relevant chunks are injected into the agent context.",
    644,
    270,
    510,
    COLORS.teal
  );
  formulaBox(
    slide,
    ctx,
    "RAG generation",
    "P(y|q,Rk,a)=Πt P(yt | y<t,q,Rk,a)",
    "The answer depends on the question, retrieved evidence, and agent role.",
    64,
    432,
    510,
    COLORS.green
  );
  formulaBox(
    slide,
    ctx,
    "Retrieval metrics",
    "Precision@k = |Rel(q) ∩ Rk(q)| / k",
    "Citation coverage is a practical MVP proxy for retrieval quality.",
    644,
    432,
    510,
    COLORS.amber
  );

  addPill(slide, ctx, "Embedding dimension d", 110, 604, 180, "#DBEAFE", COLORS.navy);
  addPill(slide, ctx, "Retrieval depth k", 330, 604, 160, "#CCFBF1", COLORS.navy);
  addPill(slide, ctx, "Chunk size b", 530, 604, 140, "#E0E7FF", COLORS.navy);
  addPill(slide, ctx, "Evidence citations", 710, 604, 170, "#FEF3C7", COLORS.navy);
  addPill(slide, ctx, "Agent role a", 920, 604, 140, "#DCFCE7", COLORS.navy);

  slide.speakerNotes.setText(`Timing: about 1.2 minutes.

Because my speciality is Applied Mathematics, I included a formal model of the system, not only implementation details.

The first part is the RAG model. User documents form a corpus D. Each document is split into chunks, and each chunk is transformed into a vector in a d-dimensional space.

When the user asks a question or runs a workflow, the query is also embedded. The system compares the query vector with document chunk vectors using cosine similarity.

The retrieval step selects the top-k chunks. In the prototype k is usually eight: enough evidence for citations, but still practical for model calls.

Generation is modeled as conditional probability. The output depends on the query, retrieved chunks, and agent role.

This slide is important because it shows that RAG in the project is not just a feature. It is a mathematical pipeline from documents to vectors, from vectors to ranked evidence, and from evidence to generated output.`);
  return slide;
}
