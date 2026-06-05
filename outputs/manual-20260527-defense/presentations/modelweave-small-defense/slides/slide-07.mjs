import { COLORS, PATHS, addBody, addCard, addHeader, addImageFrame, addMiniNode, setBase } from "./shared.mjs";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  setBase(slide, ctx, "Algorithm scheme", 7);
  addHeader(slide, ctx, "Structural scheme of the software algorithm", "Documents become retrievable context; agents turn context into approval-gated tasks and reports");

  await addImageFrame(slide, ctx, PATHS.architecture, 54, 158, 610, 338, "ModelWeave service-oriented architecture diagram", "contain");
  await addImageFrame(slide, ctx, PATHS.workflowUi, 704, 158, 500, 224, "ModelWeave workflow builder screenshot", "contain");
  await addImageFrame(slide, ctx, PATHS.rag, 704, 406, 500, 150, "RAG pipeline diagram", "contain");

  addCard(slide, ctx, { left: 64, top: 560, width: 1100, height: 78, fill: COLORS.faint });
  const labels = ["Auth", "Documents", "Chunks", "Vectors", "Retrieve", "Agents", "Approve", "DOCX"];
  labels.forEach((label, index) => {
    const x = 92 + index * 134;
    addMiniNode(slide, ctx, label, x, 574, index === 7 ? 104 : 104, index % 2 ? "#DBEAFE" : "#CCFBF1");
    if (index < labels.length - 1) {
      ctx.addShape(slide, { left: x + 108, top: 598, width: 25, height: 4, fill: COLORS.border });
    }
  });
  addBody(slide, ctx, "Main execution path", 92, 640, 180, 20, { fontSize: 12, color: COLORS.muted });

  slide.speakerNotes.setText(`Timing: about 2.1 minutes.

This slide shows the structural scheme of the software algorithm.

The process begins with authentication. A user registers or signs in through Supabase Auth. After that, the user can add their own Anthropic API key. This is the bring-your-own-key approach, so each user controls their own model access.

Next, the user uploads documents or loads the synthetic corpus. The backend parses PDF, TXT, Markdown, and DOCX, then splits documents into chunks.

Each chunk is converted into an embedding vector. Vectors are stored in Qdrant, while users, documents, agents, workflows, runs, tasks, approvals, and events are stored in Supabase Postgres.

When the user starts a workflow, the system embeds the query and retrieves the top-k most similar chunks. These chunks become grounding context for the agents.

The workflow itself is a graph of typed nodes: retrieve, agent, create task, approval, evaluate, and export DOCX.

The safety rule is that agents can draft recommendations, but persistent changes go through approval. Rejected actions remain in the audit trail without changing final state.

At the end, the system evaluates the run and exports a DOCX report. This shows a complete workflow from documents to actions and deliverables.`);
  return slide;
}
