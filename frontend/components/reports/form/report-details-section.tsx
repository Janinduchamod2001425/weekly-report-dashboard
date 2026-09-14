"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { CalendarDays } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReportFormValues } from "@/lib/validations/report";
import type { Project } from "@/types/reports";

import { FieldError, selectClassName, textareaClassName } from "./form-utils";

interface ReportDetailsSectionProps {
  projects: Project[];
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  disabled?: boolean;
}

export function ReportDetailsSection({
  projects,
  register,
  errors,
  disabled = false,
}: ReportDetailsSectionProps) {
  const activeProjects = projects.filter((project) => project.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-5" />
          Report details
        </CardTitle>

        <CardDescription>
          Select the primary project and reporting period.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="projectId">Main project</Label>

            <select
              id="projectId"
              disabled={disabled}
              {...register("projectId")}
              className={selectClassName}
            >
              <option value="">Select a project</option>

              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <FieldError message={errors.projectId?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekStart">Week start</Label>

            <Input
              id="weekStart"
              type="date"
              disabled={disabled}
              {...register("weekStart")}
            />

            <FieldError message={errors.weekStart?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekEnd">Week end</Label>

            <Input
              id="weekEnd"
              type="date"
              disabled={disabled}
              {...register("weekEnd")}
            />

            <FieldError message={errors.weekEnd?.message} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional notes</Label>

          <textarea
            id="notes"
            disabled={disabled}
            placeholder="Add useful context, decisions or anything your manager should know..."
            {...register("notes")}
            className={`${textareaClassName} min-h-32`}
          />

          <FieldError message={errors.notes?.message} />
        </div>
      </CardContent>
    </Card>
  );
}
