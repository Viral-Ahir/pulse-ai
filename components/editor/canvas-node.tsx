"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const palette =
    NODE_COLORS.find((entry) => entry.id === data.color) ?? NODE_COLORS[0];

  return (
    <div
      className={`relative h-full w-full rounded-xl border flex items-center justify-center px-4 py-2 text-sm ${
        selected ? "ring-2 ring-brand" : ""
      }`}
      style={{
        backgroundColor: palette.fill,
        color: palette.text,
        borderColor: "var(--border-default)",
      }}
    >
      <Handle type="target" position={Position.Top} />
      <span className="truncate text-center">{data.label || " "}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
