import { COLORS, addBody, addCard, addHeader, addStep, setBase } from "./shared.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Goal and tasks", 2);
  addHeader(slide, ctx, "Goal and tasks", "Build a scalable LLM architecture, not a single chatbot");

  addCard(slide, ctx, { left: 64, top: 168, width: 430, height: 364, fill: COLORS.navy, stroke: COLORS.navy });
  addBody(slide, ctx, "Goal", 96, 200, 120, 30, { fontSize: 16, color: COLORS.teal, bold: true });
  addBody(
    slide,
    ctx,
    "Design and evaluate a service-oriented architecture for scalable use of language models in commercial workflows.",
    96,
    236,
    340,
    154,
    { fontSize: 22, color: COLORS.white, bold: true }
  );
  addBody(
    slide,
    ctx,
    "Case study: ModelWeave, a document-grounded agent platform with RAG, reusable agents, workflows, approvals, audit events, tasks, and DOCX reports.",
    96,
    420,
    338,
    62,
    { fontSize: 16, color: "#DCE7F3" }
  );

  const tasks = [
    ["Theory", "Review LLMs, RAG, vector search, SOA, and multi-agent systems."],
    ["Requirements", "Define functional and non-functional needs for a document-agent platform."],
    ["Mathematics", "Formalize retrieval, embeddings, workflow graphs, approvals, and evaluation."],
    ["Implementation", "Build the full-stack application using Next.js, FastAPI, Supabase, Qdrant, and Anthropic."],
    ["Validation", "Run synthetic document workflows and verify reports, events, citations, approvals, and tasks."],
  ];
  tasks.forEach(([title, text], index) => {
    addStep(slide, ctx, index + 1, title, text, 550, 154 + index * 88, 604, index % 2 === 0 ? COLORS.teal : COLORS.blue);
  });

  slide.speakerNotes.setText(`Timing: about 1.5 minutes.

The goal of the work is to design, formalize, implement, deploy, and evaluate a service-oriented architecture that allows language models to be used in a scalable commercial workflow.

The main idea is that a commercial LLM system should not be only one prompt or one chat window. The model should be one component inside a controlled workflow.

To reach this goal, I completed five main tasks.

First, I reviewed the theoretical basis: large language models, retrieval-augmented generation, vector search, service-oriented architecture, and multi-agent systems.

Second, I defined requirements for a document-grounded agent platform: document database, agents, workflows, runs, approvals, tasks, and reports.

Third, I built the mathematical model. It formalizes the document corpus, chunking, embeddings, cosine similarity, top-k retrieval, workflow graphs, approval state transitions, and quality evaluation.

Fourth, I implemented the full-stack prototype with Next.js, FastAPI, Supabase, Qdrant, and Anthropic API.

Fifth, I validated the system using synthetic document workflows, test outputs, screenshots, citations, approval records, tasks, and generated DOCX reports.`);
  return slide;
}
