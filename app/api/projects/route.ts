import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DEFAULT_PROJECT_NAME = "Untitled Project";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const rawId =
    body && typeof body === "object" && "id" in body
      ? (body as { id?: unknown }).id
      : undefined;
  const rawName =
    body && typeof body === "object" && "name" in body
      ? (body as { name?: unknown }).name
      : undefined;
  const rawDescription =
    body && typeof body === "object" && "description" in body
      ? (body as { description?: unknown }).description
      : undefined;

  const trimmedName = typeof rawName === "string" ? rawName.trim() : "";
  const name = trimmedName.length > 0 ? trimmedName : DEFAULT_PROJECT_NAME;

  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : undefined;

  const trimmedId = typeof rawId === "string" ? rawId.trim() : "";
  const id =
    trimmedId.length > 0 && /^[a-z0-9-]+$/.test(trimmedId)
      ? trimmedId
      : undefined;

  if (id) {
    const existing = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Project id already in use" },
        { status: 409 },
      );
    }
  }

  const project = await prisma.project.create({
    data: {
      ...(id ? { id } : {}),
      ownerId: userId,
      name,
      description,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
