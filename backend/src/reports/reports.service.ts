import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateReportDto } from './dto/create-report.dto.js';
import type { ListReportsQueryDto } from './dto/list-reports-query.dto.js';
import type { UpdateReportDto } from './dto/update-report.dto.js';

const reportInclude = {
  project: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  tasks: {
    include: {
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  nextWeekTasks: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  blockers: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  achievements: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  timeEntries: {
    orderBy: {
      taskType: 'asc',
    },
  },
  links: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  versions: {
    include: {
      reviewAction: {
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      versionNumber: 'desc',
    },
  },
} satisfies Prisma.WeeklyReportInclude;

type ReportWithDetails = Prisma.WeeklyReportGetPayload<{
  include: typeof reportInclude;
}>;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateReportDto) {
    const weekStart = this.toDate(dto.weekStart);
    const weekEnd = this.toDate(dto.weekEnd);

    this.validateWeekRange(weekStart, weekEnd);
    this.validateCollections(dto);

    await this.validateProjects(
      dto.projectId,
      dto.tasks?.map((task) => task.projectId),
    );

    const existingReport = await this.prisma.weeklyReport.findUnique({
      where: {
        authorId_weekStart: {
          authorId,
          weekStart,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingReport) {
      throw new ConflictException('You already have a report for this week');
    }

    return this.prisma.weeklyReport.create({
      data: {
        authorId,
        projectId: dto.projectId,
        weekStart,
        weekEnd,
        notes: dto.notes?.trim() || null,

        tasks: dto.tasks?.length
          ? {
              create: dto.tasks.map((task) => ({
                name: task.name.trim(),
                projectId: task.projectId,
                priority: task.priority,
                plannedPercentage: task.plannedPercentage,
                actualPercentage: task.actualPercentage,
                status: task.status,
                plannedMinutes: task.plannedMinutes,
                actualMinutes: task.actualMinutes,
                deliverable: task.deliverable?.trim() || null,
              })),
            }
          : undefined,

        nextWeekTasks: dto.nextWeekTasks?.length
          ? {
              create: dto.nextWeekTasks.map((task) => ({
                name: task.name.trim(),
                description: task.description?.trim() || null,
                priority: task.priority,
              })),
            }
          : undefined,

        blockers: dto.blockers?.length
          ? {
              create: dto.blockers.map((blocker) => ({
                title: blocker.title.trim(),
                description: blocker.description?.trim() || null,
                isKeyIssue: blocker.isKeyIssue,
                isResolved: blocker.isResolved,
              })),
            }
          : undefined,

        achievements: dto.achievements?.length
          ? {
              create: dto.achievements.map((achievement) => ({
                title: achievement.title.trim(),
                description: achievement.description?.trim() || null,
                isKeyAchievement: achievement.isKeyAchievement,
              })),
            }
          : undefined,

        timeEntries: dto.timeEntries?.length
          ? {
              create: dto.timeEntries.map((entry) => ({
                taskType: entry.taskType,
                minutes: entry.minutes,
              })),
            }
          : undefined,

        links: dto.links?.length
          ? {
              create: dto.links.map((link) => ({
                label: link.label.trim(),
                url: link.url.trim(),
              })),
            }
          : undefined,
      },
      include: reportInclude,
    });
  }

  async findMyReports(authorId: string, query: ListReportsQueryDto) {
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.WeeklyReportWhereInput = {
      authorId,

      ...(query.status && {
        status: query.status,
      }),

      ...(query.projectId && {
        projectId: query.projectId,
      }),

      ...((query.dateFrom || query.dateTo) && {
        weekStart: {
          ...(query.dateFrom && {
            gte: this.toDate(query.dateFrom),
          }),
          ...(query.dateTo && {
            lte: this.toDate(query.dateTo),
          }),
        },
      }),
    };

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.weeklyReport.findMany({
        where,
        skip,
        take: query.limit,
        select: {
          id: true,
          weekStart: true,
          weekEnd: true,
          status: true,
          latestReviewerComment: true,
          submittedAt: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              blockers: true,
              achievements: true,
              versions: true,
            },
          },
        },
        orderBy: {
          weekStart: 'desc',
        },
      }),

      this.prisma.weeklyReport.count({
        where,
      }),
    ]);

    return {
      data: reports,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findMyReport(
    authorId: string,
    reportId: string,
  ): Promise<ReportWithDetails> {
    const report = await this.prisma.weeklyReport.findFirst({
      where: {
        id: reportId,
        authorId,
      },
      include: reportInclude,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async update(authorId: string, reportId: string, dto: UpdateReportDto) {
    const existingReport = await this.findEditableReport(authorId, reportId);

    const weekStart = dto.weekStart
      ? this.toDate(dto.weekStart)
      : existingReport.weekStart;

    const weekEnd = dto.weekEnd
      ? this.toDate(dto.weekEnd)
      : existingReport.weekEnd;

    this.validateWeekRange(weekStart, weekEnd);
    this.validateCollections(dto);

    const projectId = dto.projectId ?? existingReport.projectId;

    await this.validateProjects(
      projectId,
      dto.tasks?.map((task) => task.projectId),
    );

    if (dto.weekStart) {
      const conflictingReport = await this.prisma.weeklyReport.findFirst({
        where: {
          authorId,
          weekStart,
          id: {
            not: reportId,
          },
        },
        select: {
          id: true,
        },
      });

      if (conflictingReport) {
        throw new ConflictException('You already have a report for this week');
      }
    }

    return this.prisma.weeklyReport.update({
      where: {
        id: reportId,
      },
      data: {
        ...(dto.projectId !== undefined && {
          projectId: dto.projectId,
        }),

        ...(dto.weekStart !== undefined && {
          weekStart,
        }),

        ...(dto.weekEnd !== undefined && {
          weekEnd,
        }),

        ...(dto.notes !== undefined && {
          notes: dto.notes.trim() || null,
        }),

        ...(dto.tasks !== undefined && {
          tasks: {
            deleteMany: {},
            create: dto.tasks.map((task) => ({
              name: task.name.trim(),
              projectId: task.projectId,
              priority: task.priority,
              plannedPercentage: task.plannedPercentage,
              actualPercentage: task.actualPercentage,
              status: task.status,
              plannedMinutes: task.plannedMinutes,
              actualMinutes: task.actualMinutes,
              deliverable: task.deliverable?.trim() || null,
            })),
          },
        }),

        ...(dto.nextWeekTasks !== undefined && {
          nextWeekTasks: {
            deleteMany: {},
            create: dto.nextWeekTasks.map((task) => ({
              name: task.name.trim(),
              description: task.description?.trim() || null,
              priority: task.priority,
            })),
          },
        }),

        ...(dto.blockers !== undefined && {
          blockers: {
            deleteMany: {},
            create: dto.blockers.map((blocker) => ({
              title: blocker.title.trim(),
              description: blocker.description?.trim() || null,
              isKeyIssue: blocker.isKeyIssue,
              isResolved: blocker.isResolved,
            })),
          },
        }),

        ...(dto.achievements !== undefined && {
          achievements: {
            deleteMany: {},
            create: dto.achievements.map((achievement) => ({
              title: achievement.title.trim(),
              description: achievement.description?.trim() || null,
              isKeyAchievement: achievement.isKeyAchievement,
            })),
          },
        }),

        ...(dto.timeEntries !== undefined && {
          timeEntries: {
            deleteMany: {},
            create: dto.timeEntries.map((entry) => ({
              taskType: entry.taskType,
              minutes: entry.minutes,
            })),
          },
        }),

        ...(dto.links !== undefined && {
          links: {
            deleteMany: {},
            create: dto.links.map((link) => ({
              label: link.label.trim(),
              url: link.url.trim(),
            })),
          },
        }),
      },
      include: reportInclude,
    });
  }

  async submit(authorId: string, reportId: string) {
    const report = await this.findEditableReport(authorId, reportId);

    this.validateForSubmission(report);

    return this.prisma.$transaction(async (transaction) => {
      const latestVersion = await transaction.reportVersion.findFirst({
        where: {
          reportId,
        },
        orderBy: {
          versionNumber: 'desc',
        },
        select: {
          versionNumber: true,
        },
      });

      const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;

      const snapshot = JSON.parse(
        JSON.stringify({
          project: report.project,
          weekStart: report.weekStart,
          weekEnd: report.weekEnd,
          notes: report.notes,
          tasks: report.tasks,
          nextWeekTasks: report.nextWeekTasks,
          blockers: report.blockers,
          achievements: report.achievements,
          timeEntries: report.timeEntries,
          links: report.links,
        }),
      ) as Prisma.InputJsonValue;

      const version = await transaction.reportVersion.create({
        data: {
          reportId,
          versionNumber,
          content: snapshot,
        },
      });

      const updatedReport = await transaction.weeklyReport.update({
        where: {
          id: reportId,
        },
        data: {
          status: ReportStatus.SUBMITTED,
          submittedAt: new Date(),
          approvedAt: null,
          latestReviewerComment: null,
        },
        include: reportInclude,
      });

      return {
        message: 'Report submitted successfully',
        version: {
          id: version.id,
          versionNumber: version.versionNumber,
          submittedAt: version.submittedAt,
        },
        report: updatedReport,
      };
    });
  }

  private async findEditableReport(
    authorId: string,
    reportId: string,
  ): Promise<ReportWithDetails> {
    const report = await this.prisma.weeklyReport.findFirst({
      where: {
        id: reportId,
        authorId,
      },
      include: reportInclude,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (
      report.status !== ReportStatus.DRAFT &&
      report.status !== ReportStatus.NEEDS_CORRECTION
    ) {
      throw new BadRequestException(
        'Only draft reports or reports needing correction can be edited',
      );
    }

    return report;
  }

  private validateForSubmission(report: ReportWithDetails): void {
    if (report.tasks.length === 0) {
      throw new BadRequestException(
        'At least one completed task is required before submission',
      );
    }

    if (report.nextWeekTasks.length === 0) {
      throw new BadRequestException(
        'At least one task planned for next week is required',
      );
    }

    if (report.achievements.length === 0) {
      throw new BadRequestException('At least one achievement is required');
    }

    const keyIssueCount = report.blockers.filter(
      (blocker) => blocker.isKeyIssue,
    ).length;

    if (keyIssueCount > 1) {
      throw new BadRequestException(
        'Only one blocker can be marked as the key issue',
      );
    }

    const keyAchievementCount = report.achievements.filter(
      (achievement) => achievement.isKeyAchievement,
    ).length;

    if (keyAchievementCount > 1) {
      throw new BadRequestException(
        'Only one achievement can be marked as the key achievement',
      );
    }
  }

  private validateCollections(dto: CreateReportDto | UpdateReportDto): void {
    const keyIssueCount =
      dto.blockers?.filter((blocker) => blocker.isKeyIssue).length ?? 0;

    if (keyIssueCount > 1) {
      throw new BadRequestException(
        'Only one blocker can be marked as the key issue',
      );
    }

    const keyAchievementCount =
      dto.achievements?.filter((achievement) => achievement.isKeyAchievement)
        .length ?? 0;

    if (keyAchievementCount > 1) {
      throw new BadRequestException(
        'Only one achievement can be marked as the key achievement',
      );
    }

    if (dto.timeEntries) {
      const taskTypes = dto.timeEntries.map((entry) => entry.taskType);

      if (new Set(taskTypes).size !== taskTypes.length) {
        throw new BadRequestException(
          'Each time-entry task type can only appear once',
        );
      }
    }
  }

  private async validateProjects(
    mainProjectId: string,
    taskProjectIds: Array<string | undefined> = [],
  ): Promise<void> {
    const projectIds = [
      ...new Set([
        mainProjectId,
        ...taskProjectIds.filter((id): id is string => id !== undefined),
      ]),
    ];

    const projectCount = await this.prisma.project.count({
      where: {
        id: {
          in: projectIds,
        },
        isActive: true,
      },
    });

    if (projectCount !== projectIds.length) {
      throw new BadRequestException(
        'One or more selected projects are invalid',
      );
    }
  }

  private toDate(value: string): Date {
    const datePart = value.slice(0, 10);

    return new Date(`${datePart}T00:00:00.000Z`);
  }

  private validateWeekRange(weekStart: Date, weekEnd: Date): void {
    if (Number.isNaN(weekStart.getTime()) || Number.isNaN(weekEnd.getTime())) {
      throw new BadRequestException('Invalid report date range');
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const differenceInDays =
      (weekEnd.getTime() - weekStart.getTime()) / millisecondsPerDay;

    if (differenceInDays !== 6) {
      throw new BadRequestException(
        'The report date range must cover exactly seven days',
      );
    }
  }
}
