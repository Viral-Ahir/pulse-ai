"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { buildRoomId, generateSuffix, toSlug } from "@/lib/slug";
import type { ProjectListItem } from "@/lib/projects";

type DialogType = "create" | "rename" | "delete" | null;

interface DialogState {
  type: DialogType;
  project: ProjectListItem | null;
  name: string;
  suffix: string;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: DialogState = {
  type: null,
  project: null,
  name: "",
  suffix: "",
  isLoading: false,
  error: null,
};

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<DialogState>(INITIAL_STATE);

  const openCreate = useCallback(() => {
    setState({
      type: "create",
      project: null,
      name: "",
      suffix: generateSuffix(),
      isLoading: false,
      error: null,
    });
  }, []);

  const openRename = useCallback((project: ProjectListItem) => {
    setState({
      type: "rename",
      project,
      name: project.name,
      suffix: "",
      isLoading: false,
      error: null,
    });
  }, []);

  const openDelete = useCallback((project: ProjectListItem) => {
    setState({
      type: "delete",
      project,
      name: "",
      suffix: "",
      isLoading: false,
      error: null,
    });
  }, []);

  const close = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name }));
  }, []);

  const roomId = useMemo(() => {
    if (state.type !== "create") return "";
    const trimmed = state.name.trim();
    if (!trimmed) return "";
    return buildRoomId(trimmed, state.suffix);
  }, [state.type, state.name, state.suffix]);

  const submitCreate = useCallback(async () => {
    const trimmed = state.name.trim();
    if (!trimmed || state.isLoading) return;

    const id = buildRoomId(trimmed, state.suffix || generateSuffix());

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to create project");
      }

      const data = (await res.json()) as { project: { id: string } };
      setState(INITIAL_STATE);
      router.push(`/editor/${data.project.id}`);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to create project",
      }));
    }
  }, [state.name, state.suffix, state.isLoading, router]);

  const submitRename = useCallback(async () => {
    const trimmed = state.name.trim();
    if (!trimmed || !state.project || state.isLoading) return;

    const projectId = state.project.id;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to rename project");
      }

      setState(INITIAL_STATE);
      router.refresh();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to rename project",
      }));
    }
  }, [state.name, state.project, state.isLoading, router]);

  const submitDelete = useCallback(async () => {
    if (!state.project || state.isLoading) return;

    const projectId = state.project.id;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to delete project");
      }

      const isActiveWorkspace = pathname === `/editor/${projectId}`;
      setState(INITIAL_STATE);

      if (isActiveWorkspace) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to delete project",
      }));
    }
  }, [state.project, state.isLoading, pathname, router]);

  return {
    dialogType: state.type,
    project: state.project,
    name: state.name,
    slug: toSlug(state.name),
    roomId,
    isLoading: state.isLoading,
    error: state.error,
    openCreate,
    openRename,
    openDelete,
    close,
    setName,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
