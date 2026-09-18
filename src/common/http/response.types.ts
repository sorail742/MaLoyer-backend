/**
 * Contrat de réponse HTTP — voir
 * darmeuble-kit/docs/backend/coding-rules-backend.md §"Contrat de réponse
 * HTTP".
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: PaginationMeta | Record<string, never>;
}

export interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  /** Code métier stable — à décider au fur et à mesure des besoins réels. */
  // `| undefined` explicite : `exactOptionalPropertyTypes` (tsconfig.json)
  // distingue "absent" de "présent mais undefined" — AllExceptionsFilter
  // assigne toujours cette clef, avec potentiellement `undefined` dedans.
  code?: string | undefined;
  path: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: ErrorBody;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
