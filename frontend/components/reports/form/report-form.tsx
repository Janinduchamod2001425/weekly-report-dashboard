"use client";

import Link from "next/link";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  reportFormSchema,
  type ReportFormValues,
} from "@/lib/validations/report";
import type { Project } from "@/types/reports";

import { AchievementsSection } from "./achievements-section";
import { BlockersSection } from "./blockers-section";
import { LinksSection } from "./links-section";
import { NextWeekSection } from "./next-week-section";
import { ReportDetailsSection } from "./report-details-section";
import { TasksSection } from "./tasks-section";
import { TimeEntriesSection } from "./time-entries-section";

interface ReportFormProps {
  mode: "create" | "edit";
  projects: Project[];
  initialValues: ReportFormValues;
  isSubmitting: boolean;
  onSubmit: (values: ReportFormValues) => Promise<void>;
}

export function ReportForm({
  mode,
  projects,
  initialValues,
  isSubmitting,
  onSubmit,
}: ReportFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  async function submitForm(values: ReportFormValues) {
    await onSubmit(values);
  }

  return (
    <form noValidate onSubmit={handleSubmit(submitForm)} className="space-y-6">
      <ReportDetailsSection
        projects={projects}
        register={register}
        errors={errors}
        disabled={isSubmitting}
      />

      <TasksSection
        control={control}
        register={register}
        errors={errors}
        projects={projects}
        disabled={isSubmitting}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <NextWeekSection
          control={control}
          register={register}
          errors={errors}
          disabled={isSubmitting}
        />

        <AchievementsSection
          control={control}
          register={register}
          errors={errors}
          disabled={isSubmitting}
        />
      </div>

      <BlockersSection
        control={control}
        register={register}
        errors={errors}
        disabled={isSubmitting}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TimeEntriesSection
          control={control}
          register={register}
          errors={errors}
          disabled={isSubmitting}
        />

        <LinksSection
          control={control}
          register={register}
          errors={errors}
          disabled={isSubmitting}
        />
      </div>

      <div className="sticky bottom-4 z-10 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">
              {mode === "create"
                ? "Create report draft"
                : "Update report draft"}
            </p>

            <p className="text-xs text-muted-foreground">
              {isDirty ? "You have unsaved changes." : "No unsaved changes."}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link
              href="/reports"
              aria-disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              Cancel
            </Link>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}

              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Save draft"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
