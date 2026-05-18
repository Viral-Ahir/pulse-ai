import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import {
  AbortTaskRunError,
  logger,
  metadata,
  schemaTask,
} from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { z } from "zod";

import {
  AI_USER_AVATAR,
  AI_USER_COLOR,
  AI_USER_ID,
  AI_USER_NAME,
  buildSystemPrompt,
  designSchema,
  nodeCenter,
  sanitizeDesign,
  type DesignedEdge,
  type DesignedNode,
} from "@/lib/design-agent-shared";
import {
  NODE_SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";
import {
  AI_CHAT_FEED_ID,
  AI_CHAT_MESSAGE_MAX_LENGTH,
  AI_STATUS_FEED_ID,
  aiChatMessageSchema,
  type AiChatMessage,
  type AiStatusMessage,
  type AiStatusPhase,
} from "@/types/tasks";

const PRESENCE_TTL_SECONDS = 600;

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    "",
});

const aiInfo = {
  name: AI_USER_NAME,
  avatar: AI_USER_AVATAR,
  color: AI_USER_COLOR,
  isAi: true,
};

function getLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }
  return new Liveblocks({ secret });
}

async function ensureStatusFeed(
  liveblocks: Liveblocks,
  roomId: string,
): Promise<void> {
  try {
    await liveblocks.createFeed({ roomId, feedId: AI_STATUS_FEED_ID });
  } catch (error) {
    logger.debug("design-agent: createFeed skipped (likely already exists)", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function ensureChatFeed(
  liveblocks: Liveblocks,
  roomId: string,
): Promise<void> {
  try {
    await liveblocks.createFeed({ roomId, feedId: AI_CHAT_FEED_ID });
  } catch (error) {
    logger.debug(
      "design-agent: chat createFeed skipped (likely already exists)",
      { error: error instanceof Error ? error.message : String(error) },
    );
  }
}

async function postAiChatMessage(
  liveblocks: Liveblocks,
  roomId: string,
  content: string,
): Promise<void> {
  const trimmed = content.trim().slice(0, AI_CHAT_MESSAGE_MAX_LENGTH);
  if (!trimmed) return;

  const message: AiChatMessage = {
    sender: {
      id: AI_USER_ID,
      name: AI_USER_NAME,
      color: AI_USER_COLOR,
      avatar: AI_USER_AVATAR || undefined,
    },
    role: "ai",
    content: trimmed,
    timestamp: Date.now(),
  };

  const parsed = aiChatMessageSchema.safeParse(message);
  if (!parsed.success) {
    logger.warn("design-agent: skipped AI chat post (schema invalid)", {
      issues: parsed.error.issues,
    });
    return;
  }

  await ensureChatFeed(liveblocks, roomId);

  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_CHAT_FEED_ID,
      data: parsed.data,
    });
  } catch (error) {
    logger.warn("design-agent: failed to post AI chat message", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function announce(
  liveblocks: Liveblocks,
  roomId: string,
  runId: string,
  phase: AiStatusPhase,
  message: string,
): Promise<void> {
  metadata.append("messages", { phase, message, at: Date.now() });
  metadata.set("phase", phase);
  try {
    await liveblocks.broadcastEvent(roomId, {
      type: "ai-status",
      runId,
      phase,
      message,
    });
  } catch (error) {
    logger.warn("design-agent: failed to broadcast status", {
      phase,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const feedData: AiStatusMessage = { phase, runId, text: message };
  try {
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: feedData,
    });
  } catch (error) {
    logger.warn("design-agent: failed to write status feed message", {
      phase,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function updatePresence(
  liveblocks: Liveblocks,
  roomId: string,
  thinking: boolean,
  cursor: { x: number; y: number } | null,
): Promise<void> {
  try {
    await liveblocks.setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor, thinking },
      userInfo: aiInfo,
      ttl: PRESENCE_TTL_SECONDS,
    });
  } catch (error) {
    logger.warn("design-agent: failed to update presence", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function clearPresence(
  liveblocks: Liveblocks,
  roomId: string,
): Promise<void> {
  try {
    await liveblocks.setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor: null, thinking: false },
      userInfo: aiInfo,
      ttl: 2,
    });
  } catch (error) {
    logger.warn("design-agent: failed to clear presence", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function toCanvasNode(node: DesignedNode): CanvasNode {
  const size = NODE_SHAPE_DEFAULT_SIZES[node.shape];
  return {
    id: node.id,
    type: "canvasNode",
    position: { x: node.position.x, y: node.position.y },
    width: size.width,
    height: size.height,
    data: {
      label: node.label,
      color: node.color,
      shape: node.shape,
    },
  };
}

function toCanvasEdge(edge: DesignedEdge): CanvasEdge {
  return {
    id: edge.id,
    type: "canvasEdge",
    source: edge.source,
    target: edge.target,
    data: edge.label ? { label: edge.label } : {},
  };
}

export const designAgentTask = schemaTask({
  id: "design-agent",
  maxDuration: 600,
  retry: { maxAttempts: 1 },
  schema: z.object({
    prompt: z.string().min(1),
    roomId: z.string().min(1),
  }),
  run: async (payload, { ctx }) => {
    const { prompt, roomId } = payload;
    const runId = ctx.run.id;
    const liveblocks = getLiveblocksClient();

    logger.log("design-agent starting", { prompt, roomId, runId });

    await ensureStatusFeed(liveblocks, roomId);
    await updatePresence(liveblocks, roomId, true, { x: 0, y: 0 });
    await announce(
      liveblocks,
      roomId,
      runId,
      "starting",
      "Pulse AI is reading your prompt…",
    );

    try {
      await announce(
        liveblocks,
        roomId,
        runId,
        "processing",
        "Generating the architecture…",
      );

      const generation = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: designSchema,
        system: buildSystemPrompt(),
        prompt: `Design the following system. Reply with structured JSON only.\n\nUser prompt:\n${prompt}`,
      });

      const design = sanitizeDesign(generation.object, `ai-${runId}`);

      if (design.nodes.length === 0) {
        throw new AbortTaskRunError(
          "The design agent could not produce any valid nodes for this prompt.",
        );
      }

      await announce(
        liveblocks,
        roomId,
        runId,
        "processing",
        `Drawing ${design.nodes.length} node${design.nodes.length === 1 ? "" : "s"} on the canvas…`,
      );

      const canvasNodes = design.nodes.map(toCanvasNode);
      const canvasEdges = design.edges.map(toCanvasEdge);

      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: liveblocks, roomId },
        (flow) => {
          flow.addNodes(canvasNodes);
          if (canvasEdges.length > 0) {
            flow.addEdges(canvasEdges);
          }
        },
      );

      for (const node of design.nodes) {
        await updatePresence(liveblocks, roomId, true, nodeCenter(node));
      }

      await announce(liveblocks, roomId, runId, "complete", design.summary);
      await postAiChatMessage(liveblocks, roomId, design.summary);

      logger.log("design-agent finished", {
        runId,
        nodeCount: design.nodes.length,
        edgeCount: design.edges.length,
      });

      return {
        runId,
        summary: design.summary,
        nodes: canvasNodes,
        edges: canvasEdges,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the design.";
      logger.error("design-agent failed", { error: message });
      await announce(
        liveblocks,
        roomId,
        runId,
        "error",
        `Design generation failed: ${message}`,
      );
      await postAiChatMessage(
        liveblocks,
        roomId,
        `I couldn't generate that design — ${message}`,
      );
      throw error;
    } finally {
      await clearPresence(liveblocks, roomId);
    }
  },
});
