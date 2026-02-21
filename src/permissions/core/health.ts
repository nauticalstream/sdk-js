import type { KetoClient } from '../client/keto';

export interface HealthStatus {
  healthy: boolean;
  readEndpoint: 'up' | 'down';
  writeEndpoint: 'up' | 'down';
  latency: number;
}

/**
 * Check health of Keto endpoints
 * Performs a simple permission check to verify connectivity
 * 
 * @param client - KetoClient instance
 * @returns Health status with endpoint availability and latency
 */
export async function checkHealth(client: KetoClient): Promise<HealthStatus> {
  const startTime = Date.now();
  let readUp = false;
  let writeUp = false;

  // Test read endpoint with a simple permission check
  try {
    await client.checkPermission({
      namespace: 'Platform',
      object: 'health-check',
      relation: 'view',
      subjectId: 'health-check-user',
    });
    readUp = true;
  } catch (error) {
    // Expected to fail (permission doesn't exist), but connection should work
    // Only mark as down if it's a connection error
    if (error instanceof Error) {
      const msg = error.message || '';
      if (
        msg.includes('ECONNREFUSED') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('timeout') ||
        msg.includes('Circuit breaker open')
      ) {
        readUp = false;
      } else {
        // Other errors (404, 403, etc.) mean endpoint is responding
        readUp = true;
      }
    }
  }

  // For write endpoint, we can check if the relationship API is accessible
  // We won't actually create anything, just check connectivity
  try {
    // Try to query relationships (read operation on write endpoint)
    await client.getRelationships({
      namespace: 'Platform',
      object: 'health-check',
    });
    writeUp = true;
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message || '';
      if (
        msg.includes('ECONNREFUSED') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('timeout') ||
        msg.includes('Circuit breaker open')
      ) {
        writeUp = false;
      } else {
        writeUp = true;
      }
    }
  }

  const latency = Date.now() - startTime;

  return {
    healthy: readUp && writeUp,
    readEndpoint: readUp ? 'up' : 'down',
    writeEndpoint: writeUp ? 'up' : 'down',
    latency,
  };
}
