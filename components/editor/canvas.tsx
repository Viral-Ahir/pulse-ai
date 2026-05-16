"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";

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
import {
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";

import {
  useCanvasAutosave,
  type CanvasSaveStatus,
} from "@/hooks/use-canvas-autosave";
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
import { LiveCursors } from "./live-cursors";
import { PresenceAvatars } from "./presence-avatars";
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
  projectId: string;
  templatesOpen: boolean;
  onTemplatesClose: () => void;
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
  onSaveHandlerReady?: (handler: () => Promise<void>) => void;
}

export function Canvas({
  projectId,
  templatesOpen,
  onTemplatesClose,
  onSaveStatusChange,
  onSaveHandlerReady,
}: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasSurface
        projectId={projectId}
        templatesOpen={templatesOpen}
        onTemplatesClose={onTemplatesClose}
        onSaveStatusChange={onSaveStatusChange}
        onSaveHandlerReady={onSaveHandlerReady}
      />
    </ReactFlowProvider>
  );
}

function CanvasSurface({
  projectId,
  templatesOpen,
  onTemplatesClose,
  onSaveStatusChange,
  onSaveHandlerReady,
}: CanvasProps) {
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
  const updateMyPresence = useUpdateMyPresence();
  const dropCounterRef = useRef(0);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    if (nodes.length > 0 || edges.length > 0) {
      setAutosaveEnabled(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);
        if (!response.ok) {
          if (!cancelled) setAutosaveEnabled(true);
          return;
        }
        const data = (await response.json()) as {
          snapshot: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null;
        };

        if (cancelled) return;

        if (data.snapshot && nodes.length === 0 && edges.length === 0) {
          if (data.snapshot.nodes.length > 0) {
            onNodesChange(
              data.snapshot.nodes.map((node) => ({
                type: "add" as const,
                item: { ...node },
              })),
            );
          }
          if (data.snapshot.edges.length > 0) {
            onEdgesChange(
              data.snapshot.edges.map((edge) => ({
                type: "add" as const,
                item: { ...edge },
              })),
            );
          }
          requestAnimationFrame(() => {
            fitView({ duration: 300, padding: 0.2 });
          });
        }
        setAutosaveEnabled(true);
      } catch {
        if (!cancelled) setAutosaveEnabled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const { status: saveStatus, saveNow } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: autosaveEnabled,
  });

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  useEffect(() => {
    onSaveHandlerReady?.(saveNow);
  }, [saveNow, onSaveHandlerReady]);

  useKeyboardShortcuts({ reactFlow, undo, redo });

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const cursor = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
      <LiveCursors />
      <PresenceAvatars />
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
