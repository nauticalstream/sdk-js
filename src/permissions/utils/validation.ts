import { ValidationError } from '../../errors';

export function assertNonEmpty(value: string, name: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${name} must not be empty`);
  }
}