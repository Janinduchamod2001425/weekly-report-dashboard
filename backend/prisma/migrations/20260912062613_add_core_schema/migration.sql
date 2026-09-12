/*
  Warnings:

  - You are about to drop the `system_health` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TEAM_MEMBER', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CARRIED_OVER');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DEVELOPMENT', 'TESTING', 'MEETINGS', 'DOCUMENTATION', 'DESIGN', 'RESEARCH', 'SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewActionType" AS ENUM ('APPROVED', 'REQUESTED_CHANGES');

-- DropTable
DROP TABLE "system_health";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TEAM_MEMBER',
    "jobTitle" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("userId","projectId")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "latestReviewerComment" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_tasks" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "plannedPercentage" INTEGER NOT NULL,
    "actualPercentage" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER NOT NULL,
    "deliverable" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "next_week_tasks" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "next_week_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockers" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isKeyIssue" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isKeyAchievement" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_links" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_versions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_actions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" "ReviewActionType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_managerId_idx" ON "users"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");

-- CreateIndex
CREATE INDEX "projects_isActive_idx" ON "projects"("isActive");

-- CreateIndex
CREATE INDEX "project_members_projectId_idx" ON "project_members"("projectId");

-- CreateIndex
CREATE INDEX "weekly_reports_status_idx" ON "weekly_reports"("status");

-- CreateIndex
CREATE INDEX "weekly_reports_projectId_idx" ON "weekly_reports"("projectId");

-- CreateIndex
CREATE INDEX "weekly_reports_weekStart_weekEnd_idx" ON "weekly_reports"("weekStart", "weekEnd");

-- CreateIndex
CREATE INDEX "weekly_reports_authorId_status_idx" ON "weekly_reports"("authorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_authorId_weekStart_key" ON "weekly_reports"("authorId", "weekStart");

-- CreateIndex
CREATE INDEX "report_tasks_reportId_idx" ON "report_tasks"("reportId");

-- CreateIndex
CREATE INDEX "report_tasks_projectId_idx" ON "report_tasks"("projectId");

-- CreateIndex
CREATE INDEX "report_tasks_status_idx" ON "report_tasks"("status");

-- CreateIndex
CREATE INDEX "next_week_tasks_reportId_idx" ON "next_week_tasks"("reportId");

-- CreateIndex
CREATE INDEX "blockers_reportId_idx" ON "blockers"("reportId");

-- CreateIndex
CREATE INDEX "blockers_isResolved_idx" ON "blockers"("isResolved");

-- CreateIndex
CREATE INDEX "achievements_reportId_idx" ON "achievements"("reportId");

-- CreateIndex
CREATE INDEX "time_entries_reportId_idx" ON "time_entries"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "time_entries_reportId_taskType_key" ON "time_entries"("reportId", "taskType");

-- CreateIndex
CREATE INDEX "report_links_reportId_idx" ON "report_links"("reportId");

-- CreateIndex
CREATE INDEX "report_versions_reportId_submittedAt_idx" ON "report_versions"("reportId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "report_versions_reportId_versionNumber_key" ON "report_versions"("reportId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "review_actions_versionId_key" ON "review_actions"("versionId");

-- CreateIndex
CREATE INDEX "review_actions_reportId_idx" ON "review_actions"("reportId");

-- CreateIndex
CREATE INDEX "review_actions_reviewerId_idx" ON "review_actions"("reviewerId");

-- CreateIndex
CREATE INDEX "review_actions_action_idx" ON "review_actions"("action");

-- CreateIndex
CREATE INDEX "review_actions_createdAt_idx" ON "review_actions"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_tasks" ADD CONSTRAINT "report_tasks_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_tasks" ADD CONSTRAINT "report_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_week_tasks" ADD CONSTRAINT "next_week_tasks_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockers" ADD CONSTRAINT "blockers_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_actions" ADD CONSTRAINT "review_actions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
