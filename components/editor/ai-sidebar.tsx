"use client";

import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-base/80 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-12 right-0 z-40 h-[calc(100vh-3rem)] w-80 flex flex-col bg-surface border-l border-surface-border transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <span className="text-sm font-medium text-copy-primary">
            AI Assistant
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-copy-muted hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <Sparkles className="h-8 w-8 text-copy-faint" />
          <p className="text-sm text-copy-faint">AI chat coming soon</p>
        </div>
      </aside>
    </>
  );
}
