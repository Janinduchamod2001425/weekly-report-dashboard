"use client";

import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";

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

import { FieldError, textareaClassName } from "./form-utils";

interface BlockersSectionProps {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  disabled?: boolean;
}

export function BlockersSection({
  control,
  register,
  errors,
  disabled = false,
}: BlockersSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "blockers",
  });

  function addBlocker() {
    append({
      title: "",
      description: undefined,
      isKeyIssue: false,
      isResolved: false,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Blockers and issues
          </CardTitle>

          <CardDescription className="mt-2">
            Record problems that affected your progress. Leave this section
            empty if there were no blockers.
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addBlocker}
        >
          <Plus className="size-4" />
          Add blocker
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <AlertTriangle className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">No blockers added</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add a blocker only if an issue affected your work.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={disabled}
              onClick={addBlocker}
            >
              <Plus className="size-4" />
              Add blocker
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Blocker {index + 1}</p>

                    <p className="text-xs text-muted-foreground">
                      Describe the issue and its current state.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove blocker ${index + 1}`}
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`blocker-${index}-title`}>
                    Blocker title
                  </Label>

                  <Input
                    id={`blocker-${index}-title`}
                    disabled={disabled}
                    placeholder="Example: Waiting for API access"
                    {...register(`blockers.${index}.title`)}
                  />

                  <FieldError
                    message={errors.blockers?.[index]?.title?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`blocker-${index}-description`}>
                    Description
                  </Label>

                  <textarea
                    id={`blocker-${index}-description`}
                    disabled={disabled}
                    placeholder="Explain how this issue affected your progress..."
                    {...register(`blockers.${index}.description`)}
                    className={textareaClassName}
                  />

                  <FieldError
                    message={errors.blockers?.[index]?.description?.message}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <Controller
                    control={control}
                    name={`blockers.${index}.isKeyIssue`}
                    render={({ field: checkboxField }) => (
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={checkboxField.value}
                          onBlur={checkboxField.onBlur}
                          onChange={checkboxField.onChange}
                          ref={checkboxField.ref}
                          className="size-4 rounded border-input"
                        />
                        Mark as key issue
                      </label>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`blockers.${index}.isResolved`}
                    render={({ field: checkboxField }) => (
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={checkboxField.value}
                          onBlur={checkboxField.onBlur}
                          onChange={checkboxField.onChange}
                          ref={checkboxField.ref}
                          className="size-4 rounded border-input"
                        />
                        Issue resolved
                      </label>
                    )}
                  />
                </div>

                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  Select “Key issue” when this blocker significantly affected
                  the reporting week.
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
