"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectListItem } from "@/lib/projects";

interface CreateProjectDialogProps {
  open: boolean;
  name: string;
  roomId: string;
  isLoading: boolean;
  error: string | null;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  name,
  roomId,
  isLoading,
  error,
  onNameChange,
  onSubmit,
  onClose,
}: CreateProjectDialogProps) {
  const canSubmit = name.trim().length > 0 && !isLoading;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSubmit) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) onClose(); }}>
      <DialogContent className="rounded-3xl bg-surface border-surface-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">New Project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Give your architecture workspace a name.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-copy-primary"
            disabled={isLoading}
            autoFocus
          />
          {roomId && (
            <p className="text-xs text-copy-faint font-mono px-1">/{roomId}</p>
          )}
          {error && (
            <p className="text-xs text-error px-1">{error}</p>
          )}
        </div>
        <DialogFooter className="rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={onSubmit}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RenameProjectDialogProps {
  open: boolean;
  project: ProjectListItem | null;
  name: string;
  isLoading: boolean;
  error: string | null;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function RenameProjectDialog({
  open,
  project,
  name,
  isLoading,
  error,
  onNameChange,
  onSubmit,
  onClose,
}: RenameProjectDialogProps) {
  const canSubmit = name.trim().length > 0 && !isLoading;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSubmit) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) onClose(); }}>
      <DialogContent className="rounded-3xl bg-surface border-surface-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Rename Project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Renaming &ldquo;{project?.name}&rdquo;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-copy-primary"
            disabled={isLoading}
            autoFocus
          />
          {error && (
            <p className="text-xs text-error px-1">{error}</p>
          )}
        </div>
        <DialogFooter className="rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={onSubmit}>
            {isLoading ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProjectDialogProps {
  open: boolean;
  project: ProjectListItem | null;
  isLoading: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

export function DeleteProjectDialog({
  open,
  project,
  isLoading,
  error,
  onSubmit,
  onClose,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) onClose(); }}>
      <DialogContent className="rounded-3xl bg-surface border-surface-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Delete Project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Are you sure you want to delete &ldquo;{project?.name}&rdquo;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-xs text-error px-1">{error}</p>
        )}
        <DialogFooter className="rounded-b-3xl">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
