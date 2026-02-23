import { ZodError } from 'zod';
import { ValidationError } from '../../../errors';

/**
 * Map ZodError to ValidationError
 * Extracts Zod validation issues and formats them into a ValidationError.
 * 
 * @example
 * ```typescript
 * try {
 *   const data = MySchema.parse(input);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     throw mapZodError(error, 'Invalid request body');
 *   }
 *   throw error;
 * }
 * ```
 */
export function mapZodError(error: ZodError, message = 'Validation failed'): ValidationError {
  const details = error.issues.map((issue: any) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return new ValidationError(message, details);
}

/**
 * Check if error is a ZodError
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError || (error as any)?.name === 'ZodError';
}
