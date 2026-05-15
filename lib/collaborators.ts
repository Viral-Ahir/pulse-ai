import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

export interface CollaboratorWithUser {
  id: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface CollaboratorRow {
  id: string;
  email: string;
  createdAt: Date;
}

export async function enrichCollaborators(
  rows: CollaboratorRow[],
): Promise<CollaboratorWithUser[]> {
  if (rows.length === 0) return [];

  const emails = rows.map((r) => r.email);

  const userByEmail = new Map<
    string,
    { firstName: string | null; lastName: string | null; imageUrl: string }
  >();

  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({ emailAddress: emails });
    for (const user of data) {
      for (const entry of user.emailAddresses) {
        userByEmail.set(entry.emailAddress.toLowerCase(), {
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        });
      }
    }
  } catch {
    // Clerk lookup failed — fall back to email-only.
  }

  return rows.map((row) => {
    const user = userByEmail.get(row.email.toLowerCase());
    const fullName = user
      ? [user.firstName, user.lastName].filter(Boolean).join(" ")
      : "";
    return {
      id: row.id,
      email: row.email,
      displayName: fullName.length > 0 ? fullName : null,
      imageUrl: user?.imageUrl ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  });
}
