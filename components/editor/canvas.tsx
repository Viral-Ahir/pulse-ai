"use client";

import { useCallback, useRef, type DragEvent } from "react";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useLiveblocksFlow } from "@liveblocks/react-flow";

import {
  DEFAULT_NODE_COLOR,
  SHAPE_DRAG_MIME,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas";

import { CanvasNodeRenderer } from "./canvas-node";
import { ShapePanel } from "./shape-panel";

const NODE_TYPES: NodeTypes = {
  canvasNode: CanvasNodeRenderer,
};

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasSurface />
    </ReactFlowProvider>
  );
}

function CanvasSurface() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });
  const { screenToFlowPosition } = useReactFlow();
  const dropCounterRef = useRef(0);

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}
