"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { CalendarPlus, Plus, Trash2 } from "lucide-react";

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

import { FieldError, selectClassName, textareaClassName } from "./form-utils";

interface NextWeekSectionProps {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  disabled?: boolean;
}

export function NextWeekSection({
  control,
  register,
  errors,
  disabled = false,
}: NextWeekSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "nextWeekTasks",
  });

  function addTask() {
    append({
      name: "",
      description: undefined,
      priority: "MEDIUM",
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5" />
            Next-week plan
          </CardTitle>

          <CardDescription className="mt-2">
            Add the tasks you plan to work on next week.
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
          Add
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <FieldError message={errors.nextWeekTasks?.root?.message} />

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <CalendarPlus className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">No next-week tasks</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add at least one planned task.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={disabled}
              onClick={addTask}
            >
              <Plus className="size-4" />
              Add first plan
            </Button>
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Planned task {index + 1}</p>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove planned task ${index + 1}`}
                  disabled={disabled || fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`next-week-${index}-name`}>Task name</Label>

                <Input
                  id={`next-week-${index}-name`}
                  disabled={disabled}
                  placeholder="Example: Complete dashboard testing"
                  {...register(`nextWeekTasks.${index}.name`)}
                />

                <FieldError
                  message={errors.nextWeekTasks?.[index]?.name?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`next-week-${index}-priority`}>Priority</Label>

                <select
                  id={`next-week-${index}-priority`}
                  disabled={disabled}
                  {...register(`nextWeekTasks.${index}.priority`)}
                  className={selectClassName}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>

                <FieldError
                  message={errors.nextWeekTasks?.[index]?.priority?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`next-week-${index}-description`}>
                  Description
                </Label>

                <textarea
                  id={`next-week-${index}-description`}
                  disabled={disabled}
                  placeholder="Optional details about this task..."
                  {...register(`nextWeekTasks.${index}.description`)}
                  className={textareaClassName}
                />

                <FieldError
                  message={errors.nextWeekTasks?.[index]?.description?.message}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
