import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/authenticated-user.interface.js';

interface CookieRequest extends Request {
  cookies: {
    access_token?: string;
  };
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CookieRequest>();
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          jobTitle: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Account is unavailable');
      }

      request.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        jobTitle: user.jobTitle,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication');
    }
  }
}
