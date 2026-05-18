"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
  debounceMs?: number;
}

interface UseCanvasAutosaveResult {
  status: CanvasSaveStatus;
  saveNow: () => Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 1500;
const STATUS_REVERT_MS = 2000;

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revertRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const firstRunRef = useRef(true);
  const latestRef = useRef({ projectId, nodes, edges });

  useEffect(() => {
    latestRef.current = { projectId, nodes, edges };
  }, [projectId, nodes, edges]);

  const performSave = useCallback(async () => {
    const current = latestRef.current;
    const payload = JSON.stringify({
      nodes: current.nodes,
      edges: current.edges,
    });
    lastPayloadRef.current = payload;

    if (revertRef.current) {
      clearTimeout(revertRef.current);
      revertRef.current = null;
    }
    setStatus("saving");
    try {
      const response = await fetch(
        `/api/projects/${current.projectId}/canvas`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
        },
      );
      setStatus(response.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }

    revertRef.current = setTimeout(() => {
      setStatus("idle");
      revertRef.current = null;
    }, STATUS_REVERT_MS);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const payload = JSON.stringify({ nodes, edges });

    if (firstRunRef.current) {
      firstRunRef.current = false;
      lastPayloadRef.current = payload;
      return;
    }

    if (payload === lastPayloadRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void performSave();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [nodes, edges, enabled, debounceMs, performSave]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (revertRef.current) clearTimeout(revertRef.current);
    };
  }, []);

  return { status, saveNow: performSave };
}
