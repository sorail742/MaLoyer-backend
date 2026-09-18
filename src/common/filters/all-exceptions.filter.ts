import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../http/response.types';

/**
 * Filtre d'exception global — voir
 * darmeuble-kit/docs/backend/coding-rules-backend.md §"Contrat de réponse
 * HTTP". Toute exception devient `{ success: false, error: {...} }`, miroir
 * exact de l'enveloppe de succès (`ResponseInterceptor`) : le frontend peut
 * toujours lire `success` en premier.
 *
 * **Ne jamais renvoyer un autre format d'erreur depuis un controller** —
 * laisser ce filtre s'en charger.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // `Number(...)` plutôt qu'un cast : `status` est un `number` nu (retour
    // de `getStatus()`), `@typescript-eslint/no-unsafe-enum-comparison`
    // refuse de le comparer directement à un littéral `HttpStatus` — un
    // simple `as number` serait lui-même rejeté comme assertion inutile
    // par `no-unnecessary-type-assertion`, d'où la conversion réelle.
    const isServerError = status >= Number(HttpStatus.INTERNAL_SERVER_ERROR);

    // Les 5xx inattendues ne fuient jamais de détail d'implémentation —
    // seules les erreurs HTTP explicites (4xx, ou 5xx levées
    // volontairement) portent leur message réel.
    interface ParsedBody {
      message: string | string[];
      error?: string;
      code?: string;
    }

    let parsed: ParsedBody;
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      parsed =
        typeof body === 'string'
          ? { message: body, error: exception.constructor.name }
          : (body as ParsedBody);
    } else {
      parsed = { message: 'Erreur interne du serveur' };
    }

    if (isServerError) {
      // Ne jamais logger le corps d'une requête d'auth ni un secret — voir
      // darmeuble-kit/docs/backend/coding-rules-backend.md.
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        statusCode: status,
        message: isServerError ? 'Erreur interne du serveur' : parsed.message,
        error: parsed.error ?? 'Error',
        code: parsed.code,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(errorResponse);
  }
}
