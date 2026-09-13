import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Weekly Report Dashboard</CardTitle>

          <CardDescription>
            Create structured weekly reports, review team progress and analyze
            workplace activity.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Link href="/login" className={cn(buttonVariants(), "w-full")}>
            Continue to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
