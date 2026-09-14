"use client";

import Link from "next/link";
import {
  ClipboardList,
  Filter,
  LoaderCircle,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiRequest } from "@/lib/api";
import type {
  ManagerReportsResponse,
  Project,
  UsersResponse,
} from "@/types/reports";

interface ReportFilters {
  teamMemberId: string;
  projectId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const initialFilters: ReportFilters = {
  teamMemberId: "",
  projectId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TeamReportsPage() {
  const [reports, setReports] = useState<ManagerReportsResponse | null>(null);

  const [members, setMembers] = useState<UsersResponse["data"]>([]);

  const [projects, setProjects] = useState<Project[]>([]);

  const [filters, setFilters] = useState<ReportFilters>(initialFilters);

  const [appliedFilters, setAppliedFilters] =
    useState<ReportFilters>(initialFilters);

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        apiRequest<UsersResponse>(
          "/users?page=1&limit=50&role=TEAM_MEMBER&isActive=true",
        ),
        apiRequest<Project[]>("/projects"),
      ]);

      setMembers(usersResponse.data);
      setProjects(projectsResponse);
    } catch (error) {
      toast.error("Unable to load report filters", {
        description:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  }, []);

  const loadReports = useCallback(async () => {
    setIsLoading(true);

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (appliedFilters.teamMemberId) {
        query.set("teamMemberId", appliedFilters.teamMemberId);
      }

      if (appliedFilters.projectId) {
        query.set("projectId", appliedFilters.projectId);
      }

      if (appliedFilters.status) {
        query.set("status", appliedFilters.status);
      }

      if (appliedFilters.dateFrom) {
        query.set("dateFrom", appliedFilters.dateFrom);
      }

      if (appliedFilters.dateTo) {
        query.set("dateTo", appliedFilters.dateTo);
      }

      const response = await apiRequest<ManagerReportsResponse>(
        `/manager/reports?${query.toString()}`,
      );

      setReports(response);
    } catch (error) {
      toast.error("Unable to load team reports", {
        description:
          error instanceof ApiError
            ? error.message
            : "Please confirm the backend is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function updateFilter(field: keyof ReportFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Team Reports</h1>

        <p className="mt-2 text-muted-foreground">
          Review weekly reports submitted across the entire team.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Report filters
          </CardTitle>

          <CardDescription>
            Filter by team member, project, status or reporting period.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={applyFilters}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <div className="space-y-2">
              <Label htmlFor="teamMember">Team member</Label>

              <select
                id="teamMember"
                value={filters.teamMemberId}
                onChange={(event) =>
                  updateFilter("teamMemberId", event.target.value)
                }
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">All members</option>

                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>

              <select
                id="project"
                value={filters.projectId}
                onChange={(event) =>
                  updateFilter("projectId", event.target.value)
                }
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">All projects</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>

              <select
                id="status"
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="NEEDS_CORRECTION">Needs Correction</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From</Label>

              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  updateFilter("dateFrom", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To</Label>

              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
              />
            </div>

            <div className="flex gap-2 md:col-span-2 xl:col-span-5">
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
          <CardTitle>Reports</CardTitle>

          <CardDescription>
            {reports
              ? `${reports.pagination.total} reports found`
              : "Loading reports..."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : reports && reports.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team member</TableHead>
                      <TableHead>Week</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contents</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {reports.data.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {report.author.firstName} {report.author.lastName}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {report.author.jobTitle ?? report.author.email}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {formatDate(report.weekStart)}
                          <span className="block text-xs text-muted-foreground">
                            to {formatDate(report.weekEnd)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  report.project.color ?? "#64748B",
                              }}
                            />

                            {report.project.name}
                          </div>
                        </TableCell>

                        <TableCell>
                          <ReportStatusBadge status={report.status} />
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {report._count.tasks} tasks · {report._count.blockers}{" "}
                          blockers
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {report.submittedAt
                            ? formatDateTime(report.submittedAt)
                            : "Not submitted"}
                        </TableCell>

                        <TableCell className="text-right">
                          {report.status === "DRAFT" ? (
                            <span className="text-sm text-muted-foreground">
                              Private draft
                            </span>
                          ) : (
                            <Link
                              href={`/manager/reports/${report.id}`}
                              className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
                            >
                              {report.status === "SUBMITTED"
                                ? "Review"
                                : "View"}
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {reports.pagination.page} of{" "}
                  {Math.max(reports.pagination.totalPages, 1)}
                </p>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= reports.pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4">
                <ClipboardList className="size-7 text-muted-foreground" />
              </div>

              <h2 className="mt-4 font-semibold">No reports found</h2>

              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                No reports match the selected filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
