"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { ListChecks, Plus, Trash2 } from "lucide-react";

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
import type { ReportFormValues } from "@/lib/validations/report";
import type { Project } from "@/types/reports";

import { FieldError, selectClassName } from "./form-utils";

interface TasksSectionProps {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  projects: Project[];
  disabled?: boolean;
}

export function TasksSection({
  control,
  register,
  errors,
  projects,
  disabled = false,
}: TasksSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "tasks",
  });

  const activeProjects = projects.filter((project) => project.isActive);

  function addTask() {
    append({
      name: "",
      projectId: undefined,
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      plannedPercentage: 100,
      actualPercentage: 0,
      plannedMinutes: 0,
      actualMinutes: 0,
      deliverable: undefined,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-5" />
            Tasks completed this week
          </CardTitle>

          <CardDescription className="mt-2">
            Compare planned work with actual progress and time spent.
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addTask}
        >
          <Plus className="size-4" />
          Add task
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <FieldError message={errors.tasks?.root?.message} />

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <ListChecks className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">No tasks added</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add at least one task before submitting the report.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={disabled}
              onClick={addTask}
            >
              <Plus className="size-4" />
              Add first task
            </Button>
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="space-y-5 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Task {index + 1}</p>

                  <p className="text-xs text-muted-foreground">
                    Add the progress and time information for this task.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove task ${index + 1}`}
                  disabled={disabled || fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`tasks-${index}-name`}>Task name</Label>

                  <Input
                    id={`tasks-${index}-name`}
                    disabled={disabled}
                    placeholder="Example: Implemented user authentication"
                    {...register(`tasks.${index}.name`)}
                  />

                  <FieldError message={errors.tasks?.[index]?.name?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-project`}>
                    Related project
                  </Label>

                  <select
                    id={`tasks-${index}-project`}
                    disabled={disabled}
                    {...register(`tasks.${index}.projectId`)}
                    className={selectClassName}
                  >
                    <option value="">Use main report project</option>

                    {activeProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  <FieldError
                    message={errors.tasks?.[index]?.projectId?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-priority`}>Priority</Label>

                  <select
                    id={`tasks-${index}-priority`}
                    disabled={disabled}
                    {...register(`tasks.${index}.priority`)}
                    className={selectClassName}
                  >
                    <option value="LOW">Low</option>

                    <option value="MEDIUM">Medium</option>

                    <option value="HIGH">High</option>

                    <option value="CRITICAL">Critical</option>
                  </select>

                  <FieldError
                    message={errors.tasks?.[index]?.priority?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-status`}>Status</Label>

                  <select
                    id={`tasks-${index}-status`}
                    disabled={disabled}
                    {...register(`tasks.${index}.status`)}
                    className={selectClassName}
                  >
                    <option value="NOT_STARTED">Not started</option>

                    <option value="IN_PROGRESS">In progress</option>

                    <option value="COMPLETED">Completed</option>

                    <option value="BLOCKED">Blocked</option>
                  </select>

                  <FieldError
                    message={errors.tasks?.[index]?.status?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-deliverable`}>
                    Deliverable
                  </Label>

                  <Input
                    id={`tasks-${index}-deliverable`}
                    disabled={disabled}
                    placeholder="Pull request, document or result"
                    {...register(`tasks.${index}.deliverable`)}
                  />

                  <FieldError
                    message={errors.tasks?.[index]?.deliverable?.message}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-planned-percentage`}>
                    Planned progress (%)
                  </Label>

                  <Input
                    id={`tasks-${index}-planned-percentage`}
                    type="number"
                    min={0}
                    max={100}
                    disabled={disabled}
                    {...register(`tasks.${index}.plannedPercentage`, {
                      valueAsNumber: true,
                    })}
                  />

                  <FieldError
                    message={errors.tasks?.[index]?.plannedPercentage?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-actual-percentage`}>
                    Actual progress (%)
                  </Label>

                  <Input
                    id={`tasks-${index}-actual-percentage`}
                    type="number"
                    min={0}
                    max={100}
                    disabled={disabled}
                    {...register(`tasks.${index}.actualPercentage`, {
                      valueAsNumber: true,
                    })}
                  />

                  <FieldError
                    message={errors.tasks?.[index]?.actualPercentage?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-planned-minutes`}>
                    Planned minutes
                  </Label>

                  <Input
                    id={`tasks-${index}-planned-minutes`}
                    type="number"
                    min={0}
                    disabled={disabled}
                    {...register(`tasks.${index}.plannedMinutes`, {
                      valueAsNumber: true,
                    })}
                  />

                  <FieldError
                    message={errors.tasks?.[index]?.plannedMinutes?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tasks-${index}-actual-minutes`}>
                    Actual minutes
                  </Label>

                  <Input
                    id={`tasks-${index}-actual-minutes`}
                    type="number"
                    min={0}
                    disabled={disabled}
                    {...register(`tasks.${index}.actualMinutes`, {
                      valueAsNumber: true,
                    })}
                  />

                  <FieldError
                    message={errors.tasks?.[index]?.actualMinutes?.message}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
