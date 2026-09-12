import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, type Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.isActive !== undefined && {
        isActive: query.isActive,
      }),
      ...(search && {
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            jobTitle: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          jobTitle: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          projectMemberships: {
            select: {
              project: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              reports: true,
            },
          },
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
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        jobTitle: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        projectMemberships: {
          select: {
            assignedAt: true,
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
                isActive: true,
              },
            },
          },
        },
        reports: {
          select: {
            id: true,
            weekStart: true,
            weekEnd: true,
            status: true,
            submittedAt: true,
            approvedAt: true,
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: {
            weekStart: 'desc',
          },
          take: 20,
        },
        _count: {
          select: {
            reports: true,
            teamMembers: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    await this.validateManager(dto.managerId);
    await this.validateProjects(dto.projectIds);

    const passwordHash = await hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email,
        passwordHash,
        role: dto.role ?? UserRole.TEAM_MEMBER,
        jobTitle: dto.jobTitle?.trim() || null,
        managerId: dto.managerId,
        projectMemberships: dto.projectIds?.length
          ? {
              create: dto.projectIds.map((projectId) => ({
                projectId,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        jobTitle: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, currentUserId: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (
      id === currentUserId &&
      (dto.isActive === false || dto.role !== undefined)
    ) {
      throw new BadRequestException(
        'You cannot deactivate or change your own role',
      );
    }

    const email = dto.email?.trim().toLowerCase();

    if (email) {
      const conflictingUser = await this.prisma.user.findFirst({
        where: {
          email,
          id: {
            not: id,
          },
        },
        select: { id: true },
      });

      if (conflictingUser) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
    }

    await this.validateManager(dto.managerId, id);
    await this.validateProjects(dto.projectIds);

    return this.prisma.$transaction(async (transaction) => {
      if (dto.projectIds !== undefined) {
        await transaction.projectMember.deleteMany({
          where: {
            userId: id,
          },
        });

        if (dto.projectIds.length > 0) {
          await transaction.projectMember.createMany({
            data: dto.projectIds.map((projectId) => ({
              userId: id,
              projectId,
            })),
          });
        }
      }

      return transaction.user.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined && {
            firstName: dto.firstName.trim(),
          }),
          ...(dto.lastName !== undefined && {
            lastName: dto.lastName.trim(),
          }),
          ...(email !== undefined && { email }),
          ...(dto.role !== undefined && { role: dto.role }),
          ...(dto.jobTitle !== undefined && {
            jobTitle: dto.jobTitle.trim() || null,
          }),
          ...(dto.managerId !== undefined && {
            managerId: dto.managerId,
          }),
          ...(dto.isActive !== undefined && {
            isActive: dto.isActive,
          }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          jobTitle: true,
          isActive: true,
          managerId: true,
          updatedAt: true,
        },
      });
    });
  }

  private async validateManager(
    managerId?: string,
    userId?: string,
  ): Promise<void> {
    if (!managerId) {
      return;
    }

    if (managerId === userId) {
      throw new BadRequestException(
        'A user cannot be assigned as their own manager',
      );
    }

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (
      !manager ||
      !manager.isActive ||
      (manager.role !== UserRole.MANAGER && manager.role !== UserRole.ADMIN)
    ) {
      throw new BadRequestException('The selected manager is invalid');
    }
  }

  private async validateProjects(projectIds?: string[]): Promise<void> {
    if (!projectIds) {
      return;
    }

    const uniqueProjectIds = [...new Set(projectIds)];

    if (uniqueProjectIds.length !== projectIds.length) {
      throw new BadRequestException('Duplicate project IDs are not allowed');
    }

    const projectCount = await this.prisma.project.count({
      where: {
        id: {
          in: uniqueProjectIds,
        },
        isActive: true,
      },
    });

    if (projectCount !== uniqueProjectIds.length) {
      throw new BadRequestException(
        'One or more selected projects are invalid',
      );
    }
  }
}
