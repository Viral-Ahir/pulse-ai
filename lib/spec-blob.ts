import "server-only";

import { get, put } from "@vercel/blob";

export function specBlobPath(projectId: string, specId: string): string {
  return `specs/${projectId}/${specId}.md`;
}

export async function uploadSpec(
  projectId: string,
  specId: string,
  content: string,
): Promise<string> {
  const result = await put(specBlobPath(projectId, specId), content, {
    access: "private",
    contentType: "text/markdown; charset=utf-8",
    addRandomSuffix: false,
  });
  return result.url;
}

export async function fetchSpec(blobUrl: string): Promise<string | null> {
  const result = await get(blobUrl, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;

  try {
    return await new Response(result.stream).text();
  } catch {
    return null;
  }
}
