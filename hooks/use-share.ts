"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ShareCollaborator {
  id: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
}

interface ShareApiResponse {
  collaborators?: ShareCollaborator[];
  error?: string;
}

export function useShare(projectId: string, open: boolean) {
  const [collaborators, setCollaborators] = useState<ShareCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      const data = (await res.json().catch(() => null)) as ShareApiResponse | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to load collaborators");
      }
      setCollaborators(data?.collaborators ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load collaborators",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      refresh();
    } else {
      setError(null);
      setInviteEmail("");
    }
  }, [open, refresh]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const invite = useCallback(async () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed || isInviting) return;
    setIsInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to invite collaborator");
      }
      setInviteEmail("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to invite collaborator",
      );
    } finally {
      setIsInviting(false);
    }
  }, [inviteEmail, isInviting, projectId, refresh]);

  const remove = useCallback(
    async (collaboratorId: string) => {
      if (removingId) return;
      setRemovingId(collaboratorId);
      setError(null);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/collaborators/${collaboratorId}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(data?.error ?? "Failed to remove collaborator");
        }
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove collaborator",
        );
      } finally {
        setRemovingId(null);
      }
    },
    [removingId, projectId, refresh],
  );

  const copyLink = useCallback(async () => {
    try {
      const link = `${window.location.origin}/editor/${projectId}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Failed to copy link");
    }
  }, [projectId]);

  return {
    collaborators,
    isLoading,
    inviteEmail,
    setInviteEmail,
    isInviting,
    removingId,
    error,
    copied,
    invite,
    remove,
    copyLink,
  };
}
