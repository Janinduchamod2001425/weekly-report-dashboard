"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiRequest } from "@/lib/api";
import type { UserRole } from "@/types/auth";
import type { AdminUsersResponse, UserListItem } from "@/types/users";

type RoleFilter = UserRole | "";
type StatusFilter = "true" | "false" | "";

interface UserFilters {
  search: string;
  role: RoleFilter;
  isActive: StatusFilter;
}

const initialFilters: UserFilters = {
  search: "",
  role: "",
  isActive: "",
};

function formatDate(value: string): string {
  return format(new Date(value), "dd MMM yyyy");
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";

    case "MANAGER":
      return "Manager";

    case "TEAM_MEMBER":
      return "Team Member";
  }
}

function roleClassName(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";

    case "MANAGER":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";

    case "TEAM_MEMBER":
      return "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300";
  }
}

function memberProjects(user: UserListItem) {
  return user.projectMemberships ?? [];
}

export default function UserManagementPage() {
  const [response, setResponse] = useState<AdminUsersResponse | null>(null);

  const [filters, setFilters] = useState<UserFilters>(initialFilters);

  const [appliedFilters, setAppliedFilters] =
    useState<UserFilters>(initialFilters);

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (appliedFilters.search) {
        query.set("search", appliedFilters.search);
      }

      if (appliedFilters.role) {
        query.set("role", appliedFilters.role);
      }

      if (appliedFilters.isActive) {
        query.set("isActive", appliedFilters.isActive);
      }

      const result = await apiRequest<AdminUsersResponse>(
        `/users?${query.toString()}`,
      );

      setResponse(result);
    } catch (error) {
      setResponse(null);

      toast.error("Unable to load users", {
        description:
          error instanceof ApiError
            ? error.message
            : "Please confirm that the backend server is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function updateFilter(field: keyof UserFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();

    setPage(1);

    setAppliedFilters({
      search: filters.search.trim(),
      role: filters.role,
      isActive: filters.isActive,
    });
  }

  function resetFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              User management
            </h1>

            <p className="mt-1 text-muted-foreground">
              Manage user accounts, roles, projects and reporting relationships.
            </p>
          </div>
        </div>

        <Link href="/users/new" className={buttonVariants()}>
          <Plus className="size-4" />
          Create user
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>User filters</CardTitle>

          <CardDescription>
            Search users and filter by role or account status.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={applyFilters}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search name, email or job title..."
                className="pl-9"
              />
            </div>

            <select
              value={filters.role}
              onChange={(event) => updateFilter("role", event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="">All roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="TEAM_MEMBER">Team Member</option>
            </select>

            <select
              value={filters.isActive}
              onChange={(event) => updateFilter("isActive", event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <div className="flex gap-2 md:col-span-2 xl:col-span-4">
              <Button type="submit">
                <Search className="size-4" />
                Apply filters
              </Button>

              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>

          <CardDescription>
            {isLoading
              ? "Loading users..."
              : `${response?.pagination.total ?? 0} user${
                  response?.pagination.total === 1 ? "" : "s"
                } found`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : response && response.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {response.data.map((user) => {
                      const projects = memberProjects(user);

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {getInitials(user.firstName, user.lastName)}
                              </div>

                              <div className="min-w-0">
                                <p className="font-medium">
                                  {user.firstName} {user.lastName}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>

                                {user.jobTitle && (
                                  <p className="text-xs text-muted-foreground">
                                    {user.jobTitle}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleClassName(
                                user.role,
                              )}`}
                            >
                              {getRoleLabel(user.role)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span
                              className={
                                user.isActive
                                  ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
                              }
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </TableCell>

                          <TableCell>
                            {user.manager ? (
                              <div className="text-sm">
                                <p>
                                  {user.manager.firstName}{" "}
                                  {user.manager.lastName}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Not assigned
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            {projects.length > 0 ? (
                              <div className="flex max-w-56 flex-wrap gap-1">
                                {projects.slice(0, 2).map(({ project }) => (
                                  <span
                                    key={project.id}
                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
                                  >
                                    <span
                                      className="size-2 rounded-full"
                                      style={{
                                        backgroundColor:
                                          project.color ?? "#64748b",
                                      }}
                                    />

                                    {project.name}
                                  </span>
                                ))}

                                {projects.length > 2 && (
                                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                    +{projects.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No projects
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Link
                              href={`/users/${user.id}/edit`}
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {response.pagination.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t pt-5">
                  <p className="text-sm text-muted-foreground">
                    Page {response.pagination.page} of{" "}
                    {response.pagination.totalPages}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= response.pagination.totalPages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <Users className="size-9 text-muted-foreground" />

              <h2 className="mt-4 font-semibold">No users found</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                No users match the selected filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
