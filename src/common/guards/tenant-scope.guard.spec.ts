import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../authenticated-user.interface';
import { TenantScopeGuard } from './tenant-scope.guard';

function buildContext(user: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('TenantScopeGuard', () => {
  const guard = new TenantScopeGuard();

  it('laisse passer un utilisateur rattaché à une organisation', () => {
    const context = buildContext({
      userId: 'user-1',
      sessionId: 'session-1',
      organizationId: 'org-1',
      role: 'owner',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejette un super_admin sans organisation — l'isolation multi-tenant exige un organizationId", () => {
    const context = buildContext({
      userId: 'admin-1',
      sessionId: 'session-1',
      organizationId: null,
      role: 'super_admin',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
