"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ReportForm } from "@/components/reports/form/report-form";
import { ApiError, apiRequest } from "@/lib/api";
import {
  defaultReportFormValues,
  type ReportFormValues,
} from "@/lib/validations/report";
import type { Project } from "@/types/reports";

interface CreatedReport {
  id: string;
}

interface CreateReportResponse {
  message?: string;
  report?: CreatedReport;
  id?: string;
}

function getCurrentWeekDates() {
  const today = new Date();

  const weekStart = startOfWeek(today, {
    weekStartsOn: 1,
  });

  const weekEnd = endOfWeek(today, {
    weekStartsOn: 1,
  });

  return {
    weekStart: format(weekStart, "yyyy-MM-dd"),
    weekEnd: format(weekEnd, "yyyy-MM-dd"),
  };
}

export default function CreateReportPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = useMemo<ReportFormValues>(() => {
    const currentWeek = getCurrentWeekDates();

    return {
      ...defaultReportFormValues,
      weekStart: currentWeek.weekStart,
      weekEnd: currentWeek.weekEnd,
    };
  }, []);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiRequest<Project[]>("/projects");

      setProjects(response.filter((project) => project.isActive));
    } catch (error) {
      toast.error("Unable to load projects", {
        description:
          error instanceof ApiError
            ? error.message
            : "Please confirm that the backend server is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function createReport(values: ReportFormValues): Promise<void> {
    setIsSubmitting(true);

    try {
      const response = await apiRequest<CreateReportResponse>("/reports", {
        method: "POST",
        body: values,
      });

      toast.success("Report draft created", {
        description:
          response.message ?? "Your weekly report was saved successfully.",
      });

      const createdReportId = response.report?.id ?? response.id;

      if (createdReportId) {
        router.push(`/reports/${createdReportId}`);
      } else {
        router.push("/reports");
      }

      router.refresh();
    } catch (error) {
      toast.error("Unable to create report", {
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
          <span>Preparing report form...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <FilePlus2 className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Create weekly report
            </h1>

            <p className="mt-1 text-muted-foreground">
              Record your progress, achievements and plans for the week.
            </p>
          </div>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-semibold">No active projects available</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            You must be assigned to an active project before creating a weekly
            report.
          </p>
        </div>
      ) : (
        <ReportForm
          mode="create"
          projects={projects}
          initialValues={initialValues}
          isSubmitting={isSubmitting}
          onSubmit={createReport}
        />
      )}
    </div>
  );
}
