"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { ReportForm } from "@/components/reports/form/report-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, apiRequest } from "@/lib/api";
import type { ReportFormValues } from "@/lib/validations/report";
import type { MyReportDetail, Project } from "@/types/reports";

interface UpdateReportResponse {
  message?: string;
  report?: MyReportDetail;
}

function getParameterId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

function mapReportToFormValues(report: MyReportDetail): ReportFormValues {
  return {
    projectId: report.project.id,
    weekStart: toDateInputValue(report.weekStart),
    weekEnd: toDateInputValue(report.weekEnd),
    notes: report.notes ?? undefined,

    tasks: report.tasks.map((task) => ({
      name: task.name,
      projectId: task.project?.id ?? undefined,
      priority: task.priority as ReportFormValues["tasks"][number]["priority"],
      status: task.status as ReportFormValues["tasks"][number]["status"],
      plannedPercentage: task.plannedPercentage,
      actualPercentage: task.actualPercentage,
      plannedMinutes: task.plannedMinutes,
      actualMinutes: task.actualMinutes,
      deliverable: task.deliverable ?? undefined,
    })),

    nextWeekTasks: report.nextWeekTasks.map((task) => ({
      name: task.name,
      description: task.description ?? undefined,
      priority:
        task.priority as ReportFormValues["nextWeekTasks"][number]["priority"],
    })),

    blockers: report.blockers.map((blocker) => ({
      title: blocker.title,
      description: blocker.description ?? undefined,
      isKeyIssue: blocker.isKeyIssue,
      isResolved: blocker.isResolved,
    })),

    achievements: report.achievements.map((achievement) => ({
      title: achievement.title,
      description: achievement.description ?? undefined,
      isKeyAchievement: achievement.isKeyAchievement,
    })),

    timeEntries: report.timeEntries.map((entry) => ({
      taskType:
        entry.taskType as ReportFormValues["timeEntries"][number]["taskType"],
      minutes: entry.minutes,
    })),

    links: report.links.map((link) => ({
      label: link.label,
      url: link.url,
    })),
  };
}

export default function EditReportPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();
  const reportId = getParameterId(params.id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [report, setReport] = useState<MyReportDetail | null>(null);

  const [initialValues, setInitialValues] = useState<ReportFormValues | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPageData = useCallback(async () => {
    if (!reportId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [reportResponse, projectsResponse] = await Promise.all([
        apiRequest<MyReportDetail>(`/reports/${reportId}`),
        apiRequest<Project[]>("/projects"),
      ]);

      setReport(reportResponse);
      setProjects(projectsResponse);
      setInitialValues(mapReportToFormValues(reportResponse));
    } catch (error) {
      setReport(null);
      setInitialValues(null);

      toast.error("Unable to load report", {
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
    void loadPageData();
  }, [loadPageData]);

  async function updateReport(values: ReportFormValues): Promise<void> {
    if (!reportId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<UpdateReportResponse>(
        `/reports/${reportId}`,
        {
          method: "PATCH",
          body: values,
        },
      );

      toast.success("Report updated", {
        description:
          response.message ?? "Your changes were saved successfully.",
      });

      router.push(`/reports/${reportId}`);
      router.refresh();
    } catch (error) {
      toast.error("Unable to update report", {
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
          <span>Loading report editor...</span>
        </div>
      </div>
    );
  }

  if (!report || !initialValues) {
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
            <AlertCircle className="mb-4 size-10 text-muted-foreground" />

            <h1 className="text-xl font-semibold">Report unavailable</h1>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              The report does not exist, or you do not have permission to edit
              it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit =
    report.status === "DRAFT" || report.status === "NEEDS_CORRECTION";

  if (!canEdit) {
    return (
      <div className="space-y-5">
        <Link
          href={`/reports/${report.id}`}
          className={buttonVariants({
            variant: "outline",
          })}
        >
          <ArrowLeft className="size-4" />
          Back to report
        </Link>

        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <AlertCircle className="mb-4 size-10 text-amber-500" />

            <h1 className="text-xl font-semibold">
              This report cannot be edited
            </h1>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Only Draft and Needs Correction reports can be edited. This report
              currently has the{" "}
              {report.status.toLowerCase().replaceAll("_", " ")} status.
            </p>

            <Link
              href={`/reports/${report.id}`}
              className={buttonVariants({
                className: "mt-5",
              })}
            >
              View report
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/reports/${report.id}`}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
          })}
        >
          <ArrowLeft className="size-4" />
          Back to report
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Pencil className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit weekly report
            </h1>

            <p className="mt-1 text-muted-foreground">
              Update the report for {report.project.name}.
            </p>
          </div>
        </div>
      </header>

      {report.status === "NEEDS_CORRECTION" && report.latestReviewerComment && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />

          <div>
            <p className="font-semibold">Manager feedback</p>

            <p className="mt-1 text-sm">{report.latestReviewerComment}</p>
          </div>
        </div>
      )}

      <ReportForm
        mode="edit"
        projects={projects}
        initialValues={initialValues}
        isSubmitting={isSubmitting}
        onSubmit={updateReport}
      />
    </div>
  );
}
