"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderKanban,
  Loader2,
  Mail,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiRequest } from "@/lib/api";
import type { ManagerReportsResponse, TeamMemberDetail } from "@/types/reports";

function getParameterId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(value: string): string {
  return format(new Date(value), "dd MMM yyyy");
}

export default function TeamMemberProfilePage() {
  const params = useParams<{
    id: string;
  }>();

  const memberId = getParameterId(params.id);

  const [member, setMember] = useState<TeamMemberDetail | null>(null);

  const [reports, setReports] = useState<ManagerReportsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadMember = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [memberResponse, reportsResponse] = await Promise.all([
        apiRequest<TeamMemberDetail>(`/users/${memberId}`),
        apiRequest<ManagerReportsResponse>(
          `/manager/reports?teamMemberId=${memberId}&page=1&limit=10`,
        ),
      ]);

      setMember(memberResponse);
      setReports(reportsResponse);
    } catch (error) {
      setMember(null);
      setReports(null);

      toast.error("Unable to load member profile", {
        description:
          error instanceof ApiError
            ? error.message
            : "Please confirm that the backend server is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  const reportStatistics = useMemo(() => {
    const memberReports = reports?.data ?? [];

    return {
      total: reports?.pagination.total ?? 0,

      submitted: memberReports.filter((report) => report.status === "SUBMITTED")
        .length,

      approved: memberReports.filter((report) => report.status === "APPROVED")
        .length,

      needsCorrection: memberReports.filter(
        (report) => report.status === "NEEDS_CORRECTION",
      ).length,
    };
  }, [reports]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span>Loading member profile...</span>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-5">
        <Link
          href="/team"
          className={buttonVariants({
            variant: "outline",
          })}
        >
          <ArrowLeft className="size-4" />
          Back to team
        </Link>

        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <UserRound className="mb-4 size-10 text-muted-foreground" />

            <h1 className="text-xl font-semibold">Member unavailable</h1>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              The member does not exist, or you do not have permission to view
              this profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/team"
        className={buttonVariants({
          variant: "outline",
          size: "sm",
        })}
      >
        <ArrowLeft className="size-4" />
        Back to team
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {getInitials(member.firstName, member.lastName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {member.firstName} {member.lastName}
                </h1>

                <span
                  className={
                    member.isActive
                      ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
                  }
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness className="size-4" />
                  {member.jobTitle ?? "Team Member"}
                </span>

                <span className="flex items-center gap-2">
                  <Mail className="size-4" />
                  {member.email}
                </span>

                <span className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  Joined {formatDate(member.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <ClipboardList className="size-5 text-blue-600" />

            <div>
              <p className="text-2xl font-semibold">{reportStatistics.total}</p>

              <p className="text-sm text-muted-foreground">Total reports</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Clock3 className="size-5 text-amber-600" />

            <div>
              <p className="text-2xl font-semibold">
                {reportStatistics.submitted}
              </p>

              <p className="text-sm text-muted-foreground">Awaiting review</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle2 className="size-5 text-emerald-600" />

            <div>
              <p className="text-2xl font-semibold">
                {reportStatistics.approved}
              </p>

              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <ClipboardList className="size-5 text-red-600" />

            <div>
              <p className="text-2xl font-semibold">
                {reportStatistics.needsCorrection}
              </p>

              <p className="text-sm text-muted-foreground">Needs correction</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Reporting manager
            </CardTitle>
          </CardHeader>

          <CardContent>
            {member.manager ? (
              <div className="rounded-lg border p-4">
                <p className="font-medium">
                  {member.manager.firstName} {member.manager.lastName}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {member.manager.email}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No reporting manager assigned.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="size-5" />
              Assigned projects
            </CardTitle>

            <CardDescription>
              Projects currently assigned to this member.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {member.projectMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No projects assigned.
              </p>
            ) : (
              <div className="space-y-3">
                {member.projectMemberships.map(({ project }) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: project.color ?? "#64748b",
                      }}
                    />

                    <div>
                      <p className="text-sm font-medium">{project.name}</p>

                      {project.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>

          <CardDescription>
            The member&apos;s ten most recent weekly reports.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!reports || reports.data.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <ClipboardList className="size-8 text-muted-foreground" />

              <p className="mt-3 font-medium">No reports available</p>

              <p className="mt-1 text-sm text-muted-foreground">
                This member has not created any reports.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contents</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {reports.data.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(report.weekStart)}
                        <span className="block text-xs text-muted-foreground">
                          to {formatDate(report.weekEnd)}
                        </span>
                      </TableCell>

                      <TableCell>{report.project.name}</TableCell>

                      <TableCell>
                        <ReportStatusBadge status={report.status} />
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {report._count.tasks} tasks · {report._count.blockers}{" "}
                        blockers
                      </TableCell>

                      <TableCell className="text-right">
                        {report.status === "DRAFT" ? (
                          <span className="text-sm text-muted-foreground">
                            Private draft
                          </span>
                        ) : (
                          <Link
                            href={`/manager/reports/${report.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            View
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
