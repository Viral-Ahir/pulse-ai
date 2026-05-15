import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="h-screen bg-base flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-elevated flex items-center justify-center">
          <Lock className="h-8 w-8 text-copy-muted" />
        </div>
        <h1 className="text-xl font-semibold text-copy-primary">
          Access denied
        </h1>
        <p className="text-sm text-copy-muted">
          This project doesn&apos;t exist or you don&apos;t have permission to
          open it.
        </p>
        <Link href="/editor" className={buttonVariants({ variant: "outline" })}>
          Back to projects
        </Link>
      </div>
    </div>
  );
}
