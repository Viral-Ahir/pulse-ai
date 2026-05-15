"use client";

import type { DragEvent } from "react";

import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react";

import {
  NODE_SHAPE_DEFAULT_SIZES,
  SHAPE_DRAG_MIME,
  type NodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

interface ShapeItem {
  shape: NodeShape;
  label: string;
  icon: LucideIcon;
}

const SHAPE_ITEMS: ShapeItem[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
];

export function ShapePanel() {
  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    shape: NodeShape,
  ) {
    const { width, height } = NODE_SHAPE_DEFAULT_SIZES[shape];
    const payload: ShapeDragPayload = { shape, width, height };
    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 backdrop-blur px-2 py-1.5 shadow-lg">
      {SHAPE_ITEMS.map(({ shape, label, icon: Icon }) => (
        <button
          key={shape}
          type="button"
          draggable
          onDragStart={(event) => handleDragStart(event, shape)}
          aria-label={`Drag to add ${label}`}
          title={label}
          className="h-9 w-9 rounded-full flex items-center justify-center text-copy-secondary hover:bg-elevated hover:text-copy-primary transition-colors cursor-grab active:cursor-grabbing"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
