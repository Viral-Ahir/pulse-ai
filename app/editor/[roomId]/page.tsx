import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";
import { getProjectsForUser } from "@/lib/projects";

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { roomId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) {
    redirect("/sign-in");
  }

  const project = await getProjectIfAccessible(roomId, identity);
  if (!project) {
    return <AccessDenied />;
  }

  const { owned, shared } = await getProjectsForUser();

  return (
    <WorkspaceShell
      projectId={project.id}
      projectName={project.name}
      isOwner={project.isOwner}
      ownedProjects={owned}
      sharedProjects={shared}
    />
  );
}
