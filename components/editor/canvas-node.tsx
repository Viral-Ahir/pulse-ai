"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";

import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

import { NodeColorToolbar } from "./node-color-toolbar";
import { ShapeView } from "./node-shape";

const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 48;
const LABEL_PLACEHOLDER = "Untitled";

const HANDLE_POSITIONS: { id: string; position: Position }[] = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
];

export function CanvasNodeRenderer({
  id,
  data,
  selected,
}: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode>();
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const palette =
    NODE_COLORS.find((entry) => entry.id === data.color) ?? NODE_COLORS[0];

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }, [isEditing]);

  useEffect(() => {
    if (!selected && isEditing) {
      setIsEditing(false);
    }
  }, [selected, isEditing]);

  const handleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      setIsEditing(true);
    },
    [],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { label: event.target.value });
    },
    [id, updateNodeData],
  );

  const handleBlur = useCallback((_event: FocusEvent<HTMLTextAreaElement>) => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsEditing(false);
      }
    },
    [],
  );

  const stopPointer = useCallback(
    (event: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const handleClassName =
    "!h-2 !w-2 !rounded-full !border !border-base !bg-copy-primary opacity-0 transition-opacity duration-100 group-hover:opacity-100";

  return (
    <div
      className="group relative h-full w-full"
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={selected ?? false}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color="var(--accent-primary)"
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: "var(--bg-base)",
          border: "1px solid var(--accent-primary)",
        }}
        lineStyle={{ borderColor: "transparent" }}
      />
      {selected ? (
        <NodeColorToolbar nodeId={id} activeColor={data.color} />
      ) : null}
      <ShapeView
        shape={data.shape}
        label={data.label}
        color={data.color}
        selected={selected ?? false}
        placeholder={LABEL_PLACEHOLDER}
        hideLabel={isEditing}
      />
      {isEditing ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={data.label}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={stopPointer}
            onMouseDown={stopPointer}
            onClick={stopPointer}
            onDoubleClick={stopPointer}
            placeholder={LABEL_PLACEHOLDER}
            className="nodrag nopan pointer-events-auto w-full resize-none bg-transparent text-center text-sm outline-none placeholder:opacity-45"
            style={{ color: palette.text, lineHeight: 1.25 }}
          />
        </div>
      ) : null}
      {HANDLE_POSITIONS.map(({ id: handleId, position }) => (
        <Handle
          key={handleId}
          id={handleId}
          type="source"
          position={position}
          className={handleClassName}
        />
      ))}
    </div>
  );
}
