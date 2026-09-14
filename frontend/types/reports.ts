export type ReportStatus =
  "DRAFT" | "SUBMITTED" | "NEEDS_CORRECTION" | "APPROVED";

export interface ProjectSummary {
  id: string;
  name: string;
  color: string | null;
}

export interface MemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  avatarUrl: string | null;
}

export interface ManagerReportSummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  latestReviewerComment: string | null;
  updatedAt: string;
  author: MemberSummary;
  project: ProjectSummary;
  _count: {
    tasks: number;
    blockers: number;
    achievements: number;
    versions: number;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ManagerReportsResponse {
  data: ManagerReportSummary[];
  pagination: Pagination;
}

export interface UsersResponse {
  data: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string | null;
  }>;
  pagination: Pagination;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
}

export interface ReportTask {
  id: string;
  name: string;
  priority: string;
  plannedPercentage: number;
  actualPercentage: number;
  status: string;
  plannedMinutes: number;
  actualMinutes: number;
  deliverable: string | null;
  project: ProjectSummary | null;
}

export interface NextWeekTask {
  id: string;
  name: string;
  description: string | null;
  priority: string;
}

export interface Blocker {
  id: string;
  title: string;
  description: string | null;
  isKeyIssue: boolean;
  isResolved: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  isKeyAchievement: boolean;
}

export interface TimeEntry {
  id: string;
  taskType: string;
  minutes: number;
}

export interface ReportLink {
  id: string;
  label: string;
  url: string;
}

export interface VersionSnapshot {
  project?: {
    name?: string;
  };
  weekStart?: string;
  weekEnd?: string;
  notes?: string | null;
  tasks?: Array<{
    name: string;
    priority: string;
    plannedPercentage: number;
    actualPercentage: number;
    status: string;
    plannedMinutes: number;
    actualMinutes: number;
    deliverable?: string | null;
  }>;
  nextWeekTasks?: Array<{
    name: string;
    description?: string | null;
    priority: string;
  }>;
  blockers?: Array<{
    title: string;
    description?: string | null;
    isKeyIssue: boolean;
    isResolved: boolean;
  }>;
  achievements?: Array<{
    title: string;
    description?: string | null;
    isKeyAchievement: boolean;
  }>;
}

export interface ReportReviewAction {
  id: string;
  action: "APPROVED" | "REQUESTED_CHANGES";
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface ReportVersion {
  id: string;
  versionNumber: number;
  submittedAt: string;
  content: VersionSnapshot;
  reviewAction: ReportReviewAction | null;
}

export interface ManagerReportDetail {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  notes: string | null;
  latestReviewerComment: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: MemberSummary;
  project: ProjectSummary;
  tasks: ReportTask[];
  nextWeekTasks: NextWeekTask[];
  blockers: Blocker[];
  achievements: Achievement[];
  timeEntries: TimeEntry[];
  links: ReportLink[];
  versions: ReportVersion[];
}

export interface MyReportListItem {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  notes: string | null;
  latestReviewerComment: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    color: string | null;
  };
  _count: {
    tasks: number;
    blockers: number;
    achievements: number;
    versions: number;
  };
}

export interface MyReportsResponse {
  data: MyReportListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type MyReportDetail = Omit<ManagerReportDetail, "author">;

export interface TeamMemberProjectMembership {
  project: Project;
}

export interface TeamMemberDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "TEAM_MEMBER" | "MANAGER" | "ADMIN";
  jobTitle: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  projectMemberships: TeamMemberProjectMembership[];
}
