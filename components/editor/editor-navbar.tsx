"use client";

import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Share2,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  aiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onShare?: () => void;
  onOpenTemplates?: () => void;
  hideUserButton?: boolean;
  saveStatus?: CanvasSaveStatus;
  onSave?: () => void;
}

export function EditorNavbar({
  sidebarOpen,
  onToggleSidebar,
  projectName,
  aiSidebarOpen,
  onToggleAiSidebar,
  onShare,
  onOpenTemplates,
  hideUserButton = false,
  saveStatus,
  onSave,
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
        {onSave && (
          <SaveButton status={saveStatus ?? "idle"} onClick={onSave} />
        )}
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
        {!hideUserButton && <UserButton />}
      </div>
    </nav>
  );
}

interface SaveButtonProps {
  status: CanvasSaveStatus;
  onClick: () => void;
}

function SaveButton({ status, onClick }: SaveButtonProps) {
  const { icon, label, className } = (() => {
    switch (status) {
      case "saving":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: "Saving...",
          className: "text-copy-muted",
        };
      case "saved":
        return {
          icon: <Check className="h-4 w-4" />,
          label: "Saved",
          className: "text-copy-secondary",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Error",
          className: "text-error",
        };
      default:
        return {
          icon: <Save className="h-4 w-4" />,
          label: "Save",
          className: "text-copy-muted hover:text-copy-primary",
        };
    }
  })();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={status === "saving"}
      className={`h-8 gap-2 ${className}`}
      aria-live="polite"
    >
      {icon}
      {label}
    </Button>
  );
}
