"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const LABEL_PLACEHOLDER = "Add label";
const STROKE_REST = "var(--text-faint)";
const STROKE_ACTIVE = "var(--text-primary)";
const INTERACTION_WIDTH = 24;

export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const label = data?.label ?? "";
  const isActive = hovered || selected || isEditing;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const input = inputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [isEditing]);

  const commitLabel = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      updateEdgeData(id, {
        label: trimmed.length === 0 ? undefined : trimmed,
      });
    },
    [id, updateEdgeData],
  );

  const beginEditing = useCallback(
    (event: ReactMouseEvent<Element>) => {
      event.stopPropagation();
      setIsEditing(true);
    },
    [],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      commitLabel(event.target.value);
    },
    [commitLabel],
  );

  const finishEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        setIsEditing(false);
      }
    },
    [],
  );

  const stopPropagation = useCallback(
    (
      event:
        | ReactPointerEvent<Element>
        | ReactMouseEvent<Element>,
    ) => {
      event.stopPropagation();
    },
    [],
  );

  return (
    <>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={beginEditing}
        style={{ cursor: "pointer" }}
      >
        <BaseEdge
          path={path}
          markerEnd={markerEnd}
          interactionWidth={INTERACTION_WIDTH}
          style={{
            stroke: isActive ? STROKE_ACTIVE : STROKE_REST,
            strokeWidth: isActive ? 1.75 : 1.25,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            transition: "stroke 120ms ease, stroke-width 120ms ease",
          }}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: isEditing || label.length > 0 || isActive ? "all" : "none",
          }}
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
        >
          {isEditing ? (
            <label
              className="nodrag nopan inline-grid items-center rounded-full border border-surface-border bg-surface/95 px-2.5 py-1 text-xs text-copy-primary shadow-sm backdrop-blur"
              onPointerDown={stopPropagation}
              onMouseDown={stopPropagation}
              onClick={stopPropagation}
              onDoubleClick={stopPropagation}
            >
              <span
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 whitespace-pre px-0.5"
              >
                {label.length === 0 ? LABEL_PLACEHOLDER : label}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={label}
                onChange={handleInputChange}
                onBlur={finishEditing}
                onKeyDown={handleInputKeyDown}
                onPointerDown={stopPropagation}
                onMouseDown={stopPropagation}
                onClick={stopPropagation}
                onDoubleClick={stopPropagation}
                placeholder={LABEL_PLACEHOLDER}
                className="col-start-1 row-start-1 w-full bg-transparent px-0.5 outline-none placeholder:text-copy-faint"
              />
            </label>
          ) : label.length > 0 ? (
            <div
              className="nodrag nopan cursor-text rounded-full border border-surface-border bg-surface/95 px-2.5 py-1 text-xs text-copy-primary shadow-sm backdrop-blur"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onDoubleClick={beginEditing}
            >
              {label}
            </div>
          ) : isActive ? (
            <div
              className="nodrag nopan cursor-text rounded-full border border-dashed border-surface-border bg-surface/70 px-2.5 py-1 text-xs text-copy-faint backdrop-blur"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onDoubleClick={beginEditing}
            >
              {LABEL_PLACEHOLDER}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
