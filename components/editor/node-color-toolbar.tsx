"use client";

import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useReactFlow } from "@xyflow/react";

import {
  NODE_COLORS,
  type CanvasNode,
  type NodeColorId,
} from "@/types/canvas";

interface NodeColorToolbarProps {
  nodeId: string;
  activeColor: NodeColorId;
}

function stopEvent(
  event: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>,
) {
  event.stopPropagation();
}

export function NodeColorToolbar({
  nodeId,
  activeColor,
}: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode>();

  function handleSelect(colorId: NodeColorId) {
    if (colorId === activeColor) {
      return;
    }
    updateNodeData(nodeId, { color: colorId });
  }

  return (
    <div
      className="nodrag nopan absolute bottom-full left-1/2 z-10 mb-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-surface-border bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur"
      onPointerDown={stopEvent}
      onMouseDown={stopEvent}
      onClick={stopEvent}
      onDoubleClick={stopEvent}
    >
      {NODE_COLORS.map((color) => {
        const isActive = color.id === activeColor;
        return (
          <button
            key={color.id}
            type="button"
            aria-label={`Set color ${color.id}`}
            aria-pressed={isActive}
            title={color.id}
            onPointerDown={stopEvent}
            onMouseDown={stopEvent}
            onClick={(event) => {
              event.stopPropagation();
              handleSelect(color.id);
            }}
            style={
              {
                backgroundColor: color.fill,
                "--swatch-glow": color.text,
              } as CSSProperties
            }
            className={`nodrag nopan h-5 w-5 rounded-full border transition-shadow hover:shadow-[0_0_8px_0_var(--swatch-glow)] ${
              isActive
                ? "border-[color:var(--swatch-glow)] shadow-[0_0_6px_0_var(--swatch-glow)]"
                : "border-surface-border"
            }`}
          />
        );
      })}
    </div>
  );
}
