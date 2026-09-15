"use client";

import { ArrowLeft, LoaderCircle, UserCog } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { UserForm } from "@/components/users/user-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { UpdateUserFormValues } from "@/lib/validations/users";
import type { UserRole } from "@/types/auth";
import type { Project } from "@/types/reports";
import type { AdminUsersResponse } from "@/types/users";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

interface EditableUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  role: UserRole;
  isActive: boolean;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  projects?: Array<{
    id: string;
    name: string;
  }>;
  projectMemberships?: Array<{
    project: {
      id: string;
      name: string;
    };
  }>;
}

interface UpdateUserResponse {
  message: string;
  user: EditableUser;
}

interface PageData {
  user: EditableUser;
  projects: Project[];
  managers: AdminUsersResponse["data"];
}

function getAssignedProjectIds(user: EditableUser): string[] {
  if (user.projects) {
    return user.projects.map((project) => project.id);
  }

  if (user.projectMemberships) {
    return user.projectMemberships.map((membership) => membership.project.id);
  }

  return [];
}

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const userId = params.id;

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pendingValues, setPendingValues] =
    useState<UpdateUserFormValues | null>(null);

  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [user, projects, managersResponse] = await Promise.all([
        apiRequest<EditableUser>(`/users/${userId}`),
        apiRequest<Project[]>("/projects"),
        apiRequest<AdminUsersResponse>(
          "/users?page=1&limit=50&role=MANAGER&isActive=true",
        ),
      ]);

      setPageData({
        user,
        projects,
        managers: managersResponse.data.filter(
          (manager) => manager.id !== userId,
        ),
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to load the selected user.";

      setLoadError(message);

      toast.error("Unable to load user", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  async function updateUser(values: UpdateUserFormValues) {
    if (!pageData) {
      return;
    }

    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        jobTitle: values.jobTitle || null,
        role: values.role,
        managerId: values.managerId || null,
        projectIds: values.projectIds,
        isActive: values.isActive,
      };

      if (values.password?.trim()) {
        body.password = values.password;
      }

      const response = await apiRequest<UpdateUserResponse>(
        `/users/${userId}`,
        {
          method: "PATCH",
          body,
        },
      );

      toast.success("User updated successfully", {
        description: `${response.user.firstName} ${response.user.lastName}'s account has been updated.`,
      });

      setConfirmationOpen(false);
      setPendingValues(null);

      router.push("/users");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred while updating the user.";

      toast.error("Unable to update user", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(values: UpdateUserFormValues): Promise<void> {
    if (!pageData) {
      return;
    }

    const accountStatusChanged = values.isActive !== pageData.user.isActive;

    if (accountStatusChanged) {
      setPendingValues(values);
      setConfirmationOpen(true);
      return;
    }

    await updateUser(values);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
          <span>Loading user information...</span>
        </div>
      </div>
    );
  }

  if (loadError || !pageData) {
    return (
      <div className="space-y-6">
        <Link
          href="/users"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Link>

        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center">
          <div>
            <h1 className="text-lg font-semibold">Unable to load user</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {loadError ?? "The selected user could not be found."}
            </p>
          </div>

          <Button type="button" onClick={() => void loadPageData()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const initialValues: UpdateUserFormValues = {
    firstName: pageData.user.firstName,
    lastName: pageData.user.lastName,
    email: pageData.user.email,
    jobTitle: pageData.user.jobTitle ?? "",
    password: "",
    confirmPassword: "",
    role: pageData.user.role,
    managerId: pageData.user.manager?.id ?? "",
    projectIds: getAssignedProjectIds(pageData.user),
    isActive: pageData.user.isActive,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserCog className="size-5" />
          </span>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit user</h1>

            <p className="text-sm text-muted-foreground">
              Update {pageData.user.firstName} {pageData.user.lastName}&apos;s
              account and assignments.
            </p>
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

      <UserForm
        mode="edit"
        initialValues={initialValues}
        projects={pageData.projects}
        managers={pageData.managers}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <ConfirmationDialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) {
            setConfirmationOpen(open);

            if (!open) {
              setPendingValues(null);
            }
          }
        }}
        title={
          pendingValues?.isActive
            ? "Activate this account?"
            : "Deactivate this account?"
        }
        description={
          pendingValues?.isActive
            ? `${pageData.user.firstName} ${pageData.user.lastName} will be able to sign in and use the system again.`
            : `${pageData.user.firstName} ${pageData.user.lastName} will no longer be able to sign in. Existing reports and account data will remain available.`
        }
        confirmLabel={
          pendingValues?.isActive ? "Activate account" : "Deactivate account"
        }
        variant={pendingValues?.isActive ? "default" : "destructive"}
        isLoading={isSubmitting}
        onConfirm={() => {
          if (pendingValues) {
            void updateUser(pendingValues);
          }
        }}
      />
    </div>
  );
}
