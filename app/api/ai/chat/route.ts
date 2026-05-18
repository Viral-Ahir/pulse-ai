import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCursorColorForUser, getLiveblocks } from "@/lib/liveblocks";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import {
  AI_CHAT_FEED_ID,
  AI_CHAT_MESSAGE_MAX_LENGTH,
  aiChatMessageSchema,
  type AiChatMessage,
} from "@/types/tasks";

async function ensureChatFeed(roomId: string): Promise<void> {
  const liveblocks = getLiveblocks();
  try {
    await liveblocks.createFeed({ roomId, feedId: AI_CHAT_FEED_ID });
  } catch {
    // Feed already exists — safe to ignore.
  }
}

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const rawContent =
    body && typeof body === "object" && "content" in body
      ? (body as { content?: unknown }).content
      : undefined;
  const rawRoomId =
    body && typeof body === "object" && "roomId" in body
      ? (body as { roomId?: unknown }).roomId
      : undefined;
  const rawProjectId =
    body && typeof body === "object" && "projectId" in body
      ? (body as { projectId?: unknown }).projectId
      : undefined;

  const content = typeof rawContent === "string" ? rawContent.trim() : "";
  const roomId = typeof rawRoomId === "string" ? rawRoomId.trim() : "";
  const projectId = typeof rawProjectId === "string" ? rawProjectId.trim() : "";

  if (!content || !roomId || !projectId) {
    return NextResponse.json(
      { error: "content, roomId, and projectId are required" },
      { status: 400 },
    );
  }

  if (content.length > AI_CHAT_MESSAGE_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Message must be ${AI_CHAT_MESSAGE_MAX_LENGTH} characters or fewer`,
      },
      { status: 400 },
    );
  }

  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await currentUser();
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const name =
    fullName.length > 0
      ? fullName
      : (identity.email ?? user?.username ?? "Anonymous");

  const message: AiChatMessage = {
    sender: {
      id: identity.userId,
      name,
      color: getCursorColorForUser(identity.userId),
      avatar: user?.imageUrl ?? undefined,
    },
    role: "user",
    content,
    timestamp: Date.now(),
  };

  const parsed = aiChatMessageSchema.safeParse(message);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message payload" },
      { status: 400 },
    );
  }

  await ensureChatFeed(roomId);

  const liveblocks = getLiveblocks();
  await liveblocks.createFeedMessage({
    roomId,
    feedId: AI_CHAT_FEED_ID,
    data: parsed.data,
  });

  return NextResponse.json({ message: parsed.data }, { status: 201 });
}
