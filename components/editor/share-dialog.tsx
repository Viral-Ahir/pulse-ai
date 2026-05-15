"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useShare } from "@/hooks/use-share";

interface ShareDialogProps {
  open: boolean;
  projectId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function ShareDialog({
  open,
  projectId,
  isOwner,
  onClose,
}: ShareDialogProps) {
  const share = useShare(projectId, open);
  const [link, setLink] = useState("");

  useEffect(() => {
    setLink(`${window.location.origin}/editor/${projectId}`);
  }, [projectId]);

  const canInvite = share.inviteEmail.trim().length > 0 && !share.isInviting;
  const handleInviteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canInvite) share.invite();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="rounded-3xl bg-surface border-surface-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Share project</DialogTitle>
          <DialogDescription className="text-copy-muted">
            {isOwner
              ? "Invite collaborators by email."
              : "You have access to this project."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={link}
            className="text-copy-muted font-mono text-xs"
          />
          <Button
            onClick={share.copyLink}
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
          >
            {share.copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {share.copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="name@example.com"
              value={share.inviteEmail}
              onChange={(e) => share.setInviteEmail(e.target.value)}
              onKeyDown={handleInviteKeyDown}
              disabled={share.isInviting}
              className="text-copy-primary"
            />
            <Button
              disabled={!canInvite}
              onClick={share.invite}
              size="sm"
              className="shrink-0"
            >
              {share.isInviting ? "Inviting..." : "Invite"}
            </Button>
          </div>
        )}

        {share.error && (
          <p className="text-xs text-error px-1">{share.error}</p>
        )}

        <div className="space-y-1">
          <p className="text-xs text-copy-muted px-1">
            Collaborators ({share.collaborators.length})
          </p>
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {share.isLoading ? (
              <p className="text-xs text-copy-faint px-2 py-3">Loading...</p>
            ) : share.collaborators.length === 0 ? (
              <p className="text-xs text-copy-faint px-2 py-3">
                No collaborators yet
              </p>
            ) : (
              share.collaborators.map((c) => (
                <CollaboratorRow
                  key={c.id}
                  collaborator={c}
                  isOwner={isOwner}
                  isRemoving={share.removingId === c.id}
                  onRemove={() => share.remove(c.id)}
                />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CollaboratorRowProps {
  collaborator: {
    id: string;
    email: string;
    displayName: string | null;
    imageUrl: string | null;
  };
  isOwner: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}

function CollaboratorRow({
  collaborator,
  isOwner,
  isRemoving,
  onRemove,
}: CollaboratorRowProps) {
  const primary = collaborator.displayName ?? collaborator.email;
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-elevated">
      <Avatar imageUrl={collaborator.imageUrl} label={primary} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-copy-primary truncate">{primary}</p>
        {collaborator.displayName && (
          <p className="text-xs text-copy-faint truncate">
            {collaborator.email}
          </p>
        )}
      </div>
      {isOwner && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-copy-muted hover:text-error"
          onClick={onRemove}
          disabled={isRemoving}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function Avatar({
  imageUrl,
  label,
}: {
  imageUrl: string | null;
  label: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={label}
        className="h-8 w-8 rounded-full object-cover shrink-0 bg-elevated"
      />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-elevated flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-copy-primary">
        {label.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
