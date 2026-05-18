import { NextResponse } from "next/server";

import {
  fetchCanvasSnapshot,
  uploadCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvas-blob";
import { prisma } from "@/lib/prisma";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("nodes" in body) ||
    !("edges" in body) ||
    !Array.isArray((body as { nodes: unknown }).nodes) ||
    !Array.isArray((body as { edges: unknown }).edges)
  ) {
    return NextResponse.json(
      { error: "Body must include nodes and edges arrays" },
      { status: 400 },
    );
  }

  const snapshot = body as CanvasSnapshot;
  const blobUrl = await uploadCanvasSnapshot(project.id, snapshot);

  await prisma.project.update({
    where: { id: project.id },
    data: { canvasJsonPath: blobUrl },
  });

  return NextResponse.json({ blobUrl });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await prisma.project.findUnique({
    where: { id: project.id },
    select: { canvasJsonPath: true },
  });

  if (!record?.canvasJsonPath) {
    return NextResponse.json({ snapshot: null });
  }

  const snapshot = await fetchCanvasSnapshot(record.canvasJsonPath);
  return NextResponse.json({ snapshot });
}
