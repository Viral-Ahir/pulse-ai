"use client";

import { useEffect } from "react";

import type { ReactFlowInstance } from "@xyflow/react";

interface UseKeyboardShortcutsParams {
  reactFlow: Pick<ReactFlowInstance, "zoomIn" | "zoomOut">;
  undo: () => void;
  redo: () => void;
}

const ZOOM_DURATION = 150;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key;

      if (mod && (key === "z" || key === "Z")) {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (mod && (key === "y" || key === "Y")) {
        event.preventDefault();
        redo();
        return;
      }

      if (mod || event.altKey) {
        return;
      }

      if (key === "+" || key === "=") {
        event.preventDefault();
        reactFlow.zoomIn({ duration: ZOOM_DURATION });
        return;
      }

      if (key === "-" || key === "_") {
        event.preventDefault();
        reactFlow.zoomOut({ duration: ZOOM_DURATION });
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reactFlow, undo, redo]);
}
