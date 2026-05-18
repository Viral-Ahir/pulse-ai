import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
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

  const rows = await prisma.projectSpec.findMany({
    where: { projectId: project.id },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const specs = rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    filename: `spec-${row.id}.md`,
  }));

  return NextResponse.json({ specs });
}
