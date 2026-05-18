import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

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

  const rawPrompt =
    body && typeof body === "object" && "prompt" in body
      ? (body as { prompt?: unknown }).prompt
      : undefined;
  const rawRoomId =
    body && typeof body === "object" && "roomId" in body
      ? (body as { roomId?: unknown }).roomId
      : undefined;
  const rawProjectId =
    body && typeof body === "object" && "projectId" in body
      ? (body as { projectId?: unknown }).projectId
      : undefined;

  const prompt = typeof rawPrompt === "string" ? rawPrompt.trim() : "";
  const roomId = typeof rawRoomId === "string" ? rawRoomId.trim() : "";
  const projectId = typeof rawProjectId === "string" ? rawProjectId.trim() : "";

  if (!prompt || !roomId || !projectId) {
    return NextResponse.json(
      { error: "prompt, roomId, and projectId are required" },
      { status: 400 },
    );
  }

  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt,
    roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId: identity.userId,
    },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [handle.id],
      },
    },
    expirationTime: "1h",
  });

  return NextResponse.json(
    { runId: handle.id, publicToken },
    { status: 201 },
  );
}
