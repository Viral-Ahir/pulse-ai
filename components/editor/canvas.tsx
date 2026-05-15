"use client";

import { useCallback, useRef, type DragEvent } from "react";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useRedo, useUndo } from "@liveblocks/react/suspense";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  DEFAULT_NODE_COLOR,
  SHAPE_DRAG_MIME,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas";

import { CanvasControls } from "./canvas-controls";
import { CanvasEdgeRenderer } from "./canvas-edge";
import { CanvasNodeRenderer } from "./canvas-node";
import { ShapePanel } from "./shape-panel";
import { StarterTemplatesModal } from "./starter-templates-modal";
import type { CanvasTemplate } from "./starter-templates";

const NODE_TYPES: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

const EDGE_TYPES: EdgeTypes = {
  canvasEdge: CanvasEdgeRenderer,
};

const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "var(--text-primary)",
    width: 16,
    height: 16,
  },
};

interface CanvasProps {
  templatesOpen: boolean;
  onTemplatesClose: () => void;
}

export function Canvas({ templatesOpen, onTemplatesClose }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasSurface
        templatesOpen={templatesOpen}
        onTemplatesClose={onTemplatesClose}
      />
    </ReactFlowProvider>
  );
}

function CanvasSurface({ templatesOpen, onTemplatesClose }: CanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  const reactFlow = useReactFlow();
  const { screenToFlowPosition, fitView } = reactFlow;
  const undo = useUndo();
  const redo = useRedo();
  const dropCounterRef = useRef(0);

  useKeyboardShortcuts({ reactFlow, undo, redo });

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      const removeNodeChanges = nodes.map((node) => ({
        type: "remove" as const,
        id: node.id,
      }));
      const addNodeChanges = template.nodes.map((node) => ({
        type: "add" as const,
        item: { ...node },
      }));
      onNodesChange([...removeNodeChanges, ...addNodeChanges]);

      const removeEdgeChanges = edges.map((edge) => ({
        type: "remove" as const,
        id: edge.id,
      }));
      const addEdgeChanges = template.edges.map((edge) => ({
        type: "add" as const,
        item: { ...edge },
      }));
      onEdgesChange([...removeEdgeChanges, ...addEdgeChanges]);

      requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.2 });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, fitView],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME);
      if (!raw) {
        return;
      }
      event.preventDefault();

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      dropCounterRef.current += 1;
      const id = `${payload.shape}-${Date.now()}-${dropCounterRef.current}`;
      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position: {
          x: position.x - payload.width / 2,
          y: position.y - payload.height / 2,
        },
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [onNodesChange, screenToFlowPosition],
  );

  return (
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
      <CanvasControls />
      <ShapePanel />
      <StarterTemplatesModal
        open={templatesOpen}
        onClose={onTemplatesClose}
        onImport={handleImportTemplate}
      />
    </div>
  );
}
