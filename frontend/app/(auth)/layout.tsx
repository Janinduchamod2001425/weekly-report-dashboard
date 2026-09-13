import Link from "next/link";
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BarChart3 className="size-5" />
            </span>

            <span className="font-semibold">Weekly Report</span>
          </Link>

          {children}
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.35),_transparent_40%)]" />

        <div className="relative">
          <p className="text-sm font-medium text-blue-300">TEAM INTELLIGENCE</p>

          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight">
            Turn weekly updates into clear team progress.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Submit structured reports, resolve blockers, manage reviews and
            understand how work moves across the team.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-3xl font-semibold">100%</p>
            <p className="mt-1 text-sm text-slate-400">Team visibility</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-3xl font-semibold">4</p>
            <p className="mt-1 text-sm text-slate-400">Workflow states</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-3xl font-semibold">Live</p>
            <p className="mt-1 text-sm text-slate-400">Team insights</p>
          </div>
        </div>
      </section>
    </main>
  );
}
