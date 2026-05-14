"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({ sidebarOpen, onToggleSidebar }: EditorNavbarProps) {
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
      <div className="flex-1" />
      <div className="flex items-center">
        <UserButton />
      </div>
    </nav>
  );
}
