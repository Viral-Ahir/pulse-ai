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
import type { MockProject } from "@/lib/mock-projects";

interface CreateProjectDialogProps {
  open: boolean;
  name: string;
  slug: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  name,
  slug,
  onNameChange,
  onSubmit,
  onClose,
}: CreateProjectDialogProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
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
            autoFocus
          />
          {name.trim() && (
            <p className="text-xs text-copy-faint font-mono px-1">/{slug}</p>
          )}
        </div>
        <DialogFooter className="rounded-b-3xl">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={onSubmit}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RenameProjectDialogProps {
  open: boolean;
  project: MockProject | null;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function RenameProjectDialog({
  open,
  project,
  name,
  onNameChange,
  onSubmit,
  onClose,
}: RenameProjectDialogProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-3xl bg-surface border-surface-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Rename Project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Renaming &ldquo;{project?.name}&rdquo;
          </DialogDescription>
        </DialogHeader>
        <div className="py-1">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-copy-primary"
            autoFocus
          />
        </div>
        <DialogFooter className="rounded-b-3xl">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={onSubmit}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProjectDialogProps {
  open: boolean;
  project: MockProject | null;
  onSubmit: () => void;
  onClose: () => void;
}

export function DeleteProjectDialog({
  open,
  project,
  onSubmit,
  onClose,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-3xl bg-surface border-surface-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Delete Project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            Are you sure you want to delete &ldquo;{project?.name}&rdquo;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="rounded-b-3xl">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onSubmit}>
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
