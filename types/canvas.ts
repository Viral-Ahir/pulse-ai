import type { Edge, Node } from "@xyflow/react";

export const NODE_COLORS = [
  { id: "neutral", fill: "#1F1F1F", text: "#EDEDED" },
  { id: "blue", fill: "#10233D", text: "#52A8FF" },
  { id: "purple", fill: "#2E1938", text: "#BF7AF0" },
  { id: "orange", fill: "#331B00", text: "#FF990A" },
  { id: "red", fill: "#3C1618", text: "#FF6166" },
  { id: "pink", fill: "#3A1726", text: "#F75F8F" },
  { id: "green", fill: "#0F2E18", text: "#62C073" },
  { id: "teal", fill: "#062822", text: "#0AC7B4" },
] as const;

export type NodeColorId = (typeof NODE_COLORS)[number]["id"];

export const DEFAULT_NODE_COLOR: NodeColorId = "neutral";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

export const DEFAULT_NODE_SHAPE: NodeShape = "rectangle";

export const NODE_SHAPE_DEFAULT_SIZES: Record<
  NodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 180, height: 80 },
  diamond: { width: 180, height: 140 },
  circle: { width: 120, height: 120 },
  pill: { width: 180, height: 64 },
  cylinder: { width: 140, height: 100 },
  hexagon: { width: 160, height: 100 },
};

export const SHAPE_DRAG_MIME = "application/x-pulse-shape";

export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

export const DEFAULT_EDGE_COLOR = "#f8fafc";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: NodeColorId;
  shape: NodeShape;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

export interface CanvasEdgeData extends Record<string, unknown> {}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;
