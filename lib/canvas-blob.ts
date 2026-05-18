import "server-only";

import { get, put } from "@vercel/blob";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function blobPath(projectId: string): string {
  return `canvas/${projectId}.json`;
}

export async function uploadCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot,
): Promise<string> {
  const result = await put(blobPath(projectId), JSON.stringify(snapshot), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
  });
  return result.url;
}

export async function fetchCanvasSnapshot(
  blobUrl: string,
): Promise<CanvasSnapshot | null> {
  const result = await get(blobUrl, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;

  let text: string;
  try {
    text = await new Response(result.stream).text();
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "nodes" in parsed &&
    "edges" in parsed &&
    Array.isArray((parsed as { nodes: unknown }).nodes) &&
    Array.isArray((parsed as { edges: unknown }).edges)
  ) {
    return parsed as CanvasSnapshot;
  }
  return null;
}
