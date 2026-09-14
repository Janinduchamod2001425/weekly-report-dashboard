"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Archive,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
import { ApiError, apiRequest } from "@/lib/api";
import type { Project } from "@/types/reports";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

interface ProjectFormValues {
  name: string;
  description: string;
  color: string;
}

const initialFormValues: ProjectFormValues = {
  name: "",
  description: "",
  color: "#3b82f6",
};

type StatusFilter = "ALL" | "ACTIVE" | "ARCHIVED";

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Please confirm that the backend server is running.";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [showForm, setShowForm] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [formValues, setFormValues] =
    useState<ProjectFormValues>(initialFormValues);

  const [isSaving, setIsSaving] = useState(false);

  const [processingProjectId, setProcessingProjectId] = useState<string | null>(
    null,
  );

  const [projectToArchive, setProjectToArchive] = useState<Project | null>(
    null,
  );

  const loadProjects = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiRequest<Project[]>("/projects");

      setProjects(response);
    } catch (error) {
      setProjects([]);

      toast.error("Unable to load projects", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.description?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && project.isActive) ||
        (statusFilter === "ARCHIVED" && !project.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  function updateForm(field: keyof ProjectFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateForm() {
    setEditingProjectId(null);
    setFormValues(initialFormValues);
    setShowForm(true);
  }

  function openEditForm(project: Project) {
    setEditingProjectId(project.id);

    setFormValues({
      name: project.name,
      description: project.description ?? "",
      color: project.color ?? "#3b82f6",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (isSaving) {
      return;
    }

    setShowForm(false);
    setEditingProjectId(null);
    setFormValues(initialFormValues);
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();

    const name = formValues.name.trim();

    if (name.length < 2) {
      toast.error("Project name must contain at least 2 characters");
      return;
    }

    setIsSaving(true);

    try {
      const body = {
        name,
        description: formValues.description.trim() || null,
        color: formValues.color,
      };

      if (editingProjectId) {
        await apiRequest(`/projects/${editingProjectId}`, {
          method: "PATCH",
          body,
        });

        toast.success("Project updated");
      } else {
        await apiRequest("/projects", {
          method: "POST",
          body,
        });

        toast.success("Project created");
      }

      closeForm();
      await loadProjects();
    } catch (error) {
      toast.error(
        editingProjectId
          ? "Unable to update project"
          : "Unable to create project",
        {
          description: getErrorMessage(error),
        },
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveProject() {
    if (!projectToArchive) {
      return;
    }

    const project = projectToArchive;

    setProcessingProjectId(project.id);

    try {
      await apiRequest(`/projects/${project.id}`, {
        method: "DELETE",
      });

      toast.success("Project archived", {
        description: `${project.name} was archived successfully.`,
      });

      setProjectToArchive(null);

      await loadProjects();
    } catch (error) {
      toast.error("Unable to archive project", {
        description: getErrorMessage(error),
      });
    } finally {
      setProcessingProjectId(null);
    }
  }

  async function restoreProject(project: Project) {
    setProcessingProjectId(project.id);

    try {
      await apiRequest(`/projects/${project.id}/restore`, {
        method: "PATCH",
      });

      toast.success("Project restored");
      await loadProjects();
    } catch (error) {
      toast.error("Unable to restore project", {
        description: getErrorMessage(error),
      });
    } finally {
      setProcessingProjectId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <FolderKanban className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>

            <p className="mt-1 text-muted-foreground">
              Create and manage projects used in weekly reports.
            </p>
          </div>
        </div>

        <Button type="button" onClick={openCreateForm}>
          <Plus className="size-4" />
          Create project
        </Button>
      </header>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>
                {editingProjectId ? "Edit project" : "Create project"}
              </CardTitle>

              <CardDescription>
                Projects can be assigned to team members and weekly reports.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isSaving}
              onClick={closeForm}
            >
              <X className="size-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={saveProject} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[1fr_160px]">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>

                  <Input
                    id="project-name"
                    value={formValues.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Example: Weekly Report Dashboard"
                    disabled={isSaving}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-color">Project color</Label>

                  <div className="flex items-center gap-2">
                    <Input
                      id="project-color"
                      type="color"
                      value={formValues.color}
                      onChange={(event) =>
                        updateForm("color", event.target.value)
                      }
                      disabled={isSaving}
                      className="w-16 p-1"
                    />

                    <Input
                      value={formValues.color}
                      onChange={(event) =>
                        updateForm("color", event.target.value)
                      }
                      disabled={isSaving}
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>

                <textarea
                  id="project-description"
                  value={formValues.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Optional project description..."
                  disabled={isSaving}
                  className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={closeForm}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}

                  {isSaving
                    ? "Saving..."
                    : editingProjectId
                      ? "Save changes"
                      : "Create project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project directory</CardTitle>

          <CardDescription>
            {projects.length} project
            {projects.length === 1 ? "" : "s"} available
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                className="pl-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="ALL">All projects</option>

              <option value="ACTIVE">Active projects</option>

              <option value="ARCHIVED">Archived projects</option>
            </select>

            {(search || statusFilter !== "ALL") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <FolderKanban className="size-9 text-muted-foreground" />

              <h2 className="mt-4 font-semibold">No projects found</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                No projects match the selected filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => {
                const isProcessing = processingProjectId === project.id;

                return (
                  <article
                    key={project.id}
                    className="flex flex-col rounded-xl border p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="size-4 shrink-0 rounded-full"
                          style={{
                            backgroundColor: project.color ?? "#64748b",
                          }}
                        />

                        <h2 className="font-semibold">{project.name}</h2>
                      </div>

                      <span
                        className={
                          project.isActive
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        }
                      >
                        {project.isActive ? "Active" : "Archived"}
                      </span>
                    </div>

                    <p className="mt-4 flex-1 text-sm text-muted-foreground">
                      {project.description ??
                        "No project description provided."}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => openEditForm(project)}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>

                      {project.isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => setProjectToArchive(project)}
                        >
                          {isProcessing ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Archive className="size-4" />
                          )}
                          Archive
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => void restoreProject(project)}
                        >
                          {isProcessing ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RotateCcw className="size-4" />
                          )}
                          Restore
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={projectToArchive !== null}
        title="Archive project?"
        description={
          projectToArchive
            ? `Are you sure you want to archive "${projectToArchive.name}"? Existing reports will remain available, but the project cannot be selected for new reports.`
            : ""
        }
        confirmLabel="Archive project"
        variant="destructive"
        isLoading={
          projectToArchive !== null &&
          processingProjectId === projectToArchive.id
        }
        onOpenChange={(open) => {
          if (!open) {
            setProjectToArchive(null);
          }
        }}
        onConfirm={archiveProject}
      />
    </div>
  );
}
