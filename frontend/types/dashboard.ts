import type { AuthenticatedUser } from "@/types/auth";

export type ReportStatus =
  "DRAFT" | "SUBMITTED" | "NEEDS_CORRECTION" | "APPROVED";

export interface DashboardResponse {
  selectedWeek: {
    start: string;
    end: string;
    submissionDeadline: string;
  };

  summary: {
    totalTeamMembers: number;
    submitted: number;
    approved: number;
    needsCorrection: number;
    draft: number;
    notStarted: number;
    late: number;
    openBlockers: number;
    complianceRate: number;
  };

  statusByMember: Array<{
    member: Pick<
      AuthenticatedUser,
      "id" | "firstName" | "lastName" | "jobTitle"
    > & {
      avatarUrl: string | null;
    };
    reportId: string | null;
    status: ReportStatus | "NOT_STARTED";
    submittedAt: string | null;
    isLate: boolean;
  }>;

  charts: {
    tasksTrend: Array<{
      weekStart: string;
      completedTasks: number;
      totalTasks: number;
    }>;

    workloadByProject: Array<{
      projectId: string;
      projectName: string;
      color: string | null;
      taskCount: number;
      actualMinutes: number;
      actualHours: number;
    }>;

    timeByTaskType: Array<{
      taskType: string;
      minutes: number;
      hours: number;
    }>;
  };

  activity: Array<{
    id: string;
    type: "REPORT_APPROVED" | "CHANGES_REQUESTED";
    message: string;
    reportId: string;
    versionNumber: number;
    createdAt: string;
  }>;
}
