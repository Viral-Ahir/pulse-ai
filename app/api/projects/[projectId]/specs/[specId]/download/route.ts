import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import { fetchSpec } from "@/lib/spec-blob";

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;

  const project = await getProjectIfAccessible(projectId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { id: true, projectId: true, filePath: true },
  });

  if (!spec || spec.projectId !== project.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const content = await fetchSpec(spec.filePath);
  if (content === null) {
    return NextResponse.json(
      { error: "Spec file is unavailable" },
      { status: 404 },
    );
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${spec.id}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
