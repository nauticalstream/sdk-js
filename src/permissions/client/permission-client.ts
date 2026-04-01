import { v1 } from '@authzed/authzed-node';
import type { Logger } from '../../logger/index.js';
import type {
  CheckPermissionParams,
  CreateRelationshipParams,
  DeleteRelationshipParams,
  PermissionsConfig,
} from '../types.js';
import { defaultLogger } from '../utils/logger.js';
import { ValidationError } from '../../errors/index.js';
import { classifyPermissionError } from '../errors/classifyPermissionError.js';
import {
  resilientOperation,
  getOrCreateCircuitBreaker,
  shouldRetry,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  type RetryConfig,
  type ResilientCircuitBreaker,
} from '../../resilience/index.js';
import {
  permissionsCheckLatency,
  permissionsCheckSuccess,
  permissionsCheckErrors,
  permissionsWriteLatency,
  permissionsWriteSuccess,
  permissionsWriteErrors,
  permissionsRetryAttempts,
  permissionsCircuitBreakerState,
} from '../core/metrics.js';

type CreateRelationshipRequest = {
  createRelationshipBody: {
    namespace: string;
    object: string;
    relation: string;
    subject_id?: string;
    subject_set?: {
      namespace: string;
      object: string;
      relation: string;
    };
  };
};

type DeleteRelationshipsRequest = {
  namespace?: string;
  object?: string;
  relation?: string;
  subjectId?: string;
  subjectSetNamespace?: string;
  subjectSetObject?: string;
  subjectSetRelation?: string;
};

type GetRelationshipsRequest = {
  namespace?: string;
  object?: string;
  relation?: string;
  subjectId?: string;
  subjectSetNamespace?: string;
  subjectSetObject?: string;
  subjectSetRelation?: string;
};

type RelationshipTuple = {
  namespace: string;
  object: string;
  relation: string;
  subject_id?: string;
  subject_set?: {
    namespace: string;
    object: string;
    relation: string;
  };
};

type RelationshipsResult = {
  relation_tuples: RelationshipTuple[];
};

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/^[a-z]+:\/\//i, '').replace(/\/+$/, '');
}

function isLoopbackEndpoint(endpoint: string): boolean {
  return /^localhost(?::\d+)?$/i.test(endpoint) || /^127(?:\.\d{1,3}){3}(?::\d+)?$/.test(endpoint);
}

function resolveEndpoint(config: PermissionsConfig, logger: Logger): string {
  const rawEndpoint = config.endpoint ?? config.writeUrl ?? config.readUrl;
  if (!rawEndpoint) {
    throw new ValidationError('Permissions endpoint is required');
  }

  if (config.readUrl && config.writeUrl && config.readUrl !== config.writeUrl) {
    logger.warn(
      {
        readUrl: config.readUrl,
        writeUrl: config.writeUrl,
      },
      'Permissions config provided different read/write URLs; using a single permissions endpoint'
    );
  }

  return normalizeEndpoint(rawEndpoint);
}

function resolveSecurity(config: PermissionsConfig, endpoint: string): v1.ClientSecurity {
  if (config.security === 'secure') return v1.ClientSecurity.SECURE;
  if (config.security === 'insecure-localhost') return v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED;
  if (config.security === 'insecure-plaintext') return v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS;

  if (typeof config.insecure === 'boolean') {
    return config.insecure
      ? v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS
      : v1.ClientSecurity.SECURE;
  }

  if (/^http:\/\//i.test(config.endpoint ?? config.writeUrl ?? config.readUrl ?? '')) {
    return v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS;
  }

  if (isLoopbackEndpoint(endpoint)) {
    return v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED;
  }

  if (!config.token) {
    return v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS;
  }

  return v1.ClientSecurity.SECURE;
}

function buildObjectReference(namespace: string, object: string) {
  return { objectType: namespace, objectId: object };
}

function buildUserSubject(subjectId: string) {
  return {
    object: {
      objectType: 'user',
      objectId: subjectId,
    },
    optionalRelation: '',
  };
}

