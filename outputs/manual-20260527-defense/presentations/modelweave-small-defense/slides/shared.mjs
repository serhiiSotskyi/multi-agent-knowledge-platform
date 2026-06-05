export const ROOT = process.cwd();

export const COLORS = {
  navy: "#0F172A",
  slate: "#334155",
  muted: "#64748B",
  faint: "#F8FAFC",
  panel: "#F1F5F9",
  border: "#CBD5E1",
  blue: "#2563EB",
  teal: "#0F766E",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  white: "#FFFFFF",
};

export const FONT = {
  title: "Aptos Display",
  body: "Aptos",
  mono: "Aptos Mono",
};

export const PATHS = {
  architecture: `${ROOT}/evidence/figures/architecture.png`,
  rag: `${ROOT}/evidence/figures/rag_pipeline.png`,
  workflow: `${ROOT}/evidence/figures/workflow_graph.png`,
  setup: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/01-setup.png`,
  database: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/02-database.png`,
  agents: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/03-agents.png`,
  workflowUi: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/04-workflows.png`,
  runs: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/05-runs.png`,
  approvals: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/06-approvals.png`,
  tasks: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/07-tasks.png`,
  reports: `${ROOT}/evidence/screenshots/final-ua-thesis-2026-06-05/08-reports.png`,
  qr: `${ROOT}/outputs/manual-20260527-defense/presentations/modelweave-small-defense/assets/demo-qr.png`,
};

export function setBase(slide, ctx, section, number) {
  slide.background.fill = COLORS.white;
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 8, fill: COLORS.navy });
  ctx.addShape(slide, { left: 0, top: 8, width: 1280, height: 4, fill: COLORS.teal });
  ctx.addText(slide, {
    left: 54,
    top: 674,
    width: 780,
    height: 24,
    text: "ModelWeave | Service-oriented architecture for scalable LLM use",
    fontSize: 13,
    color: COLORS.muted,
    typeface: FONT.body,
  });
  ctx.addText(slide, {
    left: 1180,
    top: 674,
    width: 48,
    height: 24,
    text: String(number),
    fontSize: 13,
    color: COLORS.muted,
    typeface: FONT.body,
    align: "right",
  });
  if (section) {
    ctx.addText(slide, {
      left: 960,
      top: 674,
      width: 190,
      height: 24,
      text: section,
      fontSize: 13,
      color: COLORS.muted,
      typeface: FONT.body,
      align: "right",
    });
  }
}

export function addHeader(slide, ctx, kicker, title, subtitle) {
  if (kicker) {
    ctx.addText(slide, {
      left: 64,
      top: 44,
      width: 440,
      height: 24,
      text: kicker.toUpperCase(),
      fontSize: 12,
      color: COLORS.teal,
      bold: true,
      typeface: FONT.body,
    });
  }
  ctx.addText(slide, {
    left: 64,
    top: kicker ? 72 : 56,
    width: 820,
    height: 70,
    text: title,
    fontSize: 34,
    color: COLORS.navy,
    bold: true,
    typeface: FONT.title,
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  });
  if (subtitle) {
    ctx.addText(slide, {
      left: 66,
      top: 126,
      width: 880,
      height: 38,
      text: subtitle,
      fontSize: 17,
      color: COLORS.muted,
      typeface: FONT.body,
    });
  }
}

export function addCard(slide, ctx, { left, top, width, height, fill = COLORS.faint, stroke = COLORS.border }) {
  return ctx.addShape(slide, {
    left,
    top,
    width,
    height,
    geometry: "roundRect",
    fill,
    line: { style: "solid", fill: stroke, width: 1 },
    adjustmentList: [{ name: "adj", formula: "val 8000" }],
  });
}

export function addLabel(slide, ctx, text, left, top, width, color = COLORS.teal) {
  ctx.addText(slide, {
    left,
    top,
    width,
    height: 24,
    text,
    fontSize: 12,
    color,
    bold: true,
    typeface: FONT.body,
  });
}

export function addBody(slide, ctx, text, left, top, width, height, opts = {}) {
  ctx.addText(slide, {
    left,
    top,
    width,
    height,
    text,
    fontSize: opts.fontSize ?? 18,
    color: opts.color ?? COLORS.slate,
    bold: opts.bold ?? false,
    typeface: opts.typeface ?? FONT.body,
    insets: opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

export function addBulletList(slide, ctx, items, left, top, width, gap = 50) {
  items.forEach((item, index) => {
    const y = top + index * gap;
    ctx.addShape(slide, {
      left,
      top: y + 8,
      width: 9,
      height: 9,
      geometry: "ellipse",
      fill: item.color ?? COLORS.teal,
      line: { style: "solid", fill: item.color ?? COLORS.teal, width: 0 },
    });
    ctx.addText(slide, {
      left: left + 22,
      top: y,
      width,
      height: gap,
      text: item.text,
      fontSize: item.fontSize ?? 18,
      color: item.textColor ?? COLORS.slate,
      typeface: FONT.body,
      bold: item.bold ?? false,
      insets: { left: 0, right: 0, top: 0, bottom: 0 },
    });
  });
}

export function addPill(slide, ctx, text, left, top, width, fill = COLORS.panel, color = COLORS.navy) {
  ctx.addShape(slide, {
    left,
    top,
    width,
    height: 34,
    geometry: "roundRect",
    fill,
    line: { style: "solid", fill, width: 0 },
    adjustmentList: [{ name: "adj", formula: "val 50000" }],
  });
  ctx.addText(slide, {
    left: left + 12,
    top: top + 7,
    width: width - 24,
    height: 20,
    text,
    fontSize: 13,
    color,
    bold: true,
    typeface: FONT.body,
    align: "center",
  });
}

export function addMetric(slide, ctx, label, value, left, top, width, color = COLORS.teal) {
  addCard(slide, ctx, { left, top, width, height: 108, fill: COLORS.white });
  ctx.addText(slide, {
    left: left + 18,
    top: top + 18,
    width: width - 36,
    height: 38,
    text: value,
    fontSize: 30,
    color,
    bold: true,
    typeface: FONT.title,
  });
  ctx.addText(slide, {
    left: left + 18,
    top: top + 60,
    width: width - 36,
    height: 36,
    text: label,
    fontSize: 13,
    color: COLORS.muted,
    typeface: FONT.body,
  });
}

export function addImageFrame(slide, ctx, path, left, top, width, height, alt, fit = "contain") {
  addCard(slide, ctx, { left, top, width, height, fill: COLORS.white });
  return ctx.addImage(slide, {
    path,
    left: left + 8,
    top: top + 8,
    width: width - 16,
    height: height - 16,
    fit,
    alt,
  });
}

export function addStep(slide, ctx, number, title, text, left, top, width, accent = COLORS.teal) {
  addCard(slide, ctx, { left, top, width, height: 76, fill: COLORS.white });
  ctx.addShape(slide, {
    left: left + 16,
    top: top + 16,
    width: 34,
    height: 34,
    geometry: "ellipse",
    fill: accent,
    line: { style: "solid", fill: accent, width: 0 },
  });
  ctx.addText(slide, {
    left: left + 16,
    top: top + 22,
    width: 34,
    height: 20,
    text: String(number),
    fontSize: 14,
    color: COLORS.white,
    bold: true,
    align: "center",
    typeface: FONT.body,
  });
  ctx.addText(slide, {
    left: left + 64,
    top: top + 13,
    width: width - 82,
    height: 24,
    text: title,
    fontSize: 16,
    color: COLORS.navy,
    bold: true,
    typeface: FONT.body,
  });
  ctx.addText(slide, {
    left: left + 64,
    top: top + 38,
    width: width - 82,
    height: 28,
    text,
    fontSize: 12,
    color: COLORS.muted,
    typeface: FONT.body,
  });
}

export function addMiniNode(slide, ctx, label, left, top, width = 118, fill = COLORS.white) {
  addCard(slide, ctx, { left, top, width, height: 54, fill });
  ctx.addText(slide, {
    left: left + 8,
    top: top + 12,
    width: width - 16,
    height: 30,
    text: label,
    fontSize: 13,
    color: COLORS.navy,
    bold: true,
    typeface: FONT.body,
    align: "center",
    valign: "middle",
  });
}
