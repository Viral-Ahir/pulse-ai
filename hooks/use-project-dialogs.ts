"use client";

import { useState } from "react";
import { toSlug, type MockProject } from "@/lib/mock-projects";

type DialogType = "create" | "rename" | "delete" | null;

interface DialogState {
  type: DialogType;
  project: MockProject | null;
  name: string;
  isLoading: boolean;
}

export function useProjectDialogs() {
  const [state, setState] = useState<DialogState>({
    type: null,
    project: null,
    name: "",
    isLoading: false,
  });

  const openCreate = () =>
    setState({ type: "create", project: null, name: "", isLoading: false });

  const openRename = (project: MockProject) =>
    setState({ type: "rename", project, name: project.name, isLoading: false });

  const openDelete = (project: MockProject) =>
    setState({ type: "delete", project, name: "", isLoading: false });

  const close = () =>
    setState({ type: null, project: null, name: "", isLoading: false });

  const setName = (name: string) =>
    setState((prev) => ({ ...prev, name }));

  return {
    dialogType: state.type,
    project: state.project,
    name: state.name,
    slug: toSlug(state.name),
    isLoading: state.isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    setName,
  };
}
