"use client";

import { useMemo, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NODE_COLORS,
  NODE_SHAPE_DEFAULT_SIZES,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 140;
const PREVIEW_PADDING = 12;

interface StarterTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Start from a template</DialogTitle>
          <DialogDescription>
            Replaces the current canvas with the template you choose.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={() => {
                  onImport(template);
                  onClose();
                }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateCardProps {
  template: CanvasTemplate;
  onImport: () => void;
}

function TemplateCard({ template, onImport }: TemplateCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-surface-border bg-surface/60 p-3">
      <TemplatePreview template={template} />
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-copy-primary">
          {template.name}
        </h3>
        <p className="text-xs text-copy-secondary">{template.description}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onImport}
        className="self-end"
      >
        Import
      </Button>
    </div>
  );
}

interface PreviewLayout {
  nodes: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    cx: number;
    cy: number;
    shape: NodeShape;
    fill: string;
    stroke: string;
  }[];
  edges: { id: string; x1: number; y1: number; x2: number; y2: number }[];
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const layout = useMemo(() => computeLayout(template.nodes, template.edges), [
    template,
  ]);

  return (
    <div
      className="overflow-hidden rounded-md border border-surface-border bg-base"
      style={{ width: "100%", height: PREVIEW_HEIGHT }}
    >
      <svg
        viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        {layout.edges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="var(--text-faint)"
            strokeWidth={1}
          />
        ))}
        {layout.nodes.map((node) => (
          <PreviewShape key={node.id} node={node} />
        ))}
      </svg>
    </div>
  );
}

function PreviewShape({
  node,
}: {
  node: PreviewLayout["nodes"][number];
}): ReactElement {
  const { x, y, w, h, shape, fill, stroke } = node;
  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    const radius =
      shape === "rectangle" ? Math.min(4, h / 4) : Math.min(w, h) / 2;
    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={radius}
        ry={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.75}
      />
    );
  }
  if (shape === "diamond") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    return (
      <polygon
        points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.75}
      />
    );
  }
  if (shape === "hexagon") {
    const inset = w * 0.25;
    const cy = y + h / 2;
    return (
      <polygon
        points={`${x + inset},${y} ${x + w - inset},${y} ${x + w},${cy} ${x + w - inset},${y + h} ${x + inset},${y + h} ${x},${cy}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.75}
      />
    );
  }
  // cylinder
  const ellipseRy = Math.min(h * 0.15, 6);
  return (
    <g>
      <rect
        x={x}
        y={y + ellipseRy}
        width={w}
        height={h - ellipseRy * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.75}
      />
      <ellipse
        cx={x + w / 2}
        cy={y + h - ellipseRy}
        rx={w / 2}
        ry={ellipseRy}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.75}
      />
      <ellipse
        cx={x + w / 2}
        cy={y + ellipseRy}
        rx={w / 2}
        ry={ellipseRy}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.75}
      />
    </g>
  );
}

function computeLayout(
  nodes: CanvasNode[],
  edges: CanvasTemplate["edges"],
): PreviewLayout {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { width, height } = resolveSize(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  const boundsWidth = Math.max(maxX - minX, 1);
  const boundsHeight = Math.max(maxY - minY, 1);
  const innerWidth = PREVIEW_WIDTH - PREVIEW_PADDING * 2;
  const innerHeight = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;
  const scale = Math.min(innerWidth / boundsWidth, innerHeight / boundsHeight);
  const offsetX = (PREVIEW_WIDTH - boundsWidth * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_HEIGHT - boundsHeight * scale) / 2 - minY * scale;

  const projected = new Map<
    string,
    { x: number; y: number; w: number; h: number; cx: number; cy: number }
  >();

  const layoutNodes = nodes.map((node) => {
    const { width, height } = resolveSize(node);
    const x = node.position.x * scale + offsetX;
    const y = node.position.y * scale + offsetY;
    const w = width * scale;
    const h = height * scale;
    const cx = x + w / 2;
    const cy = y + h / 2;
    projected.set(node.id, { x, y, w, h, cx, cy });
    const palette =
      NODE_COLORS.find((entry) => entry.id === node.data.color) ??
      NODE_COLORS[0];
    return {
      id: node.id,
      x,
      y,
      w,
      h,
      cx,
      cy,
      shape: node.data.shape,
      fill: palette.fill,
      stroke: `${palette.text}99`,
    };
  });

  const layoutEdges = edges
    .map((edge) => {
      const source = projected.get(edge.source);
      const target = projected.get(edge.target);
      if (!source || !target) {
        return null;
      }
      return {
        id: edge.id,
        x1: source.cx,
        y1: source.cy,
        x2: target.cx,
        y2: target.cy,
      };
    })
    .filter((entry): entry is PreviewLayout["edges"][number] => entry !== null);

  return { nodes: layoutNodes, edges: layoutEdges };
}

function resolveSize(node: CanvasNode): { width: number; height: number } {
  const fallback = NODE_SHAPE_DEFAULT_SIZES[node.data.shape];
  return {
    width: node.width ?? fallback.width,
    height: node.height ?? fallback.height,
  };
}
