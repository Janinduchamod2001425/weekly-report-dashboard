import {
  Prisma,
  PrismaClient,
  ReportStatus,
  ReviewActionType,
  TaskPriority,
  TaskStatus,
  TaskType,
  UserRole,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

function getMonday(date: Date): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  const day = result.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  result.setUTCDate(result.getUTCDate() - daysSinceMonday);

  return result;
}

function createSnapshot(
  memberName: string,
  projectName: string,
  weekStart: Date,
  versionNumber: number,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify({
      project: {
        name: projectName,
      },
      weekStart,
      weekEnd: addDays(weekStart, 6),
      notes:
        versionNumber === 1
          ? `Initial weekly report submitted by ${memberName}.`
          : `Corrected weekly report submitted by ${memberName}.`,
      tasks: [
        {
          name: `Complete ${projectName} development work`,
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: versionNumber === 1 ? 85 : 100,
          status:
            versionNumber === 1 ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED,
          plannedMinutes: 960,
          actualMinutes: versionNumber === 1 ? 840 : 1020,
          deliverable:
            versionNumber === 1
              ? null
              : `${projectName} feature implementation`,
        },
      ],
      nextWeekTasks: [
        {
          name: `Test and improve ${projectName}`,
          priority: TaskPriority.HIGH,
        },
      ],
      blockers: [
        {
          title: 'Pending requirements clarification',
          isKeyIssue: true,
          isResolved: versionNumber > 1,
        },
      ],
      achievements: [
        {
          title: `Completed key ${projectName} milestone`,
          isKeyAchievement: true,
        },
      ],
      timeEntries: [
        {
          taskType: TaskType.DEVELOPMENT,
          minutes: 1200,
        },
        {
          taskType: TaskType.TESTING,
          minutes: 300,
        },
      ],
      links:
        versionNumber === 1
          ? []
          : [
              {
                label: 'Project Repository',
                url: 'https://github.com/example/project',
              },
            ],
    }),
  ) as Prisma.InputJsonValue;
}

