import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import type { generateSpecTask } from "@/trigger/generate-spec";

const bodySchema = z.object({
  roomId: z.string().min(1, "roomId is required"),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(["user", "ai"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .max(200)
    .default([]),
  nodes: z
    .array(
      z
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
        .passthrough(),
    )
    .max(200),
  edges: z
    .array(
      z
        .object({
          id: z.string().min(1),
          source: z.string().min(1),
          target: z.string().min(1),
          data: z
            .object({ label: z.string().optional() })
            .passthrough()
            .optional(),
        })
        .passthrough(),
    )
    .max(400),
});

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown = null;
  try {
    rawBody = await request.json();
  } catch {
    rawBody = null;
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // Project access is derived from the authenticated user + roomId.
  // The roomId is the canonical project id in this codebase — never trust a
  // client-supplied projectId.
  const project = await getProjectIfAccessible(roomId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return NextResponse.json({ runId: handle.id }, { status: 201 });
}
