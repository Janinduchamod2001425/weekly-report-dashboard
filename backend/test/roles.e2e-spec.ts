import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Mock } from 'jest-mock';

import { RolesGuard } from '../src/auth/guards/roles.guard.js';

type TestRole = 'TEAM_MEMBER' | 'MANAGER' | 'ADMIN';

interface TestRequest {
  user?: {
    id: string;
    role: TestRole;
  };
}

function createExecutionContext(role?: TestRole): ExecutionContext {
  const request: TestRequest = role
    ? {
        user: {
          id: 'test-user-id',
          role,
        },
      }
    : {};

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard RBAC', () => {
  let rolesGuard: RolesGuard;
  let getAllAndOverrideMock: Mock;

  beforeEach(() => {
    getAllAndOverrideMock = jest.fn();

    const reflector = {
      getAllAndOverride: getAllAndOverrideMock,
    } as unknown as Reflector;

    rolesGuard = new RolesGuard(reflector);
  });

  it('allows access when an endpoint has no role restriction', () => {
    getAllAndOverrideMock.mockReturnValue(undefined);

    const context = createExecutionContext('TEAM_MEMBER');

    expect(rolesGuard.canActivate(context)).toBe(true);

    expect(getAllAndOverrideMock).toHaveBeenCalledWith(expect.anything(), [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('allows a manager to access a manager endpoint', () => {
    getAllAndOverrideMock.mockReturnValue(['MANAGER', 'ADMIN']);

    const context = createExecutionContext('MANAGER');

    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('allows an administrator to access a manager endpoint', () => {
    getAllAndOverrideMock.mockReturnValue(['MANAGER', 'ADMIN']);

    const context = createExecutionContext('ADMIN');

    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('denies a team member access to a manager endpoint', () => {
    getAllAndOverrideMock.mockReturnValue(['MANAGER', 'ADMIN']);

    const context = createExecutionContext('TEAM_MEMBER');

    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);

    expect(() => rolesGuard.canActivate(context)).toThrow(
      'You do not have permission to perform this action',
    );
  });

  it('denies access when the authenticated user is unavailable', () => {
    getAllAndOverrideMock.mockReturnValue(['ADMIN']);

    const context = createExecutionContext();

    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows only administrators into an administrator endpoint', () => {
    getAllAndOverrideMock.mockReturnValue(['ADMIN']);

    const adminContext = createExecutionContext('ADMIN');
    const managerContext = createExecutionContext('MANAGER');
    const memberContext = createExecutionContext('TEAM_MEMBER');

    expect(rolesGuard.canActivate(adminContext)).toBe(true);

    expect(() => rolesGuard.canActivate(managerContext)).toThrow(
      ForbiddenException,
    );

    expect(() => rolesGuard.canActivate(memberContext)).toThrow(
      ForbiddenException,
    );
  });
});