async function clearDatabase(): Promise<void> {
  await prisma.reviewAction.deleteMany();
  await prisma.reportVersion.deleteMany();
  await prisma.reportLink.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.blocker.deleteMany();
  await prisma.nextWeekTask.deleteMany();
  await prisma.reportTask.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  console.log('Starting database seed...');

  /*
   * This replaces existing local development data with a consistent
   * demonstration dataset.
   */
  await clearDatabase();

  const adminPassword = await hash('Admin@123', 12);
  const managerPassword = await hash('Manager@123', 12);
  const memberPassword = await hash('Member@123', 12);

  const admin = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@weeklyreport.dev',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      jobTitle: 'System Administrator',
    },
  });

  const manager = await prisma.user.create({
    data: {
      firstName: 'Amal',
      lastName: 'Fernando',
      email: 'manager@weeklyreport.dev',
      passwordHash: managerPassword,
      role: UserRole.MANAGER,
      jobTitle: 'Engineering Manager',
    },
  });

  const memberDetails = [
    {
      firstName: 'Kasun',
      lastName: 'Perera',
      email: 'kasun@weeklyreport.dev',
      jobTitle: 'Backend Engineer',
    },
    {
      firstName: 'Nimali',
      lastName: 'Silva',
      email: 'nimali@weeklyreport.dev',
      jobTitle: 'Frontend Engineer',
    },
    {
      firstName: 'Tharindu',
      lastName: 'Jayasinghe',
      email: 'tharindu@weeklyreport.dev',
      jobTitle: 'QA Engineer',
    },
    {
      firstName: 'Oshadi',
      lastName: 'Fernando',
      email: 'oshadi@weeklyreport.dev',
      jobTitle: 'UI/UX Designer',
    },
    {
      firstName: 'Dinuka',
      lastName: 'Senanayake',
      email: 'dinuka@weeklyreport.dev',
      jobTitle: 'Software Engineer',
    },
  ];

  const members = await Promise.all(
    memberDetails.map((member) =>
      prisma.user.create({
        data: {
          ...member,
          passwordHash: memberPassword,
          role: UserRole.TEAM_MEMBER,
          managerId: manager.id,
        },
      }),
    ),
  );

  const projectData = [
    {
      name: 'Client Portal',
      description: 'Customer-facing account and service management portal',
      color: '#2563EB',
    },
    {
      name: 'Internal Tooling',
      description: 'Internal productivity and business automation tools',
      color: '#7C3AED',
    },
    {
      name: 'Mobile Application',
      description: 'Cross-platform mobile application development',
      color: '#EA580C',
    },
    {
      name: 'Research and Development',
      description: 'Technical research and proof-of-concept development',
      color: '#059669',
    },
  ];

  const projects = await Promise.all(
    projectData.map((project) =>
      prisma.project.create({
        data: project,
      }),
    ),
  );

  await prisma.projectMember.createMany({
    data: [
      {
        userId: members[0].id,
        projectId: projects[0].id,
      },
      {
        userId: members[0].id,
        projectId: projects[1].id,
      },
      {
        userId: members[1].id,
        projectId: projects[0].id,
      },
      {
        userId: members[1].id,
        projectId: projects[2].id,
      },
      {
        userId: members[2].id,
        projectId: projects[0].id,
      },
      {
        userId: members[2].id,
        projectId: projects[2].id,
      },
      {
        userId: members[3].id,
        projectId: projects[2].id,
      },
      {
        userId: members[3].id,
        projectId: projects[3].id,
      },
      {
        userId: members[4].id,
        projectId: projects[1].id,
      },
      {
        userId: members[4].id,
        projectId: projects[3].id,
      },
    ],
  });

  const currentWeek = getMonday(new Date());

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const weekStart = addDays(currentWeek, weekIndex * -7);

    const weekEnd = addDays(weekStart, 6);

    for (let memberIndex = 0; memberIndex < members.length; memberIndex += 1) {
      /*
       * Leave the fifth member without a current-week report
       * so the dashboard shows NOT_STARTED.
       */
      if (weekIndex === 0 && memberIndex === 4) {
        continue;
      }

      const member = members[memberIndex];
      const project = projects[(memberIndex + weekIndex) % projects.length];

      let status: ReportStatus = ReportStatus.APPROVED;

      if (weekIndex === 0) {
        const currentStatuses: ReportStatus[] = [
          ReportStatus.SUBMITTED,
          ReportStatus.APPROVED,
          ReportStatus.NEEDS_CORRECTION,
          ReportStatus.DRAFT,
        ];

        status = currentStatuses[memberIndex] ?? ReportStatus.APPROVED;
      }

      const submittedAt =
        status === ReportStatus.DRAFT ? null : addDays(weekStart, 4);

      const approvedAt =
        status === ReportStatus.APPROVED ? addDays(weekStart, 5) : null;

      const report = await prisma.weeklyReport.create({
        data: {
          authorId: member.id,
          projectId: project.id,
          weekStart,
          weekEnd,
          status,
          submittedAt,
          approvedAt,
          latestReviewerComment:
            status === ReportStatus.NEEDS_CORRECTION
              ? 'Please update the task progress and add the deliverable link.'
              : status === ReportStatus.APPROVED
                ? 'Reviewed and approved.'
                : null,

          notes: `${member.firstName}'s weekly report for ${project.name}.`,

          tasks: {
            create: [
              {
                name: `Implement ${project.name} feature`,
                projectId: project.id,
                priority: TaskPriority.HIGH,
                plannedPercentage: 100,
                actualPercentage:
                  status === ReportStatus.NEEDS_CORRECTION ? 80 : 100,
                status:
                  status === ReportStatus.NEEDS_CORRECTION
                    ? TaskStatus.IN_PROGRESS
                    : TaskStatus.COMPLETED,
                plannedMinutes: 960,
                actualMinutes: 840 + memberIndex * 60,
                deliverable:
                  status === ReportStatus.NEEDS_CORRECTION
                    ? null
                    : `${project.name} implementation`,
              },
              {
                name: `Review ${project.name} requirements`,
                projectId: project.id,
                priority: TaskPriority.MEDIUM,
                plannedPercentage: 100,
                actualPercentage: 100,
                status: TaskStatus.COMPLETED,
                plannedMinutes: 240,
                actualMinutes: 270,
                deliverable: 'Requirements review notes',
              },
            ],
          },

          nextWeekTasks: {
            create: [
              {
                name: `Test ${project.name} features`,
                description: 'Complete functional and integration testing',
                priority: TaskPriority.HIGH,
              },
            ],
          },

          blockers: {
            create:
              memberIndex % 2 === 0
                ? [
                    {
                      title: 'Waiting for requirements clarification',
                      description:
                        'A minor requirement needs confirmation from the project manager.',
                      isKeyIssue: true,
                      isResolved: weekIndex > 0,
                    },
                  ]
                : [],
          },

          achievements: {
            create: [
              {
                title: `Completed ${project.name} milestone`,
                description:
                  'The planned milestone was delivered successfully.',
                isKeyAchievement: true,
              },
            ],
          },

          timeEntries: {
            create: [
              {
                taskType: TaskType.DEVELOPMENT,
                minutes: 1200 + memberIndex * 60,
              },
              {
                taskType: TaskType.TESTING,
                minutes: 300 + weekIndex * 30,
              },
              {
                taskType: TaskType.MEETINGS,
                minutes: 180,
              },
              {
                taskType: TaskType.DOCUMENTATION,
                minutes: 120,
              },
            ],
          },

          links: {
            create: [
              {
                label: 'GitHub Repository',
                url: 'https://github.com/example/project',
              },
            ],
          },
        },
      });

      if (status === ReportStatus.DRAFT) {
        continue;
      }

      const version = await prisma.reportVersion.create({
        data: {
          reportId: report.id,
          versionNumber: 1,
          submittedAt: submittedAt ?? addDays(weekStart, 4),
          content: createSnapshot(
            `${member.firstName} ${member.lastName}`,
            project.name,
            weekStart,
            1,
          ),
        },
      });

      if (status === ReportStatus.APPROVED) {
        await prisma.reviewAction.create({
          data: {
            reportId: report.id,
            versionId: version.id,
            reviewerId: manager.id,
            action: ReviewActionType.APPROVED,
            comment: 'Reviewed and approved.',
            createdAt: approvedAt ?? addDays(weekStart, 5),
          },
        });
      }

      if (status === ReportStatus.NEEDS_CORRECTION) {
        await prisma.reviewAction.create({
          data: {
            reportId: report.id,
            versionId: version.id,
            reviewerId: manager.id,
            action: ReviewActionType.REQUESTED_CHANGES,
            comment:
              'Please update the task progress and add the deliverable link.',
            createdAt: addDays(weekStart, 5),
          },
        });
      }
    }
  }

  /*
   * Add a second version to one previous-week report to demonstrate
   * the mandatory correction -> resubmission -> approval history.
   */
  const versionHistoryReport = await prisma.weeklyReport.findUnique({
    where: {
      authorId_weekStart: {
        authorId: members[0].id,
        weekStart: addDays(currentWeek, -7),
      },
    },
    include: {
      project: true,
      versions: {
        orderBy: {
          versionNumber: 'asc',
        },
      },
    },
  });

  if (versionHistoryReport && versionHistoryReport.versions[0]) {
    await prisma.reviewAction.update({
      where: {
        versionId: versionHistoryReport.versions[0].id,
      },
      data: {
        action: ReviewActionType.REQUESTED_CHANGES,
        comment:
          'Please correct the progress figures and attach the deliverable link.',
      },
    });

    const secondVersion = await prisma.reportVersion.create({
      data: {
        reportId: versionHistoryReport.id,
        versionNumber: 2,
        submittedAt: addDays(versionHistoryReport.weekStart, 6),
        content: createSnapshot(
          `${members[0].firstName} ${members[0].lastName}`,
          versionHistoryReport.project.name,
          versionHistoryReport.weekStart,
          2,
        ),
      },
    });

    await prisma.reviewAction.create({
      data: {
        reportId: versionHistoryReport.id,
        versionId: secondVersion.id,
        reviewerId: manager.id,
        action: ReviewActionType.APPROVED,
        comment: 'The requested corrections were completed. Approved.',
        createdAt: addDays(versionHistoryReport.weekStart, 6),
      },
    });

    await prisma.weeklyReport.update({
      where: {
        id: versionHistoryReport.id,
      },
      data: {
        status: ReportStatus.APPROVED,
        latestReviewerComment:
          'The requested corrections were completed. Approved.',
        submittedAt: secondVersion.submittedAt,
        approvedAt: addDays(versionHistoryReport.weekStart, 6),
      },
    });
  }

  console.log('Database seed completed successfully.');
  console.log('');
  console.log('Demo credentials:');
  console.log('Admin: admin@weeklyreport.dev / Admin@123');
  console.log('Manager: manager@weeklyreport.dev / Manager@123');
  console.log('Member: kasun@weeklyreport.dev / Member@123');
  console.log('All team members use password: Member@123');
  console.log('');
  console.log(`Admin ID: ${admin.id}`);
  console.log(`Manager ID: ${manager.id}`);
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
