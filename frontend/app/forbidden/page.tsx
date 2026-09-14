import Link from "next/link";
import { ShieldX } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldX className="size-7" />
        </div>

        <h1 className="mt-6 text-3xl font-semibold">Access denied</h1>

        <p className="mt-3 text-muted-foreground">
          You do not have permission to access this page.
        </p>

        <Link href="/" className={cn(buttonVariants(), "mt-6")}>
          Return home
        </Link>
      </div>
    </main>
  );
}
