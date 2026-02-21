import { describe, it, expect, beforeEach } from 'vitest';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { GraphQLError } from 'graphql';
import { createGraphQLErrorFormatter } from '../errors/formatter';
import { NotFoundError, UnauthorizedError, ErrorCode } from '../../../errors';
import { setCorrelationId } from '../../../telemetry/utils/context';

beforeEach(() => {
  const manager = new AsyncLocalStorageContextManager();
  manager.enable();
  context.setGlobalContextManager(manager);
});

describe('createGraphQLErrorFormatter', () => {
  it('adds correlationId to GraphQL errors', async () => {
    const formatter = createGraphQLErrorFormatter();
    const error = new GraphQLError('Test error');

    const ctx = setCorrelationId('formatter-test-123');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);

      expect(result.response.errors).toBeDefined();
      expect(result.response.errors![0].message).toBe('Test error');
      expect(result.response.errors![0].extensions?.correlationId).toBe('formatter-test-123');
    });
  });

  it('preserves error codes from AppError instances', async () => {
    const formatter = createGraphQLErrorFormatter();
    const appError = new NotFoundError('User', 'user-123');
    const error = new GraphQLError('User with id user-123 not found', {
      originalError: appError,
    });

    const ctx = setCorrelationId('code-test-456');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.message).toBe('User with id user-123 not found');
      expect(formatted.extensions?.code).toBe('NOT_FOUND');
      expect(formatted.extensions?.errorCode).toBe(ErrorCode.NOT_FOUND);
      expect(formatted.extensions?.correlationId).toBe('code-test-456');
    });
  });

  it('preserves errorCode from UnauthorizedError', async () => {
    const formatter = createGraphQLErrorFormatter();
    const appError = new UnauthorizedError('Invalid token');
    const error = new GraphQLError('Invalid token', {
      originalError: appError,
    });

    const ctx = setCorrelationId('auth-test-789');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.message).toBe('Invalid token');
      expect(formatted.extensions?.code).toBe('UNAUTHORIZED');
      expect(formatted.extensions?.errorCode).toBe(ErrorCode.UNAUTHORIZED);
      expect(formatted.extensions?.correlationId).toBe('auth-test-789');
    });
  });

  it('handles GraphQL validation errors', async () => {
    const formatter = createGraphQLErrorFormatter();
    const error = new GraphQLError('Syntax Error: Unexpected token', {
      extensions: {
        code: 'GRAPHQL_VALIDATION_FAILED',
      },
    });

    const ctx = setCorrelationId('validation-test-123');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.message).toBe('Syntax Error: Unexpected token');
      expect(formatted.extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
      expect(formatted.extensions?.correlationId).toBe('validation-test-123');
    });
  });

  it('preserves existing extensions from error', async () => {
    const formatter = createGraphQLErrorFormatter();
    const error = new GraphQLError('Custom error', {
      extensions: {
        code: 'CUSTOM_CODE',
        customField: 'customValue',
        timestamp: '2024-01-01T00:00:00Z',
      },
    });

    const ctx = setCorrelationId('extensions-test-456');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.extensions?.code).toBe('CUSTOM_CODE');
      expect(formatted.extensions?.customField).toBe('customValue');
      expect(formatted.extensions?.timestamp).toBe('2024-01-01T00:00:00Z');
      expect(formatted.extensions?.correlationId).toBe('extensions-test-456');
    });
  });

  it('generates correlationId when not in context', () => {
    const formatter = createGraphQLErrorFormatter();
    const error = new GraphQLError('Test error');

    const result = formatter({ errors: [error] }, {} as any);
    const formatted = result.response.errors![0];

    expect(formatted.extensions?.correlationId).toBeDefined();
    expect(formatted.extensions?.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('does not override existing correlationId in extensions', async () => {
    const formatter = createGraphQLErrorFormatter();
    const error = new GraphQLError('Test error', {
      extensions: {
        correlationId: 'existing-correlation-id',
      },
    });

    const ctx = setCorrelationId('new-correlation-id');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.extensions?.correlationId).toBe('existing-correlation-id');
    });
  });

  it('preserves statusCode from AppError', async () => {
    const formatter = createGraphQLErrorFormatter();
    const appError = new NotFoundError('Resource', 'res-456');
    const error = new GraphQLError('Resource with id res-456 not found', {
      originalError: appError,
    });

    const ctx = setCorrelationId('status-test-123');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.extensions?.httpStatus).toBe(404);
      expect(formatted.extensions?.code).toBe('NOT_FOUND');
      expect(formatted.extensions?.errorCode).toBe(ErrorCode.NOT_FOUND);
    });
  });

  it('handles errors without originalError', async () => {
    const formatter = createGraphQLErrorFormatter();
    const error = new GraphQLError('Direct GraphQL error');

    const ctx = setCorrelationId('direct-test-456');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.message).toBe('Direct GraphQL error');
      expect(formatted.extensions?.correlationId).toBe('direct-test-456');
      expect(formatted.extensions?.errorCode).toBeUndefined();
    });
  });

  it('preserves error path information', async () => {
    const formatter = createGraphQLErrorFormatter();
    const error = new GraphQLError('Field error', {
      path: ['user', 'profile', 'email'],
    });

    const ctx = setCorrelationId('path-test-789');

    await context.with(ctx, () => {
      const result = formatter({ errors: [error] }, {} as any);
      const formatted = result.response.errors![0];

      expect(formatted.path).toEqual(['user', 'profile', 'email']);
      expect(formatted.extensions?.correlationId).toBe('path-test-789');
    });
  });
});
