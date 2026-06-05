import { COLORS, addBody, addCard, addHeader, setBase } from "./shared.mjs";

function conclusionCard(slide, ctx, title, text, left, top, width, accent) {
  addCard(slide, ctx, { left, top, width, height: 118, fill: COLORS.white, stroke: COLORS.border });
  ctx.addShape(slide, { left, top, width: 7, height: 118, fill: accent });
  addBody(slide, ctx, title, left + 24, top + 18, width - 42, 26, { fontSize: 17, color: COLORS.navy, bold: true });
  addBody(slide, ctx, text, left + 24, top + 50, width - 42, 50, { fontSize: 13, color: COLORS.slate });
}

export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Conclusions", 9);
  addHeader(slide, ctx, "Conclusions", "ModelWeave proves that LLM capabilities can be organized as a managed commercial workflow");

  conclusionCard(
    slide,
    ctx,
    "SOA is the backbone",
    "Separate services make the system deployable, testable, and easier to scale.",
    76,
    178,
    340,
    COLORS.blue
  );
  conclusionCard(
    slide,
    ctx,
    "RAG grounds the output",
    "Documents are chunked, embedded, retrieved, and cited before agents produce recommendations.",
    470,
    178,
    340,
    COLORS.teal
  );
  conclusionCard(
    slide,
    ctx,
    "Agents represent roles",
    "Document reviewer, curator, task planner, QA, and report writer agents cooperate.",
    864,
    178,
    340,
    COLORS.blue
  );
  conclusionCard(
    slide,
    ctx,
    "Approvals reduce risk",
    "Persistent business changes are proposed first and applied only after human approval.",
    212,
    340,
    360,
    COLORS.amber
  );
  conclusionCard(
    slide,
    ctx,
    "The prototype is practical",
    "The result is a deployed web app with authentication, BYOK, uploads, workflows, audit events, and DOCX reports.",
    706,
    340,
    360,
    COLORS.green
  );

  addCard(slide, ctx, { left: 180, top: 532, width: 920, height: 64, fill: COLORS.faint });
  addBody(
    slide,
    ctx,
    "Future work: durable workflow queue, external connectors, richer evaluation, and organization-level permissions.",
    220,
    552,
    840,
    26,
    { fontSize: 17, color: COLORS.navy, bold: true }
  );

  slide.speakerNotes.setText(`Timing: about 1.5 minutes.

The main conclusion is that scalable commercial use of language models requires architecture, not only prompt engineering.

First, service-oriented architecture is the backbone of the system. By separating the frontend, backend, database, vector store, model provider, and deployment services, the application becomes easier to deploy, test, and extend.

Second, retrieval-augmented generation is necessary for grounding. The system does not rely only on the model's internal knowledge. It retrieves relevant document chunks and uses them as evidence for agent outputs.

Third, agents are useful when they represent focused work roles. In ModelWeave, document reviewer, database curator, task planner, QA, and report writer agents can cooperate inside one workflow.

Fourth, approval gates reduce operational risk. Business changes are proposed first and only applied after human approval. This is important for commercial systems where automatic changes can have consequences.

Fifth, the prototype is practical. It includes authentication, bring-your-own-key model access, document uploads, workflows, audit events, approvals, evaluations, and DOCX exports.

Future work could include a durable workflow queue, richer scheduling, external connectors, stronger retrieval benchmarks, richer evaluation methods, and organization-level permissions.`);
  return slide;
}
