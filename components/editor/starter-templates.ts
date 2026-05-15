import {
  DEFAULT_NODE_COLOR,
  NODE_SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeColorId,
  type NodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface NodeSeed {
  id: string;
  label: string;
  shape?: NodeShape;
  color?: NodeColorId;
  x: number;
  y: number;
}

interface EdgeSeed {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

function makeNode(seed: NodeSeed): CanvasNode {
  const shape = seed.shape ?? "rectangle";
  const { width, height } = NODE_SHAPE_DEFAULT_SIZES[shape];
  return {
    id: seed.id,
    type: "canvasNode",
    position: { x: seed.x, y: seed.y },
    width,
    height,
    data: {
      label: seed.label,
      color: seed.color ?? DEFAULT_NODE_COLOR,
      shape,
    },
  };
}

function makeEdge(seed: EdgeSeed): CanvasEdge {
  return {
    id: seed.id ?? `${seed.source}->${seed.target}`,
    source: seed.source,
    target: seed.target,
    type: "canvasEdge",
    data: seed.label ? { label: seed.label } : {},
  };
}

function buildTemplate(
  meta: { id: string; name: string; description: string },
  nodeSeeds: NodeSeed[],
  edgeSeeds: EdgeSeed[],
): CanvasTemplate {
  return {
    ...meta,
    nodes: nodeSeeds.map(makeNode),
    edges: edgeSeeds.map(makeEdge),
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  buildTemplate(
    {
      id: "microservices",
      name: "Microservices Architecture",
      description:
        "Client traffic through an API gateway fanning out to auth, user, and order services with their own datastores.",
    },
    [
      { id: "client", label: "Client", shape: "rectangle", color: "blue", x: 240, y: 0 },
      { id: "gateway", label: "API Gateway", shape: "hexagon", color: "purple", x: 250, y: 160 },
      { id: "auth", label: "Auth Service", shape: "rectangle", color: "green", x: 0, y: 320 },
      { id: "users", label: "User Service", shape: "rectangle", color: "teal", x: 240, y: 320 },
      { id: "orders", label: "Order Service", shape: "rectangle", color: "orange", x: 480, y: 320 },
      { id: "auth-db", label: "Auth DB", shape: "cylinder", color: "neutral", x: 20, y: 480 },
      { id: "user-db", label: "User DB", shape: "cylinder", color: "neutral", x: 260, y: 480 },
      { id: "order-db", label: "Order DB", shape: "cylinder", color: "neutral", x: 500, y: 480 },
    ],
    [
      { source: "client", target: "gateway", label: "HTTPS" },
      { source: "gateway", target: "auth" },
      { source: "gateway", target: "users" },
      { source: "gateway", target: "orders" },
      { source: "auth", target: "auth-db" },
      { source: "users", target: "user-db" },
      { source: "orders", target: "order-db" },
    ],
  ),
  buildTemplate(
    {
      id: "cicd-pipeline",
      name: "CI/CD Pipeline",
      description:
        "Developer commits flow through build and test gates before promoting to staging and production.",
    },
    [
      { id: "dev", label: "Developer", shape: "circle", color: "blue", x: 0, y: 80 },
      { id: "repo", label: "Git Repository", shape: "pill", color: "neutral", x: 200, y: 88 },
      { id: "build", label: "Build", shape: "rectangle", color: "orange", x: 440, y: 80 },
      { id: "tests", label: "Tests Pass?", shape: "diamond", color: "purple", x: 680, y: 60 },
      { id: "staging", label: "Staging", shape: "rectangle", color: "teal", x: 920, y: 0 },
      { id: "prod", label: "Production", shape: "rectangle", color: "green", x: 920, y: 160 },
      { id: "fail", label: "Notify Developer", shape: "rectangle", color: "red", x: 680, y: 240 },
    ],
    [
      { source: "dev", target: "repo", label: "push" },
      { source: "repo", target: "build", label: "webhook" },
      { source: "build", target: "tests" },
      { source: "tests", target: "staging", label: "yes" },
      { source: "staging", target: "prod", label: "promote" },
      { source: "tests", target: "fail", label: "no" },
    ],
  ),
  buildTemplate(
    {
      id: "event-driven",
      name: "Event-Driven System",
      description:
        "A producer publishes to an event bus that fans out to independent consumers writing to their own sinks.",
    },
    [
      { id: "producer", label: "Producer", shape: "rectangle", color: "blue", x: 0, y: 160 },
      { id: "bus", label: "Event Bus", shape: "hexagon", color: "purple", x: 240, y: 160 },
      { id: "consumer-a", label: "Consumer A", shape: "rectangle", color: "green", x: 480, y: 40 },
      { id: "consumer-b", label: "Consumer B", shape: "rectangle", color: "orange", x: 480, y: 280 },
      { id: "warehouse", label: "Data Warehouse", shape: "cylinder", color: "neutral", x: 720, y: 30 },
      { id: "metrics", label: "Metrics", shape: "pill", color: "teal", x: 720, y: 280 },
    ],
    [
      { source: "producer", target: "bus", label: "publish" },
      { source: "bus", target: "consumer-a" },
      { source: "bus", target: "consumer-b" },
      { source: "consumer-a", target: "warehouse", label: "write" },
      { source: "consumer-b", target: "metrics", label: "emit" },
    ],
  ),
];
