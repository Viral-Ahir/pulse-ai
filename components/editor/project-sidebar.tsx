"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
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
        <Tabs defaultValue="my-projects" className="h-full">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects">
            <div className="flex items-center justify-center h-32 text-copy-faint text-sm">
              No projects yet
            </div>
          </TabsContent>
          <TabsContent value="shared">
            <div className="flex items-center justify-center h-32 text-copy-faint text-sm">
              No shared projects
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-3 border-t border-surface-border">
        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
