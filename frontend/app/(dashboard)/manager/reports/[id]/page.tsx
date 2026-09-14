"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flag,
  FolderKanban,
  History,
  LoaderCircle,
  RotateCcw,
  Trophy,
  UserRound,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api";
import type { ManagerReportDetail, ReportVersion } from "@/types/reports";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
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

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function VersionHistoryItem({ version }: { version: ReportVersion }) {
  return (
    <details className="group rounded-xl border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
        <div>
          <p className="font-medium">Version {version.versionNumber}</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatDateTime(version.submittedAt)}
          </p>
        </div>

        {version.reviewAction ? (
          <Badge
            variant="outline"
            className={
              version.reviewAction.action === "APPROVED"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {version.reviewAction.action === "APPROVED"
              ? "Approved"
              : "Changes Requested"}
          </Badge>
        ) : (
          <Badge variant="outline">Awaiting Review</Badge>
        )}
      </summary>

      <div className="space-y-5 border-t p-4">
        {version.content.notes && (
          <div>
            <p className="text-sm font-medium">Notes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {version.content.notes}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium">Submitted tasks</p>

          <div className="mt-2 space-y-2">
            {version.content.tasks?.map((task, index) => (
              <div
                key={`${version.id}-task-${index}`}
                className="rounded-lg bg-muted/50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{task.name}</p>

                  <Badge variant="outline">{formatEnum(task.status)}</Badge>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Planned {task.plannedPercentage}% · Actual{" "}
                  {task.actualPercentage}% · {formatMinutes(task.actualMinutes)}
                </p>

                {task.deliverable && (
                  <p className="mt-2 text-sm">
                    Deliverable: {task.deliverable}
                  </p>
                )}
              </div>
            )) ?? (
              <p className="text-sm text-muted-foreground">
                No tasks recorded.
              </p>
            )}
          </div>
        </div>

        {version.reviewAction && (
          <div
            className={
              version.reviewAction.action === "APPROVED"
                ? "rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                : "rounded-lg border border-amber-200 bg-amber-50 p-4"
            }
          >
            <p className="text-sm font-medium">Manager review</p>

            <p className="mt-1 text-sm">
              {version.reviewAction.comment ?? "No review comment provided."}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {version.reviewAction.reviewer.firstName}{" "}
              {version.reviewAction.reviewer.lastName} ·{" "}
              {formatDateTime(version.reviewAction.createdAt)}
            </p>
          </div>
        )}
      </div>
    </details>
  );
}

function DetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ManagerReportDetailPage() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const [report, setReport] = useState<ManagerReportDetail | null>(null);

  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [reviewAction, setReviewAction] = useState<
    "approve" | "request-changes" | null
  >(null);

  const loadReport = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiRequest<ManagerReportDetail>(
        `/manager/reports/${reportId}`,
      );

      setReport(response);
    } catch (error) {
      toast.error("Unable to load report", {
        description:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  async function requestChanges() {
    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      toast.error("A correction comment is required");
      return;
    }

    setReviewAction("request-changes");

    try {
      await apiRequest(`/manager/reports/${reportId}/request-changes`, {
        method: "POST",
        body: {
          comment: trimmedComment,
        },
      });

      toast.success("Report returned for correction");
      setComment("");
      await loadReport();
    } catch (error) {
      toast.error("Unable to request changes", {
        description:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setReviewAction(null);
    }
  }

  async function approveReport() {
    setReviewAction("approve");

    try {
      await apiRequest(`/manager/reports/${reportId}/approve`, {
        method: "POST",
        body: {
          comment: comment.trim() || undefined,
        },
      });

      toast.success("Report approved successfully");
      setComment("");
      await loadReport();
    } catch (error) {
      toast.error("Unable to approve report", {
        description:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setReviewAction(null);
    }
  }

  if (isLoading && !report) {
    return <DetailLoading />;
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="flex min-h-80 flex-col items-center justify-center">
          <AlertTriangle className="size-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Report unavailable</h1>
          <Link
            href="/manager/reports"
            className="mt-5 text-sm font-medium text-primary hover:underline"
          >
            Return to team reports
          </Link>
        </CardContent>
      </Card>
    );
  }

  const totalMinutes = report.timeEntries.reduce(
    (total, entry) => total + entry.minutes,
    0,
  );

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/manager/reports"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to team reports
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                Weekly Report
              </h1>

              <ReportStatusBadge status={report.status} />
            </div>

            <p className="mt-2 text-muted-foreground">
              {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadReport()}
            disabled={isLoading}
          >
            <RotateCcw
              className={isLoading ? "size-4 animate-spin" : "size-4"}
            />
            Refresh
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <UserRound className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Team member</p>
              <p className="font-medium">
                {report.author.firstName} {report.author.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {report.author.jobTitle}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <FolderKanban className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Primary project</p>
              <p className="font-medium">{report.project.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Clock3 className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">
                Total recorded time
              </p>
              <p className="font-medium">{formatMinutes(totalMinutes)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {report.latestReviewerComment && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-amber-600" />
              Latest manager comment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{report.latestReviewerComment}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tasks completed</CardTitle>
          <CardDescription>
            Planned progress compared with actual delivery.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Deliverable</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {report.tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatEnum(task.status)}
                      </p>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {formatEnum(task.priority)}
                      </Badge>
                    </TableCell>

                    <TableCell className="min-w-48">
                      <div className="flex justify-between text-xs">
                        <span>Planned {task.plannedPercentage}%</span>
                        <span>Actual {task.actualPercentage}%</span>
                      </div>
                      <Progress
                        value={task.actualPercentage}
                        className="mt-2"
                      />
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm">
                      {formatMinutes(task.actualMinutes)}
                      <span className="block text-xs text-muted-foreground">
                        Planned {formatMinutes(task.plannedMinutes)}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-64">
                      {task.deliverable ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              Next week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.nextWeekTasks.map((task) => (
              <div key={task.id} className="rounded-lg border p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-medium">{task.name}</p>
                  <Badge variant="outline">{formatEnum(task.priority)}</Badge>
                </div>
                {task.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Blockers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.blockers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No blockers reported.
              </p>
            ) : (
              report.blockers.map((blocker) => (
                <div key={blocker.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{blocker.title}</p>
                    {blocker.isKeyIssue && (
                      <Badge variant="destructive">
                        <Flag className="size-3" />
                        Key issue
                      </Badge>
                    )}
                    {blocker.isResolved && (
                      <Badge variant="outline">Resolved</Badge>
                    )}
                  </div>
                  {blocker.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {blocker.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {report.achievements.map((achievement) => (
            <div key={achievement.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{achievement.title}</p>
                {achievement.isKeyAchievement && (
                  <Badge variant="outline">Key achievement</Badge>
                )}
              </div>
              {achievement.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {achievement.description}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {(report.notes || report.links.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes and links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.notes && (
              <p className="text-sm leading-6">{report.notes}</p>
            )}

            {report.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-4" />
                {link.label}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {report.status === "SUBMITTED" && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Manager review</CardTitle>
            <CardDescription>
              Approve this report or return it with a clear correction comment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewComment">Review comment</Label>
              <Textarea
                id="reviewComment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Explain any required corrections, or add an optional approval note."
                rows={5}
                maxLength={2000}
              />
              <p className="text-right text-xs text-muted-foreground">
                {comment.length}/2000
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={reviewAction !== null}
                onClick={() => void requestChanges()}
              >
                {reviewAction === "request-changes" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
                Request changes
              </Button>

              <Button
                type="button"
                disabled={reviewAction !== null}
                onClick={() => void approveReport()}
              >
                {reviewAction === "approve" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Approve report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5" />
            Version history
          </CardTitle>
          <CardDescription>
            Every submitted version and its associated manager review are
            preserved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {report.versions.map((version) => (
            <VersionHistoryItem key={version.id} version={version} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
