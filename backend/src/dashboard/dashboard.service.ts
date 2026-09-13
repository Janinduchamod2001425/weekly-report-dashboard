import { Injectable } from '@nestjs/common';
import {
  ReportStatus,
  ReviewActionType,
  TaskStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import type { DashboardQueryDto } from './dto/dashboard-query.dto.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: DashboardQueryDto) {
    const selectedWeek = this.getMonday(
      query.weekStart
        ? new Date(`${query.weekStart.slice(0, 10)}T00:00:00.000Z`)
        : new Date(),
    );

    const selectedWeekEnd = this.addDays(selectedWeek, 6);
    const submissionDeadline = this.endOfDay(selectedWeekEnd);

    const trendStart = this.addDays(selectedWeek, -35);

    const [teamMembers, selectedReports, trendReports, recentReviews] =
      await Promise.all([
        this.prisma.user.findMany({
          where: {
            role: UserRole.TEAM_MEMBER,
            isActive: true,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            avatarUrl: true,
          },
          orderBy: [
            {
              firstName: 'asc',
            },
            {
              lastName: 'asc',
            },
          ],
        }),

        this.prisma.weeklyReport.findMany({
          where: {
            weekStart: selectedWeek,
            author: {
              role: UserRole.TEAM_MEMBER,
              isActive: true,
            },
          },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                jobTitle: true,
                avatarUrl: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            tasks: {
              select: {
                status: true,
                actualMinutes: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
            blockers: {
              select: {
                isResolved: true,
              },
            },
            timeEntries: {
              select: {
                taskType: true,
                minutes: true,
              },
            },
          },
        }),

        this.prisma.weeklyReport.findMany({
          where: {
            weekStart: {
              gte: trendStart,
              lte: selectedWeek,
            },
            author: {
              role: UserRole.TEAM_MEMBER,
              isActive: true,
            },
          },
          select: {
            weekStart: true,
            tasks: {
              select: {
                status: true,
              },
            },
          },
          orderBy: {
            weekStart: 'asc',
          },
        }),

        this.prisma.reviewAction.findMany({
          take: 10,
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            report: {
              select: {
                id: true,
                weekStart: true,
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            version: {
              select: {
                versionNumber: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

    const reportByMember = new Map(
      selectedReports.map((report) => [report.authorId, report]),
    );

    const now = new Date();

    const statusByMember = teamMembers.map((member) => {
      const report = reportByMember.get(member.id);

      const hasSubmitted =
        report !== undefined && report.status !== ReportStatus.DRAFT;

      const isLate = report
        ? report.submittedAt
          ? report.submittedAt > submissionDeadline
          : now > submissionDeadline
        : now > submissionDeadline;

      return {
        member,
        reportId: report?.id ?? null,
        status: report?.status ?? 'NOT_STARTED',
        submittedAt: report?.submittedAt ?? null,
        isLate:
          isLate && !hasSubmitted
            ? true
            : Boolean(
                report?.submittedAt && report.submittedAt > submissionDeadline,
              ),
      };
    });

    const submittedReports = selectedReports.filter(
      (report) => report.status !== ReportStatus.DRAFT,
    );

    const approvedReports = selectedReports.filter(
      (report) => report.status === ReportStatus.APPROVED,
    );

    const needsCorrectionReports = selectedReports.filter(
      (report) => report.status === ReportStatus.NEEDS_CORRECTION,
    );

    const draftReports = selectedReports.filter(
      (report) => report.status === ReportStatus.DRAFT,
    );

    const notStartedCount = teamMembers.length - selectedReports.length;

    const lateCount = statusByMember.filter((item) => item.isLate).length;

    const openBlockers = selectedReports.reduce(
      (total, report) =>
        total + report.blockers.filter((blocker) => !blocker.isResolved).length,
      0,
    );

    const complianceRate =
      teamMembers.length === 0
        ? 0
        : Number(
            ((submittedReports.length / teamMembers.length) * 100).toFixed(1),
          );

    const workloadMap = new Map<
      string,
      {
        projectId: string;
        projectName: string;
        color: string | null;
        taskCount: number;
        actualMinutes: number;
      }
    >();

    for (const report of selectedReports) {
      for (const task of report.tasks) {
        const project = task.project ?? report.project;
        const existing = workloadMap.get(project.id);

        if (existing) {
          existing.taskCount += 1;
          existing.actualMinutes += task.actualMinutes;
        } else {
          workloadMap.set(project.id, {
            projectId: project.id,
            projectName: project.name,
            color: project.color,
            taskCount: 1,
            actualMinutes: task.actualMinutes,
          });
        }
      }
    }

    const timeTypeMap = new Map<string, number>();

    for (const report of selectedReports) {
      for (const entry of report.timeEntries) {
        timeTypeMap.set(
          entry.taskType,
          (timeTypeMap.get(entry.taskType) ?? 0) + entry.minutes,
        );
      }
    }

    const timeByTaskType = Array.from(timeTypeMap.entries()).map(
      ([taskType, minutes]) => ({
        taskType,
        minutes,
        hours: Number((minutes / 60).toFixed(1)),
      }),
    );

    const trendMap = new Map<
      string,
      {
        weekStart: string;
        completedTasks: number;
        totalTasks: number;
      }
    >();

    for (let offset = -35; offset <= 0; offset += 7) {
      const week = this.addDays(selectedWeek, offset);
      const key = this.toDateKey(week);

      trendMap.set(key, {
        weekStart: key,
        completedTasks: 0,
        totalTasks: 0,
      });
    }

    for (const report of trendReports) {
      const key = this.toDateKey(report.weekStart);
      const trend = trendMap.get(key);

      if (!trend) {
        continue;
      }

      trend.totalTasks += report.tasks.length;
      trend.completedTasks += report.tasks.filter(
        (task) => task.status === TaskStatus.COMPLETED,
      ).length;
    }

    const tasksTrend = Array.from(trendMap.values());

    const activity = recentReviews.map((review) => ({
      id: review.id,
      type:
        review.action === ReviewActionType.APPROVED
          ? 'REPORT_APPROVED'
          : 'CHANGES_REQUESTED',
      message:
        review.action === ReviewActionType.APPROVED
          ? `${review.reviewer.firstName} ${review.reviewer.lastName} approved ${review.report.author.firstName} ${review.report.author.lastName}'s report`
          : `${review.reviewer.firstName} ${review.reviewer.lastName} requested changes to ${review.report.author.firstName} ${review.report.author.lastName}'s report`,
      reportId: review.report.id,
      versionNumber: review.version.versionNumber,
      createdAt: review.createdAt,
    }));

    return {
      selectedWeek: {
        start: selectedWeek,
        end: selectedWeekEnd,
        submissionDeadline,
      },

      summary: {
        totalTeamMembers: teamMembers.length,
        submitted: submittedReports.length,
        approved: approvedReports.length,
        needsCorrection: needsCorrectionReports.length,
        draft: draftReports.length,
        notStarted: notStartedCount,
        late: lateCount,
        openBlockers,
        complianceRate,
      },

      statusByMember,

      charts: {
        tasksTrend,
        workloadByProject: Array.from(workloadMap.values()).map((item) => ({
          ...item,
          actualHours: Number((item.actualMinutes / 60).toFixed(1)),
        })),
        timeByTaskType,
      },

      activity,
    };
  }

  private getMonday(date: Date): Date {
    const normalizedDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const day = normalizedDate.getUTCDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    normalizedDate.setUTCDate(normalizedDate.getUTCDate() - daysSinceMonday);

    return normalizedDate;
  }

  private addDays(date: Date, numberOfDays: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + numberOfDays);

    return result;
  }

  private endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setUTCHours(23, 59, 59, 999);

    return result;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
