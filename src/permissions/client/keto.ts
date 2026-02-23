import {
  Configuration,
  PermissionApi,
  RelationshipApi,
  type PermissionApiCheckPermissionRequest,
  type RelationshipApiCreateRelationshipRequest,
  type RelationshipApiDeleteRelationshipsRequest,
  type RelationshipApiGetRelationshipsRequest,
  type RelationshipApiCheckOplSyntaxRequest,
  type CheckPermissionResult,
  type CheckOplSyntaxResult,
  type Relationship,
  type Relationships,
} from '@ory/keto-client';
import type { Logger } from 'pino';
import type { PermissionsConfig } from '../types';
import { defaultLogger } from '../utils/logger';
import { classifyKetoError } from '../errors/classifyKetoError';
import { 
  resilientOperation,
  getOrCreateCircuitBreaker,
  shouldRetry,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  type RetryConfig,
  type ResilientCircuitBreaker,
} from '../../resilience';
import { 
  permissionsCheckLatency, 
  permissionsCheckSuccess, 
  permissionsCheckErrors,
  permissionsWriteLatency,
  permissionsWriteSuccess,
  permissionsWriteErrors,
  permissionsRetryAttempts,
  permissionsCircuitBreakerState,
} from '../core/metrics';

/** KetoClient - Ory Keto HTTP client with retry, circuit breaker and metrics */
export class KetoClient {
  private permissionApi: PermissionApi;
  private relationshipApi: RelationshipApi;
  private logger: Logger;
  private retryConfig: RetryConfig;
  private readBreaker: ResilientCircuitBreaker;
  private writeBreaker: ResilientCircuitBreaker;

  constructor(config: PermissionsConfig) {
    const readConfig = new Configuration({ basePath: config.readUrl });
    const writeConfig = new Configuration({ basePath: config.writeUrl });

    this.permissionApi = new PermissionApi(readConfig);
    this.relationshipApi = new RelationshipApi(writeConfig);
    this.logger = config.logger || defaultLogger.child({ service: 'permissions' });
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };

    this.readBreaker = getOrCreateCircuitBreaker('keto-read', {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...config.circuitBreaker,
      stateMetric: permissionsCircuitBreakerState,
    });
    this.writeBreaker = getOrCreateCircuitBreaker('keto-write', {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...config.circuitBreaker,
      stateMetric: permissionsCircuitBreakerState,
    });
  }

  /** Check if a subject has permission on an object */
  async checkPermission(params: PermissionApiCheckPermissionRequest): Promise<{ data: CheckPermissionResult }> {
    return resilientOperation(
      () => this.permissionApi.checkPermission(params),
      {
        operation: 'checkPermission',
        logger: this.logger,
        classifier: classifyKetoError,
        shouldRetry,
        retry: this.retryConfig,
        breaker: this.readBreaker,
        metrics: {
          latency: permissionsCheckLatency,
          success: permissionsCheckSuccess,
          errors: permissionsCheckErrors,
          retries: permissionsRetryAttempts,
        },
        labels: {
          operation: 'checkPermission',
          ...(params.namespace && { namespace: params.namespace }),
          ...(params.relation && { relation: params.relation }),
        },
      }
    ) as Promise<{ data: CheckPermissionResult }>;
  }

  /** Create a new relationship tuple */
  async createRelationship(params: RelationshipApiCreateRelationshipRequest): Promise<{ data: Relationship }> {
    return resilientOperation(
      () => this.relationshipApi.createRelationship(params),
      {
        operation: 'createRelationship',
        logger: this.logger,
        classifier: classifyKetoError,
        shouldRetry,
        retry: this.retryConfig,
        breaker: this.writeBreaker,
        metrics: {
          latency: permissionsWriteLatency,
          success: permissionsWriteSuccess,
          errors: permissionsWriteErrors,
          retries: permissionsRetryAttempts,
        },
        labels: {
          operation: 'createRelationship',
          ...(params.createRelationshipBody?.namespace && { namespace: params.createRelationshipBody.namespace }),
          ...(params.createRelationshipBody?.relation && { relation: params.createRelationshipBody.relation }),
        },
      }
    ) as Promise<{ data: Relationship }>;
  }

  /** Delete relationship tuples matching the given filter */
  async deleteRelationships(params: RelationshipApiDeleteRelationshipsRequest): Promise<void> {
    await resilientOperation(
      () => this.relationshipApi.deleteRelationships(params),
      {
        operation: 'deleteRelationships',
        logger: this.logger,
        classifier: classifyKetoError,
        shouldRetry,
        retry: this.retryConfig,
        breaker: this.writeBreaker,
        metrics: {
          latency: permissionsWriteLatency,
          success: permissionsWriteSuccess,
          errors: permissionsWriteErrors,
          retries: permissionsRetryAttempts,
        },
        labels: {
          operation: 'deleteRelationships',
          ...(params.namespace && { namespace: params.namespace }),
          ...(params.relation && { relation: params.relation }),
        },
      }
    );
  }

  /** Query existing relationship tuples */
  async getRelationships(params: RelationshipApiGetRelationshipsRequest = {}): Promise<{ data: Relationships }> {
    return resilientOperation(
      () => this.relationshipApi.getRelationships(params),
      {
        operation: 'getRelationships',
        logger: this.logger,
        classifier: classifyKetoError,
        shouldRetry,
        retry: this.retryConfig,
        breaker: this.readBreaker,
        metrics: {
          latency: permissionsCheckLatency,
          success: permissionsCheckSuccess,
          errors: permissionsCheckErrors,
          retries: permissionsRetryAttempts,
        },
        labels: {
          operation: 'getRelationships',
          ...(params.namespace && { namespace: params.namespace as string }),
        },
      }
    ) as Promise<{ data: Relationships }>;
  }

  /** Validate OPL syntax */
  async checkOplSyntax(params: RelationshipApiCheckOplSyntaxRequest): Promise<{ data: CheckOplSyntaxResult }> {
    return resilientOperation(
      () => this.relationshipApi.checkOplSyntax(params),
      {
        operation: 'checkOplSyntax',
        logger: this.logger,
        classifier: classifyKetoError,
        shouldRetry,
        retry: this.retryConfig,
      }
    ) as Promise<{ data: CheckOplSyntaxResult }>;
  }

  /** Raw Keto permission API (advanced usage) */
  get permission(): PermissionApi {
    return this.permissionApi;
  }

  /** Raw Keto relationship API (advanced usage) */
  get relationship(): RelationshipApi {
    return this.relationshipApi;
  }
}
