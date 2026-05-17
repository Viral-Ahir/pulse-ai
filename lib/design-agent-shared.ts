import { z } from "zod";

import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  NODE_COLORS,
  NODE_SHAPES,
  NODE_SHAPE_DEFAULT_SIZES,
  type NodeColorId,
  type NodeShape,
} from "@/types/canvas";

export const AI_USER_ID = "pulse-ai-agent";
export const AI_USER_NAME = "Pulse AI";
export const AI_USER_COLOR = "#6457f9";
export const AI_USER_AVATAR = "";

const colorIds = NODE_COLORS.map((entry) => entry.id) as [
  NodeColorId,
  ...NodeColorId[],
];

export const designedNodeSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  shape: z.enum(NODE_SHAPES as unknown as [NodeShape, ...NodeShape[]]),
  color: z.enum(colorIds),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const designedEdgeSchema = z.object({
  id: z.string().min(1).max(64),
  source: z.string().min(1).max(64),
  target: z.string().min(1).max(64),
  label: z.string().max(64).optional(),
});

export const designSchema = z.object({
  summary: z.string().min(1).max(400),
  nodes: z.array(designedNodeSchema).min(1).max(20),
  edges: z.array(designedEdgeSchema).max(40),
});

export type DesignedNode = z.infer<typeof designedNodeSchema>;
export type DesignedEdge = z.infer<typeof designedEdgeSchema>;
export type Design = z.infer<typeof designSchema>;

export function sanitizeDesign(design: Design, idPrefix: string): Design {
  const prefix = `${idPrefix}-`;
  const renameMap = new Map<string, string>();
  const usedIds = new Set<string>();

  const nodes = design.nodes
    .map((node) => {
      let safeId = `${prefix}${node.id}`;
      if (usedIds.has(safeId)) {
        let counter = 2;
        while (usedIds.has(`${safeId}-${counter}`)) counter += 1;
        safeId = `${safeId}-${counter}`;
      }
      usedIds.add(safeId);
      renameMap.set(node.id, safeId);
      return {
        ...node,
        id: safeId,
        shape: NODE_SHAPES.includes(node.shape)
          ? node.shape
          : DEFAULT_NODE_SHAPE,
        color: colorIds.includes(node.color) ? node.color : DEFAULT_NODE_COLOR,
      };
    });

  const edgeIds = new Set<string>();
  const edges = design.edges
    .map((edge) => ({
      ...edge,
      id: `${prefix}edge-${edge.id}`,
      source: renameMap.get(edge.source) ?? "",
      target: renameMap.get(edge.target) ?? "",
    }))
    .filter((edge) => {
      if (!edge.source || !edge.target) return false;
      if (edge.source === edge.target) return false;
      if (edgeIds.has(edge.id)) return false;
      edgeIds.add(edge.id);
      return true;
    });

  return {
    summary: design.summary,
    nodes,
    edges,
  };
}

export function nodeCenter(node: DesignedNode): { x: number; y: number } {
  const size = NODE_SHAPE_DEFAULT_SIZES[node.shape];
  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2,
  };
}

export function buildSystemPrompt(): string {
  const shapeList = NODE_SHAPES.map((shape) => `"${shape}"`).join(", ");
  const colorList = colorIds.map((color) => `"${color}"`).join(", ");

  return `You are Pulse AI, a system design assistant that draws architecture diagrams on a collaborative canvas.

Output rules:
- Produce between 3 and 14 nodes that capture the requested system.
- Use only these shapes: ${shapeList}.
- Shape semantics: rectangle = general service or component; pill = service or process; cylinder = database or storage; hexagon = external system or boundary; diamond = decision or gateway; circle = event, queue, or endpoint.
- Use only these colors (by id): ${colorList}. Use "neutral" as the default. Use accent colors sparingly (e.g. "blue" for client/frontend, "green" for storage, "purple" for AI/queue, "orange" for external, "red" for security/error paths).
- Each node needs a short label (2-6 words). No marketing copy. No emojis.
- Edges describe data or control flow. Edge labels are optional and short (1-3 words) — use them only when they add meaning (e.g. "writes", "publishes", "auth").
- Avoid self-loops. Avoid duplicate edges. Every edge source/target must reference a node id you declared.

Layout rules:
- Layout in a left-to-right flow. Group related nodes vertically.
- Use a 280px horizontal column spacing and 160px vertical row spacing.
- Place the entrypoint (client / user / trigger) at x = 0. Each downstream layer adds 280 to x.
- Vertically center each column around y = 0. Use rows at y in steps of 160 (e.g. -160, 0, 160, 320).
- Position values are the top-left of the node's bounding box.
- Don't overlap nodes. Don't place two nodes at the same (x, y).

Summary rules:
- The "summary" field is a single short paragraph (1-2 sentences) describing what was generated.`;
}
