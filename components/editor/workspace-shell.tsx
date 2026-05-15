"use client";

import { useState } from "react";

import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectListItem } from "@/lib/projects";

import { AiSidebar } from "./ai-sidebar";
import { CanvasWrapper } from "./canvas-wrapper";
import { EditorNavbar } from "./editor-navbar";
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  RenameProjectDialog,
} from "./project-dialogs";
import { ProjectSidebar } from "./project-sidebar";
import { ShareDialog } from "./share-dialog";

interface WorkspaceShellProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
}

export function WorkspaceShell({
  projectId,
  projectName,
  isOwner,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const actions = useProjectActions();

  return (
    <div className="h-screen bg-base overflow-hidden">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        projectName={projectName}
        aiSidebarOpen={aiSidebarOpen}
        onToggleAiSidebar={() => setAiSidebarOpen((v) => !v)}
        onShare={() => setShareOpen(true)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={projectId}
        onCreateProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />
      <AiSidebar
        isOpen={aiSidebarOpen}
        onClose={() => setAiSidebarOpen(false)}
      />

      <main className="pt-12 h-full">
        <div className="h-full bg-base">
          <CanvasWrapper roomId={projectId} />
        </div>
      </main>

      <CreateProjectDialog
        open={actions.dialogType === "create"}
        name={actions.name}
        roomId={actions.roomId}
        isLoading={actions.isLoading}
        error={actions.error}
        onNameChange={actions.setName}
        onSubmit={actions.submitCreate}
        onClose={actions.close}
      />
      <RenameProjectDialog
        open={actions.dialogType === "rename"}
        project={actions.project}
        name={actions.name}
        isLoading={actions.isLoading}
        error={actions.error}
        onNameChange={actions.setName}
        onSubmit={actions.submitRename}
        onClose={actions.close}
      />
      <DeleteProjectDialog
        open={actions.dialogType === "delete"}
        project={actions.project}
        isLoading={actions.isLoading}
        error={actions.error}
        onSubmit={actions.submitDelete}
        onClose={actions.close}
      />
      <ShareDialog
        open={shareOpen}
        projectId={projectId}
        isOwner={isOwner}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
