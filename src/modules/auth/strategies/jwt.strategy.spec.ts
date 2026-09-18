import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/configuration';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('construit AuthenticatedUser uniquement à partir du payload — sans appel base de données (darmeuble-kit/docs/backend/multi-tenant.md)', () => {
    const configService = {
      get: () => ({ accessSecret: 'test-secret' }),
    } as unknown as ConfigService<AppConfig, true>;
    const strategy = new JwtStrategy(configService);

    const result = strategy.validate({
      sub: 'user-1',
      sid: 'session-1',
      role: 'manager',
      organizationId: 'org-1',
    });

    expect(result).toEqual({
      userId: 'user-1',
      sessionId: 'session-1',
      organizationId: 'org-1',
      role: 'manager',
    });
  });
});
