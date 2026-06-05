import { COLORS, FONT, PATHS, addBody, addCard, addImageFrame, addPill, setBase } from "./shared.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Topic", 1);

  addBody(slide, ctx, "BACHELOR'S QUALIFICATION WORK", 64, 46, 420, 24, {
    fontSize: 12,
    color: COLORS.teal,
    bold: true,
  });
  addBody(slide, ctx, "Creating a Service-Oriented Architecture for", 64, 80, 760, 38, {
    fontSize: 32,
    color: COLORS.navy,
    bold: true,
    typeface: FONT.title,
  });
  addBody(slide, ctx, "Scalable Use of Language Models", 64, 122, 720, 38, {
    fontSize: 32,
    color: COLORS.navy,
    bold: true,
    typeface: FONT.title,
  });
  addBody(slide, ctx, "in Commercial Solutions", 64, 164, 620, 38, {
    fontSize: 32,
    color: COLORS.navy,
    bold: true,
    typeface: FONT.title,
  });
  addBody(slide, ctx, "ModelWeave: deployed document-grounded agent platform\nwith database, workflows, approvals, tasks, and DOCX reports", 66, 208, 600, 46, {
    fontSize: 16,
    color: COLORS.muted,
  });

  addCard(slide, ctx, { left: 64, top: 266, width: 520, height: 186, fill: COLORS.faint });
  addBody(slide, ctx, "Student", 92, 292, 120, 24, { fontSize: 13, color: COLORS.teal, bold: true });
  addBody(slide, ctx, "Serhii Sotskyi, group AB221", 92, 318, 410, 30, { fontSize: 19, color: COLORS.navy, bold: true });
  addBody(slide, ctx, "Supervisor", 92, 364, 120, 24, { fontSize: 13, color: COLORS.teal, bold: true });
  addBody(slide, ctx, "Vira Oleksandrivna Hrishyna", 92, 390, 410, 30, { fontSize: 19, color: COLORS.navy, bold: true });
  addBody(slide, ctx, "National University \"Odesa Polytechnic\" | Odesa, 2026", 92, 426, 420, 22, { fontSize: 13, color: COLORS.muted });

  await addImageFrame(slide, ctx, PATHS.setup, 650, 222, 500, 274, "ModelWeave setup dashboard screenshot", "cover");
  addPill(slide, ctx, "Real deployed web app", 650, 520, 170, COLORS.panel, COLORS.navy);
  addPill(slide, ctx, "Synthetic data only", 836, 520, 160, COLORS.panel, COLORS.navy);
  addPill(slide, ctx, "DOCX outputs", 1012, 520, 138, COLORS.panel, COLORS.navy);

  ctx.addShape(slide, { left: 64, top: 560, width: 1086, height: 1, fill: COLORS.border });
  addBody(slide, ctx, "Defense duration target: under 15 minutes", 64, 580, 480, 24, { fontSize: 15, color: COLORS.muted });
  addBody(slide, ctx, "Production demo is linked at the end", 820, 580, 330, 24, { fontSize: 15, color: COLORS.muted });

  slide.speakerNotes.setText(`Timing: about 1 minute.

Good afternoon. My name is Serhii Sotskyi, group AB221. The topic of my bachelor's qualification work is "Creating a Service-Oriented Architecture for Scalable Use of Language Models in Commercial Solutions."

In this work I do not study language models only as isolated chatbots. I study how they can be included in a real software architecture that has users, documents, data storage, agent workflows, approval gates, audit events, and final business deliverables.

The practical result of the work is called ModelWeave. It is a deployed full-stack web application that demonstrates document-grounded agents, a searchable database, editable workflows, approval gates, durable tasks, and DOCX reports. The system uses only synthetic academic data, so it is not connected to any real company information. At the end of the presentation I will show the production link and the demo path.`);
  return slide;
}
