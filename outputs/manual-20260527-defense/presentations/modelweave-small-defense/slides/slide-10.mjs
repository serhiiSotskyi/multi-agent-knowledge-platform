import { COLORS, FONT, PATHS, addBody, addCard, addHeader, addImageFrame, addStep, setBase } from "./shared.mjs";

export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Demo", 10);
  addHeader(slide, ctx, "Demo link", "Open the deployed ModelWeave prototype and run a document-agent workflow");

  addCard(slide, ctx, { left: 74, top: 164, width: 350, height: 390, fill: COLORS.white });
  await addImageFrame(slide, ctx, PATHS.qr, 116, 198, 266, 266, "QR code for ModelWeave production frontend", "contain");
  addBody(slide, ctx, "https://modelweave-two.vercel.app", 88, 490, 320, 28, {
    fontSize: 16,
    color: COLORS.blue,
    bold: true,
    typeface: FONT.body,
  });

  addCard(slide, ctx, { left: 474, top: 164, width: 690, height: 390, fill: COLORS.faint });
  addBody(slide, ctx, "Demo path", 512, 194, 200, 30, { fontSize: 22, color: COLORS.navy, bold: true });
  const steps = [
    ["Sign in", "Register or confirm the user session through Supabase Auth."],
    ["Add model key", "Save the user's own Anthropic API key for agent execution."],
    ["Load corpus", "Seed the synthetic academic document set."],
    ["Run workflow", "Run the default Document Operations Review workflow."],
    ["Review output", "Inspect timeline, citations, approvals, tasks, evaluation, and DOCX report."],
  ];
  steps.forEach(([title, text], index) => addStep(slide, ctx, index + 1, title, text, 512, 238 + index * 58, 604, index % 2 ? COLORS.blue : COLORS.teal));

  addCard(slide, ctx, { left: 74, top: 586, width: 1090, height: 52, fill: COLORS.navy, stroke: COLORS.navy });
  addBody(slide, ctx, "Backend: https://api-production-e70a9.up.railway.app", 104, 602, 430, 22, { fontSize: 14, color: "#DCE7F3" });
  addBody(slide, ctx, "Repository: https://github.com/serhiiSotskyi/multi-agent-knowledge-platform", 560, 602, 560, 22, {
    fontSize: 14,
    color: "#DCE7F3",
  });

  slide.speakerNotes.setText(`Timing: about 1 minute.

This is the demo link for the deployed prototype. The current production frontend is modelweave-two.vercel.app. The QR code opens the same address.

The recommended demo path is short. First, sign in or register. Second, add the user's Anthropic API key, because the system uses a bring-your-own-key model. Third, load the synthetic academic corpus. Fourth, run the default Document Operations Review workflow. Fifth, review the output: the execution timeline, citations, approval queue, created tasks, evaluation score, and DOCX report.

If there is enough time and internet access, I can open the application and show this workflow directly. If not, the link and QR code provide a safe way to access the demo after the presentation.

This completes the presentation. Thank you for your attention.`);
  return slide;
}
