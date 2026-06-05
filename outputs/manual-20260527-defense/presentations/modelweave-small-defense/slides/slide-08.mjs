import { COLORS, PATHS, addBody, addCard, addHeader, addImageFrame, addMetric, setBase } from "./shared.mjs";

export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Results", 8);
  addHeader(slide, ctx, "Results", "The thesis result is a deployed, tested full-stack prototype");

  addMetric(slide, ctx, "synthetic documents seeded", "16", 64, 158, 156, COLORS.teal);
  addMetric(slide, ctx, "citations in clean agent run", "8", 238, 158, 156, COLORS.blue);
  addMetric(slide, ctx, "recorded run events in QA", "21+", 412, 158, 156, COLORS.teal);
  addMetric(slide, ctx, "approval records created", "3+", 586, 158, 156, COLORS.amber);
  addMetric(slide, ctx, "raw Markdown markers in DOCX", "0", 760, 158, 180, COLORS.green);
  addMetric(slide, ctx, "run evaluation score", "1.0", 958, 158, 180, COLORS.green);

  await addImageFrame(slide, ctx, PATHS.runs, 64, 304, 516, 292, "Runs screen screenshot", "cover");
  await addImageFrame(slide, ctx, PATHS.reports, 620, 304, 516, 292, "Reports screen screenshot", "cover");

  addCard(slide, ctx, { left: 64, top: 610, width: 1072, height: 42, fill: COLORS.navy, stroke: COLORS.navy });
  addBody(slide, ctx, "Production frontend: https://modelweave-two.vercel.app", 86, 620, 430, 24, { fontSize: 13, color: COLORS.white, bold: true });
  addBody(slide, ctx, "Backend: https://api-production-e70a9.up.railway.app", 536, 620, 330, 24, { fontSize: 13, color: "#DCE7F3" });
  addBody(slide, ctx, "Repository: GitHub public", 902, 620, 190, 24, { fontSize: 13, color: "#DCE7F3", bold: true });

  slide.speakerNotes.setText(`Timing: about 2 minutes.

The result of the work is a deployed and tested full-stack prototype.

The production frontend is available at modelweave-two.vercel.app. The backend health endpoint is deployed on Railway, and the repository is public on GitHub. This means the result is not only a local prototype. It can be opened as a web application.

The validation used synthetic data only. The test corpus includes sixteen fictional academic documents. In the clean agent run, the system produced eight citations, which confirms that the generated output was connected to retrieved evidence.

The UX polish smoke test recorded forty-six run events. This is important because the workflow is traceable: we can see which nodes and agents were executed. The same test created four approval records, which shows that proposed actions are routed through the human approval queue.

The DOCX export was also checked. The generated report contained no raw Markdown markers, so the output is suitable as a client-facing document rather than just raw model text.

The screenshots on this slide show two important parts of the interface: the Runs screen and the Reports screen. Together, they demonstrate that the system can run workflows, inspect results, and export deliverables.`);
  return slide;
}
