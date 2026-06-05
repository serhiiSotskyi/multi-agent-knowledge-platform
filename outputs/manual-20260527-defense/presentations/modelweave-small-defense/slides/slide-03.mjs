import { COLORS, addBody, addBulletList, addCard, addHeader, addMiniNode, setBase } from "./shared.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Relevance", 3);
  addHeader(slide, ctx, "Relevance", "Commercial LLM adoption fails when model output is not connected to workflow control");

  addCard(slide, ctx, { left: 64, top: 170, width: 515, height: 300, fill: "#FFF7ED", stroke: "#FDBA74" });
  addBody(slide, ctx, "A chatbot can answer", 96, 202, 370, 34, { fontSize: 25, color: COLORS.navy, bold: true });
  addBulletList(
    slide,
    ctx,
    [
      { text: "Respond to a prompt without persistent business state", color: COLORS.amber },
      { text: "Summarize text without proving every operational decision", color: COLORS.amber },
      { text: "Draft recommendations but not safely execute team workflows", color: COLORS.amber },
      { text: "Give fluent output while hiding retrieval, risk, and audit context", color: COLORS.amber },
    ],
    100,
    256,
    420,
    50
  );

  addCard(slide, ctx, { left: 642, top: 170, width: 515, height: 300, fill: "#ECFDF5", stroke: "#99F6E4" });
  addBody(slide, ctx, "A commercial system must control", 674, 202, 420, 34, { fontSize: 25, color: COLORS.navy, bold: true });
  addBulletList(
    slide,
    ctx,
    [
      { text: "Users, documents, model keys, permissions, and storage", color: COLORS.teal },
      { text: "Retrieval, citations, agents, approvals, and audit events", color: COLORS.teal },
      { text: "Typed workflow nodes that turn outputs into proposed actions", color: COLORS.teal },
      { text: "Exported deliverables that can be reviewed outside the app", color: COLORS.teal },
    ],
    678,
    256,
    420,
    50
  );

  addCard(slide, ctx, { left: 168, top: 520, width: 890, height: 84, fill: COLORS.white });
  addMiniNode(slide, ctx, "Model", 204, 536, 110, "#DBEAFE");
  addMiniNode(slide, ctx, "Data", 352, 536, 110, "#CCFBF1");
  addMiniNode(slide, ctx, "Agents", 500, 536, 110, "#E0E7FF");
  addMiniNode(slide, ctx, "Approvals", 648, 536, 120, "#FEF3C7");
  addMiniNode(slide, ctx, "Reports", 808, 536, 110, "#DCFCE7");
  addBody(slide, ctx, "ModelWeave connects these parts into one controlled workflow.", 374, 604, 520, 24, {
    fontSize: 14,
    color: COLORS.muted,
  });

  slide.speakerNotes.setText(`Timing: about 1.5 minutes.

The relevance of the topic comes from the difference between a language model demonstration and a commercial software system.

A chatbot can answer a user prompt, summarize text, or produce recommendations. However, this is not enough for business use. In a company workflow, the system must know who the user is, what documents belong to that user, which data can be used, which actions are only recommendations, and which actions change business objects.

There are also quality and safety problems. A model can produce fluent text, but the system still needs evidence, citations, risk checks, and an audit trail. Without these controls, it is difficult to explain why a decision was made or whether the output is grounded in the available documents.

That is why the thesis focuses on architecture. ModelWeave connects model execution with data, agents, approvals, and reports. In this architecture, the language model is useful because it is placed inside a workflow that controls context, state, and final deliverables.`);
  return slide;
}
