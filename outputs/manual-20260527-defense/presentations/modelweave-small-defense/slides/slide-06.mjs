import { COLORS, addBody, addCard, addHeader, addMiniNode, setBase } from "./shared.mjs";

function metricFormula(slide, ctx, label, formula, left, top, width, fill) {
  addCard(slide, ctx, { left, top, width, height: 86, fill, stroke: fill });
  addBody(slide, ctx, label, left + 18, top + 14, width - 36, 20, { fontSize: 12, color: COLORS.teal, bold: true });
  addBody(slide, ctx, formula, left + 18, top + 40, width - 36, 28, { fontSize: 16, color: COLORS.navy, bold: true, typeface: "Aptos Mono" });
}

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Math: workflow", 6);
  addHeader(slide, ctx, "Mathematical model II", "Agent workflows are typed graphs with state, approvals, cost, and quality scores");

  addCard(slide, ctx, { left: 64, top: 156, width: 1088, height: 122, fill: COLORS.faint });
  addBody(slide, ctx, "Workflow graph", 92, 178, 180, 24, { fontSize: 15, color: COLORS.teal, bold: true });
  addBody(slide, ctx, "G = (V, E, τ, σ)", 282, 176, 250, 28, { fontSize: 22, color: COLORS.navy, bold: true, typeface: "Aptos Mono" });
  addBody(slide, ctx, "τ(v) ∈ {retrieve, agent, create_task, approval, evaluate, export_docx}", 282, 212, 720, 24, {
    fontSize: 15,
    color: COLORS.slate,
    typeface: "Aptos Mono",
  });
  addBody(slide, ctx, "σt(v) ∈ {waiting, running, completed, approval_required, failed}", 282, 240, 680, 22, {
    fontSize: 15,
    color: COLORS.slate,
    typeface: "Aptos Mono",
  });

  const nodes = [
    ["Retrieve", "#DBEAFE"],
    ["Agent", "#CCFBF1"],
    ["Create task", "#E0E7FF"],
    ["Approval", "#FEF3C7"],
    ["Evaluate", "#DCFCE7"],
    ["DOCX", "#FCE7F3"],
  ];
  nodes.forEach(([label, fill], index) => {
    const x = 92 + index * 176;
    addMiniNode(slide, ctx, label, x, 318, 126, fill);
    if (index < nodes.length - 1) ctx.addShape(slide, { left: x + 132, top: 342, width: 34, height: 4, fill: COLORS.border });
  });

  metricFormula(slide, ctx, "Approval constraint", "mutate(x) ⇒ approval(x)=approved", 64, 420, 342, "#FFF7ED");
  metricFormula(slide, ctx, "Quality score", "S=(wcC+waA+wrR+wmM)/(wc+wa+wr+wm)", 448, 420, 342, "#ECFDF5");
  metricFormula(slide, ctx, "Token cost", "Cost=Σj(pinTin,j+poutTout,j)", 832, 420, 320, "#EFF6FF");

  addCard(slide, ctx, { left: 64, top: 540, width: 1088, height: 86, fill: COLORS.navy, stroke: COLORS.navy });
  addBody(slide, ctx, "Applied-math value", 92, 560, 210, 24, { fontSize: 15, color: "#99F6E4", bold: true });
  addBody(
    slide,
    ctx,
    "The formulas connect product behavior to measurable parameters: corpus size |C|, vector dimension d, retrieval depth k, agent count |Vagent|, pending approvals, latency, and run quality.",
    300,
    558,
    780,
    42,
    { fontSize: 16, color: COLORS.white, bold: true }
  );

  slide.speakerNotes.setText(`Timing: about 1.2 minutes.

The second mathematical part describes workflow execution.

A workflow is represented as a typed directed graph G. V is the set of nodes, E is the set of edges, tau gives the type of each node, and sigma gives the execution state of each node over time.

The node types in the MVP are retrieve, agent, create task, approval, evaluate, and export DOCX. Node state can be waiting, running, completed, approval required, or failed. This is what the UI visualizes in the live run screen.

The approval formula says that a persistent mutation is allowed only when there is an approved human decision.

The quality formula combines citation coverage, actionability, risk control, and completeness into one normalized score.

The cost formula estimates model cost from input and output tokens. It explains why agent count, retrieval depth, and context length matter.

Together, these formulas connect the software architecture to measurable variables: corpus size, embedding dimension, retrieval depth, number of agents, approval load, latency, and quality score.`);
  return slide;
}
