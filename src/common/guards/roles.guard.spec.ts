import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../authenticated-user.interface';
import { RolesGuard } from './roles.guard';

function buildContext(user: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it("laisse passer toute requête quand la route n'a pas de @Roles(...)", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = buildContext({
      userId: 'u1',
      sessionId: 's1',
      organizationId: 'org-1',
      role: 'manager',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('autorise un rôle listé dans @Roles(...)', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner', 'accountant']);
    const context = buildContext({
      userId: 'u1',
      sessionId: 's1',
      organizationId: 'org-1',
      role: 'owner',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejette un rôle absent de @Roles(...)', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner']);
    const context = buildContext({
      userId: 'u1',
      sessionId: 's1',
      organizationId: 'org-1',
      role: 'manager',
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
