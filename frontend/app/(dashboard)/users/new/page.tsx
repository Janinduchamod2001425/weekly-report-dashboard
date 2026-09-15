"use client";

import { ArrowLeft, LoaderCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { UserForm } from "@/components/users/user-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, apiRequest } from "@/lib/api";
import {
  defaultCreateUserValues,
  type UpdateUserFormValues,
} from "@/lib/validations/users";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/reports";
import type { AdminUsersResponse } from "@/types/users";

interface CreateUserResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PageData {
  projects: Project[];
  managers: AdminUsersResponse["data"];
}

export default function CreateUserPage() {
  const router = useRouter();

  const [pageData, setPageData] = useState<PageData>({
    projects: [],
    managers: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initialValues = useMemo<UpdateUserFormValues>(
    () => ({
      ...defaultCreateUserValues,
      projectIds: [...defaultCreateUserValues.projectIds],
    }),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadFormData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [projects, managersResponse] = await Promise.all([
          apiRequest<Project[]>("/projects"),
          apiRequest<AdminUsersResponse>(
            "/users?page=1&limit=50&role=MANAGER&isActive=true",
          ),
        ]);

        if (!isMounted) {
          return;
        }

        setPageData({
          projects,
          managers: managersResponse.data,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : "Unable to load the user form.";

        setLoadError(message);
        toast.error("Unable to prepare user creation", {
          description: message,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFormData();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(values: UpdateUserFormValues) {
    setIsSubmitting(true);

    try {
      const response = await apiRequest<CreateUserResponse>("/users", {
        method: "POST",
        body: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          jobTitle: values.jobTitle || undefined,
          password: values.password,
          role: values.role,
          managerId: values.managerId || undefined,
          projectIds: values.projectIds,
          isActive: values.isActive,
        },
      });

      toast.success("User created successfully", {
        description: `${response.user.firstName} ${response.user.lastName} can now access the system.`,
      });

      router.push("/users");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred while creating the user.";

      toast.error("Unable to create user", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </span>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Create user
              </h1>

              <p className="text-sm text-muted-foreground">
                Add a team member, manager or administrator.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/users"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center rounded-xl border bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
            <span>Preparing user form...</span>
          </div>
        </div>
      ) : loadError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center">
          <div>
            <h2 className="font-semibold">Unable to load user form</h2>

            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </div>

          <Button type="button" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      ) : (
        <UserForm
          mode="create"
          initialValues={initialValues}
          projects={pageData.projects}
          managers={pageData.managers}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
