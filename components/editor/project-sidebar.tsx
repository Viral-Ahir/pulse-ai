"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MockProject } from "@/lib/mock-projects";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: MockProject[];
  onCreateProject: () => void;
  onRenameProject: (project: MockProject) => void;
  onDeleteProject: (project: MockProject) => void;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((p) => p.isOwned);
  const sharedProjects = projects.filter((p) => !p.isOwned);

  return (
    <>
      {/* Mobile backdrop scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-base/80 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-12 left-0 z-40 h-[calc(100vh-3rem)] w-72 flex flex-col bg-surface border-r border-surface-border transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <span className="text-sm font-medium text-copy-primary">Projects</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden p-3">
          <Tabs defaultValue="my-projects" className="h-full flex flex-col">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="flex-1 mt-2 overflow-hidden">
              {ownedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-copy-faint text-sm">
                  No projects yet
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-0.5">
                    {ownedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="group flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-elevated cursor-pointer"
                      >
                        <span className="flex-1 text-sm text-copy-primary truncate">
                          {project.name}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-copy-muted hover:text-copy-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRenameProject(project);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-copy-muted hover:text-error"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex-1 mt-2 overflow-hidden">
              {sharedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-copy-faint text-sm">
                  No shared projects
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-0.5">
                    {sharedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center px-3 py-2 rounded-xl hover:bg-elevated cursor-pointer"
                      >
                        <span className="flex-1 text-sm text-copy-primary truncate">
                          {project.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-3 border-t border-surface-border">
          <Button className="w-full gap-2" onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
