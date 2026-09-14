"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Clock3, Plus, Trash2 } from "lucide-react";

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

import { FieldError, selectClassName } from "./form-utils";

interface TimeEntriesSectionProps {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  disabled?: boolean;
}

export function TimeEntriesSection({
  control,
  register,
  errors,
  disabled = false,
}: TimeEntriesSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "timeEntries",
  });

  function addTimeEntry() {
    append({
      taskType: "DEVELOPMENT",
      minutes: 60,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="size-5" />
            Time entries
          </CardTitle>

          <CardDescription className="mt-2">
            Record the time spent on each category of work.
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addTimeEntry}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Clock3 className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">No time entries</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add time entries to summarize your weekly workload.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={disabled}
              onClick={addTimeEntry}
            >
              <Plus className="size-4" />
              Add time entry
            </Button>
          </div>
        ) : (
          fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_160px_auto] sm:items-start"
            >
              <div className="space-y-2">
                <Label htmlFor={`time-entry-${index}-type`}>
                  Work category
                </Label>

                <select
                  id={`time-entry-${index}-type`}
                  disabled={disabled}
                  {...register(`timeEntries.${index}.taskType`)}
                  className={selectClassName}
                >
                  <option value="DEVELOPMENT">Development</option>

                  <option value="MEETING">Meeting</option>

                  <option value="RESEARCH">Research</option>

                  <option value="TESTING">Testing</option>

                  <option value="DOCUMENTATION">Documentation</option>

                  <option value="DESIGN">Design</option>

                  <option value="SUPPORT">Support</option>

                  <option value="OTHER">Other</option>
                </select>

                <FieldError
                  message={errors.timeEntries?.[index]?.taskType?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`time-entry-${index}-minutes`}>Minutes</Label>

                <Input
                  id={`time-entry-${index}-minutes`}
                  type="number"
                  min={1}
                  max={10080}
                  disabled={disabled}
                  {...register(`timeEntries.${index}.minutes`, {
                    valueAsNumber: true,
                  })}
                />

                <FieldError
                  message={errors.timeEntries?.[index]?.minutes?.message}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove time entry ${index + 1}`}
                className="sm:mt-7"
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
