"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, ShieldCheck } from "lucide-react";

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
import {
  createUserSchema,
  updateUserSchema,
  type UpdateUserFormValues,
} from "@/lib/validations/users";
import type { Project } from "@/types/reports";

interface ManagerOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserFormProps {
  mode: "create" | "edit";
  initialValues: UpdateUserFormValues;
  projects: Project[];
  managers: ManagerOption[];
  isSubmitting: boolean;
  onSubmit: (values: UpdateUserFormValues) => Promise<void>;
}

interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50";

export function UserForm({
  mode,
  initialValues,
  projects,
  managers,
  isSubmitting,
  onSubmit,
}: UserFormProps) {
  const schema = mode === "create" ? createUserSchema : updateUserSchema;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(schema) as Resolver<UpdateUserFormValues>,
    defaultValues: initialValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const selectedRole = watch("role");

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (selectedRole !== "TEAM_MEMBER") {
      setValue("managerId", undefined);
    }
  }, [selectedRole, setValue]);

  const activeProjects = projects.filter((project) => project.isActive);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>

          <CardDescription>
            Enter the user&apos;s account and employment details.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>

            <Input
              id="firstName"
              disabled={isSubmitting}
              autoComplete="given-name"
              {...register("firstName")}
            />

            <FieldError message={errors.firstName?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>

            <Input
              id="lastName"
              disabled={isSubmitting}
              autoComplete="family-name"
              {...register("lastName")}
            />

            <FieldError message={errors.lastName?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>

            <Input
              id="email"
              type="email"
              disabled={isSubmitting}
              autoComplete="email"
              {...register("email")}
            />

            <FieldError message={errors.email?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job title</Label>

            <Input
              id="jobTitle"
              disabled={isSubmitting}
              placeholder="Example: Software Engineer"
              {...register("jobTitle")}
            />

            <FieldError message={errors.jobTitle?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>

          <CardDescription>
            {mode === "create"
              ? "Create an initial password for this account."
              : "Leave the password fields empty to keep the current password."}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === "create" ? "Password" : "New password"}
            </Label>

            <Input
              id="password"
              type="password"
              disabled={isSubmitting}
              autoComplete="new-password"
              {...register("password")}
            />

            <FieldError message={errors.password?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>

            <Input
              id="confirmPassword"
              type="password"
              disabled={isSubmitting}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />

            <FieldError message={errors.confirmPassword?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Access and reporting
          </CardTitle>

          <CardDescription>
            Configure the user&apos;s role, status and reporting manager.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role">User role</Label>

            <select
              id="role"
              disabled={isSubmitting}
              {...register("role")}
              className={selectClassName}
            >
              <option value="TEAM_MEMBER">Team Member</option>

              <option value="MANAGER">Manager</option>

              <option value="ADMIN">Administrator</option>
            </select>

            <FieldError message={errors.role?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="managerId">Reporting manager</Label>

            <select
              id="managerId"
              disabled={isSubmitting || selectedRole !== "TEAM_MEMBER"}
              {...register("managerId")}
              className={selectClassName}
            >
              <option value="">No reporting manager</option>

              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.firstName} {manager.lastName}
                </option>
              ))}
            </select>

            <FieldError message={errors.managerId?.message} />

            {selectedRole !== "TEAM_MEMBER" && (
              <p className="text-xs text-muted-foreground">
                Reporting managers apply only to team members.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
              <input
                type="checkbox"
                disabled={isSubmitting}
                {...register("isActive")}
                className="size-4 rounded border-input"
              />

              <div>
                <p className="text-sm font-medium">Active account</p>

                <p className="text-xs text-muted-foreground">
                  Inactive users cannot log in or access protected endpoints.
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project assignments</CardTitle>

          <CardDescription>
            Select the projects this user can include in weekly reports.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {activeProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active projects are available.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeProjects.map((project) => (
                <label
                  key={project.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30"
                >
                  <input
                    type="checkbox"
                    value={project.id}
                    disabled={isSubmitting}
                    {...register("projectIds")}
                    className="mt-0.5 size-4 rounded border-input"
                  />

                  <span
                    className="mt-0.5 size-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: project.color ?? "#64748b",
                    }}
                  />

                  <span>
                    <span className="block text-sm font-medium">
                      {project.name}
                    </span>

                    {project.description && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {project.description}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}

          <FieldError message={errors.projectIds?.message} />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">
              {mode === "create"
                ? "Create user account"
                : "Update user account"}
            </p>

            <p className="text-xs text-muted-foreground">
              {isDirty ? "You have unsaved changes." : "No unsaved changes."}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link
              href="/users"
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
                  ? "Create user"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
