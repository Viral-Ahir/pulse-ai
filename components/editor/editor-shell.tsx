"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "./editor-navbar";
import { ProjectSidebar } from "./project-sidebar";
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "./project-dialogs";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectListItem } from "@/lib/projects";

interface EditorShellProps {
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
}

export function EditorShell({ ownedProjects, sharedProjects }: EditorShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const actions = useProjectActions();

  return (
    <div className="h-screen bg-base">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />
      <main className="pt-12 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <h1 className="text-xl font-semibold text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="text-sm text-copy-muted max-w-sm">
            Start a new architecture workspace, or choose a project from the
            sidebar.
          </p>
          <Button className="gap-2" onClick={actions.openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
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
    </div>
  );
}
