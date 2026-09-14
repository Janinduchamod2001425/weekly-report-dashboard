"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileClock,
  FileText,
  Loader2,
  Pencil,
  Send,
  Target,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiRequest } from "@/lib/api";
import type { MyReportDetail, ReportVersion } from "@/types/reports";

function formatDate(value: string): string {
  return format(new Date(value), "dd MMM yyyy");
}

function formatDateTime(value: string): string {
  return format(new Date(value), "dd MMM yyyy, h:mm a");
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getReportId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function VersionHistoryItem({ version }: { version: ReportVersion }) {
  return (
    <details className="rounded-lg border">
      <summary className="cursor-pointer list-none p-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium">Version {version.versionNumber}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Submitted {formatDateTime(version.submittedAt)}
            </p>
          </div>

          {version.reviewAction && (
            <span
              className={
                version.reviewAction.action === "APPROVED"
                  ? "w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }
            >
              {version.reviewAction.action === "APPROVED"
                ? "Approved"
                : "Changes requested"}
            </span>
          )}
        </div>
      </summary>

      <div className="space-y-4 border-t p-4">
        {version.reviewAction ? (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-sm font-medium">
              Reviewed by {version.reviewAction.reviewer.firstName}{" "}
              {version.reviewAction.reviewer.lastName}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateTime(version.reviewAction.createdAt)}
            </p>

            {version.reviewAction.comment && (
              <p className="mt-3 text-sm">{version.reviewAction.comment}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This version has not been reviewed yet.
          </p>
        )}

        {version.content.tasks && version.content.tasks.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Submitted tasks</p>

            <div className="space-y-2">
              {version.content.tasks.map((task, index) => (
                <div
                  key={`${task.name}-${index}`}
                  className="rounded-md border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{task.name}</p>

                    <span className="text-xs text-muted-foreground">
                      {task.actualPercentage}% completed
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatEnumLabel(task.priority)} ·{" "}
                    {formatEnumLabel(task.status)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {version.content.notes && (
          <div>
            <p className="mb-1 text-sm font-medium">Submitted notes</p>

            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {version.content.notes}
            </p>
          </div>
        )}
      </div>
    </details>
  );
}

export default function MyReportDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const reportId = getReportId(params.id);

  const [report, setReport] = useState<MyReportDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReport = useCallback(async () => {
    if (!reportId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest<MyReportDetail>(`/reports/${reportId}`);

      setReport(response);
    } catch (error) {
      setReport(null);

      toast.error("Unable to load the report", {
        description:
          error instanceof ApiError
            ? error.message
            : "Please confirm that the backend server is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const canEdit = useMemo(() => {
    return report?.status === "DRAFT" || report?.status === "NEEDS_CORRECTION";
  }, [report]);

  const totalTrackedMinutes = useMemo(() => {
    if (!report) {
      return 0;
    }

    return report.timeEntries.reduce(
      (total, entry) => total + entry.minutes,
      0,
    );
  }, [report]);

  async function submitReport() {
    if (!reportId || !report || !canEdit) {
      return;
    }

    const confirmed = window.confirm(
      "Submit this weekly report for manager review? You will not be able to edit it while it is under review.",
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest(`/reports/${reportId}/submit`, {
        method: "POST",
      });

      toast.success("Report submitted successfully", {
        description: "Your manager can now review this report.",
      });

      await loadReport();
    } catch (error) {
      toast.error("Unable to submit the report", {
        description:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span>Loading report...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-5">
        <Link
          href="/reports"
          className={buttonVariants({
            variant: "outline",
          })}
        >
          <ArrowLeft className="size-4" />
          Back to reports
        </Link>

        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <FileText className="mb-4 size-10 text-muted-foreground" />

            <h1 className="text-xl font-semibold">Report not found</h1>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This report does not exist, or you do not have permission to view
              it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
        })}
      >
        <ArrowLeft className="size-4" />
        Back to reports
      </Link>

      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {report.project.name}
            </h1>

            <ReportStatusBadge status={report.status} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />

            <span>
              {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
            </span>
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/reports/${report.id}/edit`}
              className={buttonVariants({
                variant: "outline",
              })}
            >
              <Pencil className="size-4" />
              Edit report
            </Link>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitReport()}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}

              {isSubmitting ? "Submitting..." : "Submit report"}
            </Button>
          </div>
        )}
      </header>

      {report.status === "NEEDS_CORRECTION" && report.latestReviewerComment && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />

          <div>
            <p className="font-semibold">Your manager requested changes</p>

            <p className="mt-1 text-sm">{report.latestReviewerComment}</p>

            <p className="mt-2 text-xs">
              Update the report and submit a corrected version.
            </p>
          </div>
        </div>
      )}

      {report.status === "SUBMITTED" && (
        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          <FileClock className="mt-0.5 size-5 shrink-0" />

          <div>
            <p className="font-semibold">Waiting for manager review</p>

            <p className="mt-1 text-sm">
              This report cannot be edited until the manager completes the
              review.
            </p>
          </div>
        </div>
      )}

      {report.status === "APPROVED" && (
        <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

          <div>
            <p className="font-semibold">Report approved</p>

            <p className="mt-1 text-sm">
              Your manager approved this weekly report
              {report.approvedAt
                ? ` on ${formatDateTime(report.approvedAt)}`
                : ""}
              .
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Target className="size-5" />
            </div>

            <div>
              <p className="text-2xl font-semibold">{report.tasks.length}</p>

              <p className="text-sm text-muted-foreground">Completed tasks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Trophy className="size-5" />
            </div>

            <div>
              <p className="text-2xl font-semibold">
                {report.achievements.length}
              </p>

              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertCircle className="size-5" />
            </div>

            <div>
              <p className="text-2xl font-semibold">{report.blockers.length}</p>

              <p className="text-sm text-muted-foreground">Blockers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Clock3 className="size-5" />
            </div>

            <div>
              <p className="text-2xl font-semibold">
                {formatMinutes(totalTrackedMinutes)}
              </p>

              <p className="text-sm text-muted-foreground">Time recorded</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tasks completed this week</CardTitle>

          <CardDescription>
            Planned and actual progress for the reporting week.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {report.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks were added to this report.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {report.tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.name}</p>

                          {task.deliverable && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {task.deliverable}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {task.project?.name ?? report.project.name}
                      </TableCell>

                      <TableCell>{formatEnumLabel(task.priority)}</TableCell>

                      <TableCell>{formatEnumLabel(task.status)}</TableCell>

                      <TableCell className="whitespace-nowrap">
                        {task.actualPercentage}% / {task.plannedPercentage}%
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatMinutes(task.actualMinutes)} /{" "}
                        {formatMinutes(task.plannedMinutes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next-week plan</CardTitle>

            <CardDescription>
              Tasks planned for the following reporting week.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {report.nextWeekTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No next-week tasks were added.
              </p>
            ) : (
              <div className="space-y-3">
                {report.nextWeekTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-medium">{task.name}</p>

                      <span className="text-xs text-muted-foreground">
                        {formatEnumLabel(task.priority)}
                      </span>
                    </div>

                    {task.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>

            <CardDescription>
              Important outcomes achieved during the week.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {report.achievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No achievements were added.
              </p>
            ) : (
              <div className="space-y-3">
                {report.achievements.map((achievement) => (
                  <div key={achievement.id} className="rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="size-4 text-emerald-600" />

                      <p className="font-medium">{achievement.title}</p>
                    </div>

                    {achievement.isKeyAchievement && (
                      <p className="mt-2 text-xs font-medium text-emerald-600">
                        Key achievement
                      </p>
                    )}

                    {achievement.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blockers and issues</CardTitle>

          <CardDescription>
            Problems that affected progress during this week.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {report.blockers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blockers were reported.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {report.blockers.map((blocker) => (
                <div key={blocker.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{blocker.title}</p>

                    <span
                      className={
                        blocker.isResolved
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
                      }
                    >
                      {blocker.isResolved ? "Resolved" : "Open"}
                    </span>

                    {blocker.isKeyIssue && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        Key issue
                      </span>
                    )}
                  </div>

                  {blocker.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {blocker.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time breakdown</CardTitle>

            <CardDescription>
              Recorded time grouped by task category.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {report.timeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No time entries were added.
              </p>
            ) : (
              <div className="space-y-3">
                {report.timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <p className="text-sm font-medium">
                      {formatEnumLabel(entry.taskType)}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {formatMinutes(entry.minutes)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report links</CardTitle>

            <CardDescription>
              Deliverables, documentation and related resources.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {report.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No links were added.
              </p>
            ) : (
              <div className="space-y-3">
                {report.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium">{link.label}</span>

                    <ExternalLink className="size-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {report.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional notes</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {report.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Version history</CardTitle>

          <CardDescription>
            Every submitted version and its manager review result.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {report.versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This report has not been submitted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {report.versions.map((version) => (
                <VersionHistoryItem key={version.id} version={version} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
