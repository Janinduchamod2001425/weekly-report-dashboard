import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: {
    getAllAndOverride: ReturnType<typeof vi.fn>;
  };

  function createContext(role?: UserRole): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: role
            ? {
                id: 'test-user-id',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                role,
                jobTitle: null,
              }
            : undefined,
        }),
      }),
      getHandler: () => function handler() {},
      getClass: () => class TestController {},
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };

    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(createContext(UserRole.TEAM_MEMBER));

    expect(result).toBe(true);
  });

  it('allows a manager to access a manager endpoint', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.MANAGER,
      UserRole.ADMIN,
    ]);

    const result = guard.canActivate(createContext(UserRole.MANAGER));

    expect(result).toBe(true);
  });

  it('allows an admin to access a manager endpoint', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.MANAGER,
      UserRole.ADMIN,
    ]);

    const result = guard.canActivate(createContext(UserRole.ADMIN));

    expect(result).toBe(true);
  });

  it('rejects a team member from a manager endpoint', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.MANAGER,
      UserRole.ADMIN,
    ]);

    expect(() =>
      guard.canActivate(createContext(UserRole.TEAM_MEMBER)),
    ).toThrow(ForbiddenException);
  });

  it('rejects access when the authenticated user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.MANAGER]);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });
});