function buildSubjectReference(params: CreateRelationshipParams | DeleteRelationshipParams) {
  if (params.subjectId) {
    return buildUserSubject(params.subjectId);
  }

  if (params.subjectSet) {
    return {
      object: {
        objectType: params.subjectSet.namespace,
        objectId: params.subjectSet.object,
      },
      optionalRelation: params.subjectSet.relation,
    };
  }

  throw new ValidationError('A relationship subject is required');
}

function buildSubjectFilter(params: {
  subjectId?: string;
  subjectSetNamespace?: string;
  subjectSetObject?: string;
  subjectSetRelation?: string;
}) {
  if (params.subjectId) {
    return {
      subjectType: 'user',
      optionalSubjectId: params.subjectId,
    };
  }

  if (params.subjectSetNamespace && params.subjectSetObject) {
    return {
      subjectType: params.subjectSetNamespace,
      optionalSubjectId: params.subjectSetObject,
      optionalRelation: params.subjectSetRelation
        ? { relation: params.subjectSetRelation }
        : undefined,
    };
  }

  return undefined;
}

function mapRelationshipResponse(relationship?: {
  resource?: { objectType: string; objectId: string };
  relation: string;
  subject?: { object?: { objectType: string; objectId: string }; optionalRelation: string };
}): RelationshipTuple | null {
  if (!relationship?.resource) return null;

  const tuple: RelationshipTuple = {
    namespace: relationship.resource.objectType,
    object: relationship.resource.objectId,
    relation: relationship.relation,
  };

  const subjectObject = relationship.subject?.object;
  if (!subjectObject) return tuple;

  if (subjectObject.objectType === 'user' && !relationship.subject?.optionalRelation) {
    tuple.subject_id = subjectObject.objectId;
    return tuple;
  }

  tuple.subject_set = {
    namespace: subjectObject.objectType,
    object: subjectObject.objectId,
    relation: relationship.subject?.optionalRelation ?? '',
  };

  return tuple;
}

export class PermissionClient {
  private readonly client: v1.ZedPromiseClientInterface;
  private readonly logger: Logger;
  private readonly retryConfig: RetryConfig;
  private readonly readBreaker: ResilientCircuitBreaker;
  private readonly writeBreaker: ResilientCircuitBreaker;

  constructor(config: PermissionsConfig) {
    this.logger = config.logger || defaultLogger.child({ service: 'permissions' });
    const endpoint = resolveEndpoint(config, this.logger);
    const security = resolveSecurity(config, endpoint);
    const token = config.token ?? '';

    this.client = v1.NewClient(token, endpoint, security).promises;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };

