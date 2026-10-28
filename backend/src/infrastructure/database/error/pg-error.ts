import { QueryFailedError } from 'typeorm';

type PgError = Error & { code?: string; constraint?: string };

export const pgError = (event: unknown): PgError | null =>
    event instanceof QueryFailedError ? (event.driverError as PgError) : null;