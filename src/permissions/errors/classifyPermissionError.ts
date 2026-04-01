import * as grpc from '@grpc/grpc-js';
import {
  SystemException,
  DomainException,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ServiceUnavailableError,
} from '../../errors/index.js';

function asGrpcCode(error: Error): number | null {
  const candidate = (error as Error & { code?: unknown }).code;
  return typeof candidate === 'number' ? candidate : null;
}

export function classifyPermissionError(error: unknown): Error {
  if (error instanceof SystemException || error instanceof DomainException) {
    return error;
  }

  if (!(error instanceof Error)) {
    return new ServiceUnavailableError('Unknown permissions error', 'permissions');
  }

  const code = asGrpcCode(error);
  const message = error.message || '';

  if (code !== null) {
    switch (code) {
      case grpc.status.INVALID_ARGUMENT:
      case grpc.status.FAILED_PRECONDITION:
        return new ValidationError(message || 'Invalid permissions request');
      case grpc.status.UNAUTHENTICATED:
        return new UnauthorizedError(message || 'Permissions authentication failed');
      case grpc.status.PERMISSION_DENIED:
        return new ForbiddenError(message || 'Permissions access denied');
      case grpc.status.NOT_FOUND:
        return new NotFoundError('Permission resource', message || 'Relationship or schema object not found');
      case grpc.status.DEADLINE_EXCEEDED:
        return new TimeoutError(message || 'Permissions request timed out');
      case grpc.status.UNAVAILABLE:
      case grpc.status.RESOURCE_EXHAUSTED:
      case grpc.status.INTERNAL:
      case grpc.status.UNKNOWN:
      case grpc.status.DATA_LOSS:
      case grpc.status.CANCELLED:
      case grpc.status.ABORTED:
        return new ServiceUnavailableError(message || 'Permissions service unavailable', 'permissions');
      default:
        break;
    }
  }

  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('EHOSTUNREACH') ||
    message.includes('connection refused') ||
    message.includes('network error')
  ) {
    return new NetworkError(message || 'Permissions connection failed');
  }

  if (
    message.includes('ETIMEDOUT') ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return new TimeoutError(message || 'Permissions request timeout');
  }

  const statusMatch = message.match(/status[:\s]+(\d{3})/i) ||
    message.match(/code[:\s]+(\d{3})/i) ||
    message.match(/\b(4\d{2}|5\d{2})\b/);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;

  if (statusCode) {
    switch (statusCode) {
      case 400:
        return new ValidationError('Invalid permissions request - check parameters');
      case 401:
        return new UnauthorizedError('Permissions authentication failed');
      case 403:
        return new ForbiddenError('Permissions access denied');
      case 404:
        return new NotFoundError('Permission resource', 'Relationship or namespace not found');
      case 429:
        return new ServiceUnavailableError('Permissions rate limit exceeded', 'permissions');
      default:
        if (statusCode >= 500) {
          return new ServiceUnavailableError(`Permissions server error (${statusCode})`, 'permissions');
        }
        if (statusCode >= 400) {
          return new ValidationError(`Permissions client error (${statusCode})`);
        }
    }
  }

  return new ServiceUnavailableError(`Permissions error: ${message}`, 'permissions');
}