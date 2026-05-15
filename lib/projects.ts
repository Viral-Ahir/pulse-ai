import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface ProjectListItem {
  id: string;
  name: string;
  isOwned: boolean;
}

export interface ProjectLists {
  owned: ProjectListItem[];
  shared: ProjectListItem[];
}

export async function getProjectsForUser(): Promise<ProjectLists> {
  const { userId } = await auth();
  if (!userId) {
    return { owned: [], shared: [] };
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const ownedRows = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const sharedRows = email
    ? await prisma.project.findMany({
        where: {
          ownerId: { not: userId },
          collaborators: { some: { email } },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      })
    : [];

  return {
    owned: ownedRows.map((p) => ({ id: p.id, name: p.name, isOwned: true })),
    shared: sharedRows.map((p) => ({ id: p.id, name: p.name, isOwned: false })),
  };
}
