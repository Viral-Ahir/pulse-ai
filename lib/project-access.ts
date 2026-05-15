import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string;
  email: string | null;
}

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  return { userId, email };
}

export interface AccessibleProject {
  id: string;
  name: string;
  ownerId: string;
  isOwner: boolean;
}

export async function getProjectIfAccessible(
  projectId: string,
  identity: CurrentIdentity,
): Promise<AccessibleProject | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: { select: { email: true } },
    },
  });

  if (!project) return null;

  const isOwner = project.ownerId === identity.userId;
  const isCollaborator =
    identity.email !== null &&
    project.collaborators.some((c) => c.email === identity.email);

  if (!isOwner && !isCollaborator) return null;

  return {
    id: project.id,
    name: project.name,
    ownerId: project.ownerId,
    isOwner,
  };
}
