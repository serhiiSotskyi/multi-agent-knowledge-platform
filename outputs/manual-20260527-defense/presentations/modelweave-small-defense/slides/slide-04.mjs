import { COLORS, addBody, addCard, addHeader, addPill, setBase } from "./shared.mjs";

function cell(slide, ctx, text, left, top, width, height, opts = {}) {
  ctx.addShape(slide, {
    left,
    top,
    width,
    height,
    fill: opts.fill ?? COLORS.white,
    line: { style: "solid", fill: opts.border ?? COLORS.border, width: 1 },
  });
  ctx.addText(slide, {
    left: left + 10,
    top: top + 9,
    width: width - 20,
    height: height - 14,
    text,
    fontSize: opts.fontSize ?? 13,
    color: opts.color ?? COLORS.slate,
    bold: opts.bold ?? false,
    typeface: opts.typeface ?? "Aptos",
    valign: "middle",
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Methods", 4);
  addHeader(slide, ctx, "Methods and comparison", "The prototype combines retrieval, agent workflows, and governance controls");

  const methods = ["SOA", "RAG", "Embeddings", "Vector search", "Multi-agent graph", "Approval gates", "BYOK"];
  methods.forEach((item, index) => addPill(slide, ctx, item, 64 + index * 158, 158, 138, index % 2 ? "#DBEAFE" : "#CCFBF1", COLORS.navy));

  addCard(slide, ctx, { left: 64, top: 220, width: 1094, height: 338, fill: COLORS.white });
  const x = [86, 316, 548, 780, 1012];
  const w = [230, 232, 232, 232, 124];
  const y0 = 250;
  const rh = 55;
  ["Approach", "Workflow control", "Grounding", "Mutation safety", "Fit for thesis"].forEach((h, i) => {
    cell(slide, ctx, h, x[i], y0, w[i], 46, { fill: COLORS.navy, color: COLORS.white, bold: true, fontSize: 12 });
  });
  const rows = [
    ["Generic chatbot", "Conversation only", "Weak or implicit", "None", "Low"],
    ["Simple RAG report tool", "Report generation", "Document citations", "Limited", "Medium"],
    ["Generic agent builder", "Flexible automation", "Depends on setup", "Often optional", "Medium"],
    ["ModelWeave", "Typed document workflow", "RAG citations", "Mandatory approvals", "High"],
  ];
  rows.forEach((row, r) => {
    row.forEach((value, c) => {
      cell(slide, ctx, value, x[c], y0 + 46 + r * rh, w[c], rh, {
        fill: r === 3 ? "#ECFDF5" : COLORS.white,
        border: r === 3 ? "#5EEAD4" : COLORS.border,
        color: c === 0 || r === 3 ? COLORS.navy : COLORS.slate,
        bold: c === 0 || r === 3,
        fontSize: c === 4 ? 16 : 13,
      });
    });
  });

  addBody(slide, ctx, "Key idea: language model calls become controlled services inside a workflow, not isolated answers.", 104, 590, 940, 26, {
    fontSize: 18,
    color: COLORS.navy,
    bold: true,
  });

  slide.speakerNotes.setText(`Timing: about 1.7 minutes.

Several methods were used together in the work.

The first method is service-oriented architecture. The application is separated into frontend, backend API, authentication, relational database, vector database, model provider, and deployment infrastructure.

The second method is retrieval-augmented generation. Documents are parsed into chunks, converted into embeddings, stored for semantic search, and retrieved as evidence for agents.

The third method is a multi-agent workflow graph. Instead of one general assistant, configurable agents take narrower roles such as document reviewer, task planner, QA agent, and report writer.

The fourth method is approval-gated automation. Agents can propose actions, but persistent changes require human approval.

Compared with a generic chatbot, ModelWeave has stronger workflow control. Compared with a simple RAG report tool, it can create proposed tasks and approvals, not only reports. Compared with a generic agent builder, it is grounded in a clear service-oriented architecture with database, workflow, run history, approval, and document export services. This is why it fits the thesis topic better.`);
  return slide;
}