    this.readBreaker = getOrCreateCircuitBreaker('permissions-read', {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...config.circuitBreaker,
      stateMetric: permissionsCircuitBreakerState,
    });
    this.writeBreaker = getOrCreateCircuitBreaker('permissions-write', {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...config.circuitBreaker,
      stateMetric: permissionsCircuitBreakerState,
    });
  }

  async checkPermission(params: CheckPermissionParams): Promise<{ data: { allowed: boolean } }> {
    return resilientOperation(
      async () => {
        const response = await this.client.checkPermission({
          resource: buildObjectReference(params.namespace, params.object),
          permission: params.relation,
          subject: buildUserSubject(params.subjectId),
        } as any);

        return {
          data: {
            allowed: response.permissionship === v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION,
          },
        };
      },
      {
        operation: 'checkPermission',
        logger: this.logger,
        classifier: classifyPermissionError,
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
          namespace: params.namespace,
          relation: params.relation,
        },
      }
    );
  }

  async createRelationship(params: CreateRelationshipRequest): Promise<{ data: RelationshipTuple }> {
    return resilientOperation(
      async () => {
        await this.client.writeRelationships({
          updates: [
            {
              operation: v1.RelationshipUpdate_Operation.TOUCH,
              relationship: {
                resource: buildObjectReference(
                  params.createRelationshipBody.namespace,
                  params.createRelationshipBody.object
                ),
                relation: params.createRelationshipBody.relation,
                subject: buildSubjectReference({
                  namespace: params.createRelationshipBody.namespace,
                  object: params.createRelationshipBody.object,
                  relation: params.createRelationshipBody.relation,
                  subjectId: params.createRelationshipBody.subject_id,
                  subjectSet: params.createRelationshipBody.subject_set,
                }),
              },
            },
          ],
          optionalPreconditions: [],
        } as any);

        return {
          data: {
            namespace: params.createRelationshipBody.namespace,
            object: params.createRelationshipBody.object,
            relation: params.createRelationshipBody.relation,
            ...(params.createRelationshipBody.subject_id
              ? { subject_id: params.createRelationshipBody.subject_id }
              : { subject_set: params.createRelationshipBody.subject_set }),
          },
        };
      },
      {
        operation: 'createRelationship',
        logger: this.logger,
        classifier: classifyPermissionError,
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
          namespace: params.createRelationshipBody.namespace,
          relation: params.createRelationshipBody.relation,
        },
      }
    );
  }

  async deleteRelationships(params: DeleteRelationshipsRequest): Promise<void> {
    await resilientOperation(
      () =>
        this.client.deleteRelationships({
          relationshipFilter: {
            resourceType: params.namespace ?? '',
            optionalResourceId: params.object ?? '',
            optionalResourceIdPrefix: '',
            optionalRelation: params.relation ?? '',
            optionalSubjectFilter: buildSubjectFilter(params),
          },
          optionalPreconditions: [],
          optionalLimit: 0,
          optionalAllowPartialDeletions: false,
        } as any),
      {
        operation: 'deleteRelationships',
        logger: this.logger,
        classifier: classifyPermissionError,
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
          ...(params.namespace ? { namespace: params.namespace } : {}),
          ...(params.relation ? { relation: params.relation } : {}),
        },
      }
    );
  }

  async getRelationships(params: GetRelationshipsRequest = {}): Promise<{ data: RelationshipsResult }> {
    return resilientOperation(
      async () => {
        const response = await this.client.readRelationships({
          relationshipFilter: {
            resourceType: params.namespace ?? '',
            optionalResourceId: params.object ?? '',
            optionalResourceIdPrefix: '',
            optionalRelation: params.relation ?? '',
            optionalSubjectFilter: buildSubjectFilter(params),
          },
          optionalLimit: 0,
        } as any);

        return {
          data: {
            relation_tuples: response
              .map((item) => mapRelationshipResponse(item.relationship as any))
              .filter((tuple): tuple is RelationshipTuple => tuple !== null),
          },
        };
      },
      {
        operation: 'getRelationships',
        logger: this.logger,
        classifier: classifyPermissionError,
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
          ...(params.namespace ? { namespace: params.namespace } : {}),
        },
      }
    );
  }

  async lookupResources(params: {
    namespace: string;
    permission: string;
    subjectId: string;
    limit?: number;
  }): Promise<string[]> {
    const result = await resilientOperation(
      () =>
        this.client.lookupResources({
          resourceObjectType: params.namespace,
          permission: params.permission,
          subject: buildUserSubject(params.subjectId),
          optionalLimit: params.limit ?? 0,
        } as any),
      {
        operation: 'lookupResources',
        logger: this.logger,
        classifier: classifyPermissionError,
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
          operation: 'lookupResources',
          namespace: params.namespace,
          relation: params.permission,
        },
      }
    );

    return result.map((item) => item.resourceObjectId).filter(Boolean);
  }

  async validateSchemaSyntax(): Promise<{ data: { valid: boolean; errors: string[] } }> {
    return {
      data: {
        valid: false,
        errors: ['Schema syntax validation is not supported by this permission client'],
      },
    };
  }

  get permission() {
    return {
      checkPermission: this.checkPermission.bind(this),
    };
  }

  get relationship() {
    return {
      createRelationship: this.createRelationship.bind(this),
      deleteRelationships: this.deleteRelationships.bind(this),
      getRelationships: this.getRelationships.bind(this),
      checkSyntax: this.validateSchemaSyntax.bind(this),
    };
  }

  close(): void {
    this.client.close();
  }
}