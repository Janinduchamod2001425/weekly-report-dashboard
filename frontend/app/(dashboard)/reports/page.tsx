"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FilePlus2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { ApiError, apiRequest } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import type {
  MyReportListItem,
  MyReportsResponse,
  ReportStatus,
} from "@/types/reports";

const statusOptions: Array<{
  value: ReportStatus | "";
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "NEEDS_CORRECTION", label: "Needs correction" },
  { value: "APPROVED", label: "Approved" },
];

function formatDate(value: string) {
  return format(new Date(value), "dd MMM yyyy");
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<MyReportListItem[]>([]);
  const [pagination, setPagination] = useState<MyReportsResponse["pagination"]>(
    {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  );

  const [status, setStatus] = useState<ReportStatus | "">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (status) {
        params.set("status", status);
      }

      const response = await apiRequest<MyReportsResponse>(
        `/reports/my?${params.toString()}`,
      );

      setReports(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error("Failed to load your reports", {
        description:
          error instanceof ApiError
            ? error.message
            : "Please confirm the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function handleStatusChange(value: string) {
    setStatus(value as ReportStatus | "");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Reports</h1>
          <p className="text-muted-foreground">
            Create, review and track your weekly reports.
          </p>
        </div>

        <Link
          href="/reports/new"
          className={buttonVariants({
            variant: "default",
          })}
        >
          <FilePlus2 className="size-4" />
          Create report
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report history</CardTitle>
          <CardDescription>
            {loading
              ? "Loading reports..."
              : `${pagination.total} report${
                  pagination.total === 1 ? "" : "s"
                } found`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="report-status"
                className="mb-1.5 block text-sm font-medium"
              >
                Filter by status
              </label>

              <select
                id="report-status"
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {status && (
              <Button
                type="button"
                variant="outline"
                className="sm:mt-6"
                onClick={() => handleStatusChange("")}
              >
                <RotateCcw className="size-4" />
                Clear filter
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center">
              <Loader2 className="text-muted-foreground size-7 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <ClipboardList className="text-muted-foreground mb-4 size-10" />

              <h2 className="text-lg font-semibold">No reports found</h2>

              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                {status
                  ? "There are no reports matching the selected status."
                  : "You have not created a weekly report yet."}
              </p>

              {!status && (
                <Link
                  href="/reports/new"
                  className={buttonVariants({
                    className: "mt-5",
                  })}
                >
                  <FilePlus2 className="size-4" />
                  Create your first report
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-xl border p-4 transition-colors hover:bg-muted/30 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{report.project.name}</h2>

                        <ReportStatusBadge status={report.status} />
                      </div>

                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <CalendarDays className="size-4" />
                        <span>
                          {formatDate(report.weekStart)} –{" "}
                          {formatDate(report.weekEnd)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <span>{report._count.tasks} tasks</span>
                        <span>{report._count.achievements} achievements</span>
                        <span>{report._count.blockers} blockers</span>
                        <span>{report._count.versions} versions</span>
                      </div>

                      {report.status === "NEEDS_CORRECTION" &&
                        report.latestReviewerComment && (
                          <div className="flex max-w-2xl gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />

                            <div>
                              <p className="font-medium">Changes requested</p>
                              <p className="mt-1">
                                {report.latestReviewerComment}
                              </p>
                            </div>
                          </div>
                        )}

                      {report.status === "APPROVED" && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-4" />
                          Approved
                          {report.approvedAt
                            ? ` on ${formatDate(report.approvedAt)}`
                            : ""}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      {(report.status === "DRAFT" ||
                        report.status === "NEEDS_CORRECTION") && (
                        <Link
                          href={`/reports/${report.id}/edit`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          Edit
                        </Link>
                      )}

                      <Link
                        href={`/reports/${report.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <Eye className="size-4" />
                        View
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
