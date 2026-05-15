export interface MockProject {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
}

export const MOCK_PROJECTS: MockProject[] = [
  { id: "1", name: "E-Commerce Platform", slug: "e-commerce-platform", isOwned: true },
  { id: "2", name: "Analytics Dashboard", slug: "analytics-dashboard", isOwned: true },
  { id: "3", name: "Mobile API Gateway", slug: "mobile-api-gateway", isOwned: false },
];

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
