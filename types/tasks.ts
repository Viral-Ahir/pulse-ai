import { z } from "zod";

export const AI_STATUS_FEED_ID = "ai-status-feed";

export const AI_STATUS_PHASES = [
  "starting",
  "processing",
  "complete",
  "error",
] as const;

export type AiStatusPhase = (typeof AI_STATUS_PHASES)[number];

export const aiStatusMessageSchema = z.object({
  phase: z.enum(AI_STATUS_PHASES),
  runId: z.string().min(1),
  text: z.string().optional(),
});

export type AiStatusMessage = z.infer<typeof aiStatusMessageSchema>;

export function isActiveAiStatusPhase(phase: AiStatusPhase): boolean {
  return phase === "starting" || phase === "processing";
}

export const AI_CHAT_FEED_ID = "ai-chat";

export const AI_CHAT_ROLES = ["user", "ai"] as const;
export type AiChatRole = (typeof AI_CHAT_ROLES)[number];

export const AI_CHAT_MESSAGE_MAX_LENGTH = 2000;

export const aiChatSenderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().optional(),
  avatar: z.string().optional(),
});

export const aiChatMessageSchema = z.object({
  sender: aiChatSenderSchema,
  role: z.enum(AI_CHAT_ROLES),
  content: z.string().min(1).max(AI_CHAT_MESSAGE_MAX_LENGTH),
  timestamp: z.number().int().positive(),
});

export type AiChatSender = z.infer<typeof aiChatSenderSchema>;
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;
