"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

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

import { FieldError } from "./form-utils";

interface LinksSectionProps {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
  disabled?: boolean;
}

export function LinksSection({
  control,
  register,
  errors,
  disabled = false,
}: LinksSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  function addLink() {
    append({
      label: "",
      url: "",
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="size-5" />
            Related links
          </CardTitle>

          <CardDescription className="mt-2">
            Add pull requests, documentation, designs or deliverables.
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addLink}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <ExternalLink className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">No related links</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Links are optional but help managers verify deliverables.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={disabled}
              onClick={addLink}
            >
              <Plus className="size-4" />
              Add link
            </Button>
          </div>
        ) : (
          fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-start"
            >
              <div className="space-y-2">
                <Label htmlFor={`link-${index}-label`}>Link label</Label>

                <Input
                  id={`link-${index}-label`}
                  disabled={disabled}
                  placeholder="Example: GitHub pull request"
                  {...register(`links.${index}.label`)}
                />

                <FieldError message={errors.links?.[index]?.label?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`link-${index}-url`}>URL</Label>

                <Input
                  id={`link-${index}-url`}
                  type="url"
                  disabled={disabled}
                  placeholder="https://example.com/resource"
                  {...register(`links.${index}.url`)}
                />

                <FieldError message={errors.links?.[index]?.url?.message} />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove link ${index + 1}`}
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
