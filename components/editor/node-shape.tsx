"use client";

import type { ReactElement } from "react";

import { NODE_COLORS, type NodeColorId, type NodeShape } from "@/types/canvas";

interface ShapeViewProps {
  shape: NodeShape;
  label: string;
  color: NodeColorId;
  selected?: boolean;
  placeholder?: string;
  hideLabel?: boolean;
}

export function ShapeView({
  shape,
  label,
  color,
  selected = false,
  placeholder,
  hideLabel = false,
}: ShapeViewProps) {
  const palette =
    NODE_COLORS.find((entry) => entry.id === color) ?? NODE_COLORS[0];
  const borderColor = selected
    ? "var(--accent-primary)"
    : `${palette.text}66`;
  const borderWidth = selected ? 2 : 1;

  const trimmed = label.trim();
  const showPlaceholder = trimmed.length === 0 && Boolean(placeholder);
  const labelText = trimmed.length === 0 ? (placeholder ?? " ") : label;
  const labelEl = hideLabel ? null : (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-sm"
      style={{ color: palette.text, opacity: showPlaceholder ? 0.45 : 1 }}
    >
      <span className="truncate text-center">{labelText}</span>
    </div>
  );

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    const radiusClass = shape === "rectangle" ? "rounded-xl" : "rounded-full";
    return (
      <div
        className={`relative h-full w-full ${radiusClass}`}
        style={{
          backgroundColor: palette.fill,
          border: `${borderWidth}px solid ${borderColor}`,
        }}
      >
        {labelEl}
      </div>
    );
  }

  let bodyPath = "";
  let overlay: ReactElement | null = null;
  if (shape === "diamond") {
    bodyPath = "M 50 0 L 100 50 L 50 100 L 0 50 Z";
  } else if (shape === "hexagon") {
    bodyPath = "M 25 0 L 75 0 L 100 50 L 75 100 L 25 100 L 0 50 Z";
  } else if (shape === "cylinder") {
    bodyPath = "M 0 15 A 50 15 0 0 1 100 15 V 85 A 50 15 0 0 1 0 85 Z";
    overlay = (
      <path
        d="M 0 15 A 50 15 0 0 0 100 15"
        fill="none"
        stroke={borderColor}
        strokeWidth={borderWidth}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <path
          d={bodyPath}
          fill={palette.fill}
          stroke={borderColor}
          strokeWidth={borderWidth}
          vectorEffect="non-scaling-stroke"
        />
        {overlay}
      </svg>
      {labelEl}
    </div>
  );
}
