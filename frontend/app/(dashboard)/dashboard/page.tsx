"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, ApiError } from "@/lib/api";
import type { DashboardResponse, ReportStatus } from "@/types/dashboard";

const chartColors = [
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#EA580C",
  "#DC2626",
  "#0891B2",
  "#4F46E5",
  "#64748B",
];

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  now.setDate(now.getDate() - daysSinceMonday);

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTaskType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusBadge({ status }: { status: ReportStatus | "NOT_STARTED" }) {
  const styles = {
    DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
    SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
    NEEDS_CORRECTION: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    NOT_STARTED: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const labels = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    NEEDS_CORRECTION: "Needs Correction",
    APPROVED: "Approved",
    NOT_STARTED: "Not Started",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [weekStart, setWeekStart] = useState(getCurrentMonday);

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await apiRequest<DashboardResponse>(
          `/dashboard?weekStart=${weekStart}`,
        );

        setDashboard(response);
      } catch (error) {
        toast.error("Unable to load dashboard", {
          description:
            error instanceof ApiError
              ? error.message
              : "Please confirm the backend is running.",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [weekStart],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading && !dashboard) {
    return <DashboardLoading />;
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="flex min-h-80 flex-col items-center justify-center text-center">
          <AlertTriangle className="size-10 text-destructive" />

          <h2 className="mt-4 text-xl font-semibold">Dashboard unavailable</h2>

          <p className="mt-2 text-muted-foreground">
            We could not retrieve the team dashboard.
          </p>

          <Button className="mt-5" onClick={() => void loadDashboard()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = [
    {
      title: "Reports Submitted",
      value: dashboard.summary.submitted,
      helper: `${dashboard.summary.totalTeamMembers} active members`,
      icon: ClipboardCheck,
      color: "text-blue-600",
      background: "bg-blue-50",
    },
    {
      title: "Compliance Rate",
      value: `${dashboard.summary.complianceRate}%`,
      helper: `${dashboard.summary.notStarted} not started`,
      icon: TrendingUp,
      color: "text-violet-600",
      background: "bg-violet-50",
    },
    {
      title: "Needs Correction",
      value: dashboard.summary.needsCorrection,
      helper: "Reports requiring updates",
      icon: AlertTriangle,
      color: "text-amber-600",
      background: "bg-amber-50",
    },
    {
      title: "Open Blockers",
      value: dashboard.summary.openBlockers,
      helper: `${dashboard.summary.late} late submissions`,
      icon: Clock3,
      color: "text-rose-600",
      background: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Team Dashboard
          </h1>

          <p className="mt-2 text-muted-foreground">
            Monitor weekly submissions, workload and team progress.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="date"
            value={weekStart}
            onChange={(event) => setWeekStart(event.target.value)}
            className="w-full sm:w-44"
          />

          <Button
            type="button"
            variant="outline"
            disabled={isRefreshing}
            onClick={() => void loadDashboard(true)}
          >
            {isRefreshing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-card px-5 py-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium">Reporting period</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(dashboard.selectedWeek.start)} –{" "}
              {formatDate(dashboard.selectedWeek.end)}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            Deadline:{" "}
            {formatDateTime(dashboard.selectedWeek.submissionDeadline)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardContent className="flex items-start justify-between p-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>

                  <p className="mt-3 text-3xl font-semibold">{card.value}</p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {card.helper}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${card.background}`}>
                  <Icon className={`size-5 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Submission compliance</CardTitle>
              <CardDescription>
                {dashboard.summary.submitted} of{" "}
                {dashboard.summary.totalTeamMembers} team members submitted a
                report.
              </CardDescription>
            </div>

            <span className="text-2xl font-semibold">
              {dashboard.summary.complianceRate}%
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <Progress value={dashboard.summary.complianceRate} />

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Approved: {dashboard.summary.approved}</span>
            <span>Draft: {dashboard.summary.draft}</span>
            <span>Not started: {dashboard.summary.notStarted}</span>
            <span>Late: {dashboard.summary.late}</span>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Completed tasks trend</CardTitle>
            <CardDescription>
              Completed and total tasks over the last six weeks.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.charts.tasksTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="weekStart"
                    tickFormatter={formatShortDate}
                    fontSize={12}
                  />

                  <YAxis allowDecimals={false} fontSize={12} />

                  <ChartTooltip
                    labelFormatter={(value) => formatDate(String(value))}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="completedTasks"
                    name="Completed Tasks"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="totalTasks"
                    name="Total Tasks"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workload by project</CardTitle>
            <CardDescription>
              Actual hours recorded against each project.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.charts.workloadByProject}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />

                  <XAxis dataKey="projectName" fontSize={11} />

                  <YAxis fontSize={12} />

                  <ChartTooltip />

                  <Bar
                    dataKey="actualHours"
                    name="Actual Hours"
                    radius={[6, 6, 0, 0]}
                  >
                    {dashboard.charts.workloadByProject.map((entry, index) => (
                      <Cell
                        key={entry.projectId}
                        fill={
                          entry.color ?? chartColors[index % chartColors.length]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Member submission status</CardTitle>
            <CardDescription>
              Report status for every active team member.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {dashboard.statusByMember.map((item) => (
                    <TableRow key={item.member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.member.firstName} {item.member.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.member.jobTitle ?? "Team Member"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {item.submittedAt
                          ? formatDateTime(item.submittedAt)
                          : "—"}
                      </TableCell>

                      <TableCell>
                        {item.isLate ? (
                          <span className="text-sm font-medium text-rose-600">
                            Late
                          </span>
                        ) : (
                          <span className="text-sm text-emerald-600">
                            On track
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {item.reportId && item.status !== "DRAFT" ? (
                          <Link
                            href={`/manager/reports/${item.reportId}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Review
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unavailable
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time distribution</CardTitle>
            <CardDescription>Team hours grouped by work type.</CardDescription>
          </CardHeader>

          <CardContent>
            {dashboard.charts.timeByTaskType.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard.charts.timeByTaskType}
                        dataKey="hours"
                        nameKey="taskType"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {dashboard.charts.timeByTaskType.map((entry, index) => (
                          <Cell
                            key={entry.taskType}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>

                      <ChartTooltip
                        formatter={(value) => [`${value} hours`, "Time"]}
                        labelFormatter={(value) =>
                          formatTaskType(String(value))
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {dashboard.charts.timeByTaskType.map((entry, index) => (
                    <div
                      key={entry.taskType}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              chartColors[index % chartColors.length],
                          }}
                        />

                        <span>{formatTaskType(entry.taskType)}</span>
                      </div>

                      <span className="font-medium">{entry.hours}h</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-20 text-center text-sm text-muted-foreground">
                No time entries for this week.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent review activity</CardTitle>
          <CardDescription>
            Latest approval and correction actions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {dashboard.activity.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No recent review activity.
            </p>
          ) : (
            <div className="space-y-1">
              {dashboard.activity.map((activity) => {
                const approved = activity.type === "REPORT_APPROVED";

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/60"
                  >
                    <div
                      className={
                        approved
                          ? "mt-0.5 rounded-full bg-emerald-50 p-2 text-emerald-600"
                          : "mt-0.5 rounded-full bg-amber-50 p-2 text-amber-600"
                      }
                    >
                      {approved ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <AlertTriangle className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/manager/reports/${activity.reportId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {activity.message}
                      </Link>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Version {activity.versionNumber} ·{" "}
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
