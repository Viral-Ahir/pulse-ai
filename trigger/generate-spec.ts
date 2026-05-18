import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  AbortTaskRunError,
  logger,
  metadata,
  schemaTask,
} from "@trigger.dev/sdk";
import { generateText } from "ai";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { uploadSpec } from "@/lib/spec-blob";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    "",
});

const chatRoleSchema = z.enum(["user", "ai"]);

const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().min(1).max(8000),
});

const specNodeSchema = z
  .object({
    id: z.string().min(1),
    data: z
      .object({
        label: z.string().optional(),
        color: z.string().optional(),
        shape: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const specEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    data: z
      .object({
        label: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const generateSpecSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).max(200).default([]),
  nodes: z.array(specNodeSchema).max(200),
  edges: z.array(specEdgeSchema).max(400),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecSchema>;

type Phase = "starting" | "processing" | "complete" | "error";

function announce(phase: Phase, message: string): void {
  metadata.set("phase", phase);
  metadata.append("messages", { phase, message, at: Date.now() });
}

function buildSystemPrompt(): string {
  const shapeList = NODE_SHAPES.map((shape) => `"${shape}"`).join(", ");
  const colorList = NODE_COLORS.map((c) => `"${c.id}"`).join(", ");

  return `You are Pulse AI, a senior software architect. You write clear, well-structured Markdown technical specifications for system architectures drawn on a collaborative canvas.

Inputs you will receive:
- A canvas graph: nodes (with id, label, shape, color) and edges (with source, target, optional label). Shapes are one of ${shapeList}; colors are one of ${colorList}.
- Chat history between the user and Pulse AI describing intent, constraints, and decisions.

Your job:
- Produce a Markdown technical spec that turns the canvas + chat into an actionable document.
- Reference components by their canvas label, not their id.
- Infer responsibilities, data flow, and interactions from edges and edge labels.
- When the chat history provides context (goals, constraints, non-functional requirements), incorporate it.
- If the canvas is empty, write a short note explaining that no system was provided.

Output rules:
- Plain GitHub-flavored Markdown. No code fences around the whole document.
- Start with a single H1 (\`# Title\`).
- Use the following top-level sections in this order when they apply:
  1. \`## Overview\` — one short paragraph summarizing the system.
  2. \`## Components\` — bulleted list, one bullet per node (\`- **Label** — responsibility\`).
  3. \`## Data Flow\` — describe the request/data flow between components, referencing edges.
  4. \`## Interfaces & Contracts\` — APIs, events, or schemas implied by the diagram.
  5. \`## Non-Functional Requirements\` — performance, scaling, security, observability (only what is implied by the diagram or chat).
  6. \`## Open Questions\` — concrete questions worth resolving before implementation.
- Keep prose tight. Prefer short bullets over long paragraphs.
- Do not invent components, edges, or chat content. Stick to what is provided.
- Do not include preamble like "Sure, here is..." — output the Markdown spec directly.`;
}

interface SpecNodeInput {
  id: string;
  data?: {
    label?: string;
    color?: string;
    shape?: string;
  };
}

interface SpecEdgeInput {
  id: string;
  source: string;
  target: string;
  data?: { label?: string };
}

function describeGraph(
  nodes: SpecNodeInput[],
  edges: SpecEdgeInput[],
): string {
  if (nodes.length === 0) {
    return "Canvas is empty. No nodes or edges have been drawn.";
  }

  const nodeLines = nodes.map((node) => {
    const label = node.data?.label?.trim() || "(no label)";
    const shape = node.data?.shape ?? "rectangle";
    const color = node.data?.color ?? "neutral";
    return `- id=${node.id} | label="${label}" | shape=${shape} | color=${color}`;
  });

  const idToLabel = new Map<string, string>();
  for (const node of nodes) {
    idToLabel.set(node.id, node.data?.label?.trim() || node.id);
  }

  const edgeLines = edges.length
    ? edges.map((edge) => {
        const sourceLabel = idToLabel.get(edge.source) ?? edge.source;
        const targetLabel = idToLabel.get(edge.target) ?? edge.target;
        const edgeLabel = edge.data?.label?.trim();
        const labelPart = edgeLabel ? ` [${edgeLabel}]` : "";
        return `- ${sourceLabel} → ${targetLabel}${labelPart}`;
      })
    : ["(no edges)"];

  return [
    "Nodes:",
    ...nodeLines,
    "",
    "Edges:",
    ...edgeLines,
  ].join("\n");
}

function formatChatHistory(
  history: { role: "user" | "ai"; content: string }[],
): string {
  if (history.length === 0) return "(no prior chat)";
  return history
    .map((entry) => {
      const speaker = entry.role === "user" ? "User" : "Pulse AI";
      return `${speaker}: ${entry.content.trim()}`;
    })
    .join("\n\n");
}

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  maxDuration: 600,
  retry: { maxAttempts: 1 },
  schema: generateSpecSchema,
  run: async (payload, { ctx }) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;
    const runId = ctx.run.id;

    logger.log("generate-spec starting", {
      runId,
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    metadata.set("projectId", projectId);
    metadata.set("roomId", roomId);
    announce("starting", "Pulse AI is reading your canvas and chat…");

    try {
      announce("processing", "Drafting the technical spec…");

      const graphSection = describeGraph(nodes, edges);
      const chatSection = formatChatHistory(chatHistory);

      const prompt = `Generate a Markdown technical spec for the system described below.

Canvas:
${graphSection}

Chat history:
${chatSection}`;

      const generation = await generateText({
        model: google("gemini-2.5-flash"),
        system: buildSystemPrompt(),
        prompt,
      });

      const spec = generation.text.trim();
      if (!spec) {
        throw new AbortTaskRunError(
          "The spec agent returned an empty document for this canvas.",
        );
      }

      announce("processing", "Saving the spec…");

      const specId = crypto.randomUUID();
      const filePath = await uploadSpec(projectId, specId, spec);
      const record = await prisma.projectSpec.create({
        data: { id: specId, projectId, filePath },
        select: { id: true },
      });

      metadata.set("specId", record.id);
      metadata.set("specLength", spec.length);
      announce("complete", "Spec generated.");

      logger.log("generate-spec finished", {
        runId,
        specId: record.id,
        specLength: spec.length,
      });

      return { runId, specId: record.id, spec };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the spec.";
      logger.error("generate-spec failed", { error: message });
      announce("error", `Spec generation failed: ${message}`);
      throw error;
    }
  },
});
