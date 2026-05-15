"use client";

import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  aiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onShare?: () => void;
  onOpenTemplates?: () => void;
}

export function EditorNavbar({
  sidebarOpen,
  onToggleSidebar,
  projectName,
  aiSidebarOpen,
  onToggleAiSidebar,
  onShare,
  onOpenTemplates,
}: EditorNavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-3 bg-surface border-b border-surface-border">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-copy-muted hover:text-copy-primary"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center px-3">
        {projectName && (
          <span className="text-sm font-medium text-copy-primary truncate max-w-xs">
            {projectName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onOpenTemplates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenTemplates}
            className="h-8 gap-2 text-copy-muted hover:text-copy-primary"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
        )}
        {onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="h-8 gap-2 text-copy-muted hover:text-copy-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
        {onToggleAiSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAiSidebar}
            className={`h-8 w-8 ${
              aiSidebarOpen
                ? "text-ai-text"
                : "text-copy-muted hover:text-copy-primary"
            }`}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        )}
        <UserButton />
      </div>
    </nav>
  );
}
