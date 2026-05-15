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
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { MOCK_PROJECTS, toSlug, type MockProject } from "@/lib/mock-projects";

export function EditorShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<MockProject[]>(MOCK_PROJECTS);
  const dialogs = useProjectDialogs();

  const handleCreateSubmit = () => {
    const name = dialogs.name.trim();
    if (!name) return;
    const newProject: MockProject = {
      id: crypto.randomUUID(),
      name,
      slug: toSlug(name),
      isOwned: true,
    };
    setProjects((prev) => [...prev, newProject]);
    dialogs.close();
  };

  const handleRenameSubmit = () => {
    const name = dialogs.name.trim();
    if (!name || !dialogs.project) return;
    const id = dialogs.project.id;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name, slug: toSlug(name) } : p,
      ),
    );
    dialogs.close();
  };

  const handleDeleteSubmit = () => {
    if (!dialogs.project) return;
    const id = dialogs.project.id;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    dialogs.close();
  };

  return (
    <div className="h-screen bg-base">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={projects}
        onCreateProject={dialogs.openCreate}
        onRenameProject={dialogs.openRename}
        onDeleteProject={dialogs.openDelete}
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
          <Button className="gap-2" onClick={dialogs.openCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>

      <CreateProjectDialog
        open={dialogs.dialogType === "create"}
        name={dialogs.name}
        slug={dialogs.slug}
        onNameChange={dialogs.setName}
        onSubmit={handleCreateSubmit}
        onClose={dialogs.close}
      />
      <RenameProjectDialog
        open={dialogs.dialogType === "rename"}
        project={dialogs.project}
        name={dialogs.name}
        onNameChange={dialogs.setName}
        onSubmit={handleRenameSubmit}
        onClose={dialogs.close}
      />
      <DeleteProjectDialog
        open={dialogs.dialogType === "delete"}
        project={dialogs.project}
        onSubmit={handleDeleteSubmit}
        onClose={dialogs.close}
      />
    </div>
  );
}
