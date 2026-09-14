"use client";

import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Plus, Trash2, Trophy } from "lucide-react";

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

interface AchievementsSectionProps {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  disabled?: boolean;
}

export function AchievementsSection({
  control,
  register,
  errors,
  disabled = false,
}: AchievementsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "achievements",
  });

  function addAchievement() {
    append({
      title: "",
      description: undefined,
      isKeyAchievement: false,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            Achievements
          </CardTitle>

          <CardDescription className="mt-2">
            Record important results and successes.
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addAchievement}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <FieldError message={errors.achievements?.root?.message} />

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Trophy className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">No achievements</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add at least one achievement.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={disabled}
              onClick={addAchievement}
            >
              <Plus className="size-4" />
              Add achievement
            </Button>
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Achievement {index + 1}</p>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove achievement ${index + 1}`}
                  disabled={disabled || fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`achievement-${index}-title`}>
                  Achievement title
                </Label>

                <Input
                  id={`achievement-${index}-title`}
                  disabled={disabled}
                  placeholder="Example: Released the authentication module"
                  {...register(`achievements.${index}.title`)}
                />

                <FieldError
                  message={errors.achievements?.[index]?.title?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`achievement-${index}-description`}>
                  Description
                </Label>

                <textarea
                  id={`achievement-${index}-description`}
                  disabled={disabled}
                  placeholder="Optional details about this achievement..."
                  {...register(`achievements.${index}.description`)}
                  className={textareaClassName}
                />

                <FieldError
                  message={errors.achievements?.[index]?.description?.message}
                />
              </div>

              <Controller
                control={control}
                name={`achievements.${index}.isKeyAchievement`}
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
                    Mark as a key achievement
                  </label>
                )}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
