import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, ReviewActionType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import type { ApproveReportDto } from './dto/approve-report.dto.js';
import type { ManagerReportsQueryDto } from './dto/manager-reports-query.dto.js';
import type { RequestChangesDto } from './dto/request-changes.dto.js';

const managerReportInclude = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
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
              email: true,
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

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ManagerReportsQueryDto) {
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.WeeklyReportWhereInput = {
      ...(query.teamMemberId && {
        authorId: query.teamMemberId,
      }),

      ...(query.projectId && {
        projectId: query.projectId,
      }),

      ...(query.status && {
        status: query.status,
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
          submittedAt: true,
          approvedAt: true,
          latestReviewerComment: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          _count: {
            select: {
              tasks: true,
              blockers: true,
              achievements: true,
              versions: true,
            },
          },
        },
        orderBy: [
          {
            weekStart: 'desc',
          },
          {
            submittedAt: 'desc',
          },
        ],
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

  async findOne(reportId: string) {
    const report = await this.prisma.weeklyReport.findUnique({
      where: {
        id: reportId,
      },
      include: managerReportInclude,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === ReportStatus.DRAFT) {
      throw new BadRequestException(
        'Draft report content is private to the team member',
      );
    }

    return report;
  }

  async requestChanges(
    reportId: string,
    reviewerId: string,
    dto: RequestChangesDto,
  ) {
    const report = await this.findSubmittedReport(reportId);
    const comment = dto.comment.trim();

    return this.prisma.$transaction(async (transaction) => {
      const reviewAction = await transaction.reviewAction.create({
        data: {
          reportId,
          versionId: report.versions[0].id,
          reviewerId,
          action: ReviewActionType.REQUESTED_CHANGES,
          comment,
        },
      });

      const updatedReport = await transaction.weeklyReport.update({
        where: {
          id: reportId,
        },
        data: {
          status: ReportStatus.NEEDS_CORRECTION,
          latestReviewerComment: comment,
          approvedAt: null,
        },
        select: {
          id: true,
          status: true,
          latestReviewerComment: true,
          updatedAt: true,
        },
      });

      return {
        message: 'Report returned for correction',
        reviewAction,
        report: updatedReport,
      };
    });
  }

  async approve(reportId: string, reviewerId: string, dto: ApproveReportDto) {
    const report = await this.findSubmittedReport(reportId);
    const comment = dto.comment?.trim() || null;

    return this.prisma.$transaction(async (transaction) => {
      const reviewAction = await transaction.reviewAction.create({
        data: {
          reportId,
          versionId: report.versions[0].id,
          reviewerId,
          action: ReviewActionType.APPROVED,
          comment,
        },
      });

      const updatedReport = await transaction.weeklyReport.update({
        where: {
          id: reportId,
        },
        data: {
          status: ReportStatus.APPROVED,
          latestReviewerComment: comment,
          approvedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          latestReviewerComment: true,
          approvedAt: true,
          updatedAt: true,
        },
      });

      return {
        message: 'Report approved successfully',
        reviewAction,
        report: updatedReport,
      };
    });
  }

  private async findSubmittedReport(reportId: string) {
    const report = await this.prisma.weeklyReport.findUnique({
      where: {
        id: reportId,
      },
      select: {
        id: true,
        status: true,
        versions: {
          select: {
            id: true,
            versionNumber: true,
            reviewAction: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            versionNumber: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted reports can be reviewed');
    }

    const currentVersion = report.versions[0];

    if (!currentVersion) {
      throw new BadRequestException(
        'The report does not have a submitted version',
      );
    }

    if (currentVersion.reviewAction) {
      throw new BadRequestException(
        'The current report version has already been reviewed',
      );
    }

    return report;
  }

  private toDate(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }
}
