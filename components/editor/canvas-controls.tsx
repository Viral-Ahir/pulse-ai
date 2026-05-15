"use client";

import type { ReactNode } from "react";

import { useReactFlow } from "@xyflow/react";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";

const ZOOM_DURATION = 150;

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 backdrop-blur px-2 py-1.5 shadow-lg">
      <ControlButton
        onClick={() => zoomOut({ duration: ZOOM_DURATION })}
        label="Zoom out"
        icon={<Minus className="h-4 w-4" />}
      />
      <ControlButton
        onClick={() => fitView({ duration: ZOOM_DURATION })}
        label="Fit view"
        icon={<Maximize className="h-4 w-4" />}
      />
      <ControlButton
        onClick={() => zoomIn({ duration: ZOOM_DURATION })}
        label="Zoom in"
        icon={<Plus className="h-4 w-4" />}
      />
      <div
        aria-hidden="true"
        className="mx-1 h-5 w-px bg-surface-border"
      />
      <ControlButton
        onClick={undo}
        disabled={!canUndo}
        label="Undo"
        icon={<Undo2 className="h-4 w-4" />}
      />
      <ControlButton
        onClick={redo}
        disabled={!canRedo}
        label="Redo"
        icon={<Redo2 className="h-4 w-4" />}
      />
    </div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}

function ControlButton({ onClick, label, icon, disabled }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-9 w-9 rounded-full flex items-center justify-center text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-copy-secondary"
    >
      {icon}
    </button>
  );
}
