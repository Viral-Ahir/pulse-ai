import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { enrichCollaborators } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      collaborators: { select: { email: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = project.ownerId === userId;
  if (!isOwner) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;
    const isCollaborator =
      email !== null && project.collaborators.some((c) => c.email === email);
    if (!isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, createdAt: true },
  });

  const collaborators = await enrichCollaborators(rows);
  return NextResponse.json({ collaborators });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const rawEmail =
    body && typeof body === "object" && "email" in body
      ? (body as { email?: unknown }).email
      : undefined;
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already invited" },
      { status: 409 },
    );
  }

  const created = await prisma.projectCollaborator.create({
    data: { projectId, email },
    select: { id: true, email: true, createdAt: true },
  });

  const [collaborator] = await enrichCollaborators([created]);

  return NextResponse.json({ collaborator }, { status: 201 });
}
