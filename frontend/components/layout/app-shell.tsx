"use client";

import Link from "next/link";
import {
  BarChart3,
  ClipboardCheck,
  FileClock,
  FilePlus2,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    label: "My Reports",
    href: "/reports",
    icon: FileClock,
    roles: ["TEAM_MEMBER"],
  },
  {
    label: "Create Report",
    href: "/reports/new",
    icon: FilePlus2,
    roles: ["TEAM_MEMBER"],
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    label: "Team Reports",
    href: "/manager/reports",
    icon: ClipboardCheck,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    label: "Team Members",
    href: "/team",
    icon: Users,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    label: "User Management",
    href: "/users",
    icon: Users,
    roles: ["ADMIN"],
  },
];

const managerOnlyPrefixes = [
  "/dashboard",
  "/manager",
  "/team",
  "/projects",
  "/users",
];

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "TEAM_MEMBER":
      return "Team Member";
    case "MANAGER":
      return "Manager";
    case "ADMIN":
      return "Administrator";
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const availableNavigation = useMemo(() => {
    if (!user) {
      return [];
    }

    return navigationItems.filter((item) => item.roles.includes(user.role));
  }, [user]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const isManagerRoute = managerOnlyPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (user.role === "TEAM_MEMBER" && isManagerRoute) {
      router.replace("/reports");
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [pathname]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
          <span>Loading your workspace...</span>
        </div>
      </main>
    );
  }

  function isActiveRoute(href: string): boolean {
    if (href === "/reports") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 px-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BarChart3 className="size-5" />
        </span>

        <div>
          <p className="font-semibold leading-none">Weekly Report</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Team Intelligence
          </p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-3">
        {availableNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(user.firstName, user.lastName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {user.jobTitle ?? getRoleLabel(user.role)}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full justify-start"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background lg:flex">
        {sidebarContent}
      </aside>

      {mobileNavigationOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavigationOpen(false)}
          />

          <aside className="relative flex h-full w-72 flex-col bg-background shadow-xl">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              className="absolute right-3 top-3"
              onClick={() => setMobileNavigationOpen(false)}
            >
              <X className="size-5" />
            </Button>

            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setMobileNavigationOpen(true)}
            >
              <Menu className="size-5" />
            </Button>

            <div>
              <p className="text-sm font-medium">
                {getRoleLabel(user.role)} Workspace
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Monitor progress and keep reports moving.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {getInitials(user.firstName, user.lastName)}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
