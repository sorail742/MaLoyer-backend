/**
 * Configuration typée, chargée une seule fois au boot via
 * `ConfigModule.forRoot({ load: [configuration] })`. `ConfigService<AppConfig, true>`
 * (le second paramètre générique `true` = validation stricte) permet
 * `configService.get('databaseUrl', { infer: true })` avec un type exact —
 * pas de valeur `undefined` silencieuse sur une clef mal orthographiée.
 *
 * Aucune valeur par défaut sensible ici : les secrets sont absents tant que
 * le `.env` local n'est pas rempli, ce qui doit faire échouer le démarrage
 * explicitement (voir `assertRequired`) plutôt que de démarrer avec un JWT
 * secret vide.
 */

function assertRequired(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Variable d'environnement requise manquante : ${name} (voir .env.example)`,
    );
  }
  return value;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  frontendUrl: string;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  refreshTokenCookieName: string;
  otp: {
    ttlSeconds: number;
    codeLength: number;
    maxAttempts: number;
  };
  throttle: {
    ttlMs: number;
    limit: number;
  };
  paymentProvider: string;
  smsProvider: string;
}

export function configuration(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3010',
    databaseUrl: assertRequired('DATABASE_URL', process.env.DATABASE_URL),
    jwt: {
      accessSecret: assertRequired(
        'JWT_ACCESS_SECRET',
        process.env.JWT_ACCESS_SECRET,
      ),
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    refreshTokenCookieName:
      process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'darmeuble_refresh_token',
    otp: {
      ttlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
      codeLength: Number(process.env.OTP_CODE_LENGTH ?? 6),
      maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
    },
    throttle: {
      ttlMs: Number(process.env.THROTTLE_TTL_MS ?? 60000),
      limit: Number(process.env.THROTTLE_LIMIT ?? 100),
    },
    paymentProvider: process.env.PAYMENT_PROVIDER ?? 'mock',
    smsProvider: process.env.SMS_PROVIDER ?? 'console',
  };
}
