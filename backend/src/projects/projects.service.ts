import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.project.findMany({
      where: includeInactive
        ? undefined
        : {
            isActive: true,
          },
      include: {
        _count: {
          select: {
            members: true,
            reports: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true,
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
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    const name = dto.name.trim();

    const existingProject = await this.prisma.project.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existingProject) {
      throw new ConflictException('A project with this name already exists');
    }

    return this.prisma.project.create({
      data: {
        name,
        description: dto.description?.trim() || null,
        color: dto.color?.toUpperCase() || null,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    const name = dto.name?.trim();

    if (name) {
      const conflictingProject = await this.prisma.project.findFirst({
        where: {
          name,
          id: {
            not: id,
          },
        },
        select: { id: true },
      });

      if (conflictingProject) {
        throw new ConflictException('A project with this name already exists');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
        ...(dto.color !== undefined && {
          color: dto.color.toUpperCase(),
        }),
      },
    });
  }

  async archive(id: string) {
    await this.findOne(id);

    await this.prisma.project.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return {
      message: 'Project archived successfully',
    };
  }

  async restore(id: string) {
    await this.findOne(id);

    return this.prisma.project.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }
}
