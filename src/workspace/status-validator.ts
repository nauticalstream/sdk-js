import type { EventBus } from '../eventbus/index.js';
import type { Logger } from 'pino';
import {
  GetWorkspacesStatusRequestSchema,
  GetWorkspacesStatusResponseSchema,
  type GetWorkspacesStatusResponse,
} from '@nauticalstream/proto/workspace/v1/workspace_service_pb';

/**
 * WorkspaceStatusValidator - Reusable utility for filtering data by workspace accessibility
 * 
 * Used by like-service, follow-service, comment-service, and other services
 * to ensure inaccessible workspaces (UNPUBLISHED, SUSPENDED) are excluded from query results
 * 
 * Accessible workspaces: DRAFT, PUBLISHED
 * Inaccessible workspaces: UNPUBLISHED, SUSPENDED
 * 
 * @example
 * ```typescript
 * const validator = new WorkspaceStatusValidator(eventBus, logger);
 * const filteredLikes = await validator.filterByWorkspaceStatus(allLikes);
 * ```
 */
export class WorkspaceStatusValidator {
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  /**
   * Filter an array of items by workspace accessibility
   * Items with no workspaceId (personal/global) are always included
   * Items from inaccessible workspaces (UNPUBLISHED, SUSPENDED) are filtered out
   * 
   * @param items - Array of items with workspaceId property
   * @returns Filtered array excluding inaccessible workspace items
   */
  async filterByWorkspaceStatus<T extends { workspaceId: string | null }>(
    items: T[],
  ): Promise<T[]> {
    if (!items.length) {
      return items;
    }

    // Extract unique workspace IDs
    const workspaceIds = [...new Set(
      items
        .map(item => item.workspaceId)
        .filter((id): id is string => id !== null)
    )];

    // If no workspace-scoped items, return as-is
    if (!workspaceIds.length) {
      return items;
    }

    try {
      this.logger.debug({ count: workspaceIds.length }, 'Checking workspace accessibility for items');

      const response = (await this.eventBus.request(
        GetWorkspacesStatusRequestSchema,
        GetWorkspacesStatusResponseSchema,
        { ids: workspaceIds },
      )) as GetWorkspacesStatusResponse;

      const filtered = items.filter(item => {
        if (!item.workspaceId) return true; // Keep personal/global items
        // workspaceStatus is true for DRAFT/PUBLISHED (accessible), false for UNPUBLISHED/SUSPENDED
        return response.workspaceStatus[item.workspaceId] === true;
      });

      this.logger.info(
        { total: items.length, filtered: filtered.length },
        'Filtered items by workspace accessibility'
      );

      return filtered;
    } catch (error) {
      this.logger.error(
        { error, workspaceCount: workspaceIds.length },
        'Failed to check workspace accessibility, denying access for security'
      );
      // Fail closed - deny access if we can't verify
      return items.filter(item => !item.workspaceId); // Only return personal/global items
    }
  }

  /**
   * Check if a single workspace is accessible (DRAFT or PUBLISHED)
   * Returns false if eventBus fails (fail closed for security)
   * 
   * @param workspaceId - Workspace ID to check
   * @returns true if workspace is accessible (DRAFT/PUBLISHED), false otherwise or on error
   */
  async isWorkspaceAccessible(workspaceId: string): Promise<boolean> {
    if (!workspaceId) {
      return true; // Personal items always accessible
    }

    try {
      const response = (await this.eventBus.request(
        GetWorkspacesStatusRequestSchema,
        GetWorkspacesStatusResponseSchema,
        { ids: [workspaceId] },
      )) as GetWorkspacesStatusResponse;

      return response.workspaceStatus[workspaceId] === true;
    } catch (error) {
      this.logger.error(
        { error, workspaceId },
        'Failed to check workspace accessibility, denying access for security'
      );
      // Fail closed - deny access if we can't verify
      return false;
    }
  }

  /**
   * Get accessibility status for multiple workspace IDs as a map
   * true = DRAFT or PUBLISHED (accessible)
   * false = UNPUBLISHED or SUSPENDED (inaccessible)
   * 
   * @param workspaceIds - Array of workspace IDs
   * @returns Map of workspace ID -> accessibility status
   */
  async getWorkspaceAccessibilityMap(workspaceIds: string[]): Promise<Record<string, boolean>> {
    if (!workspaceIds.length) {
      return {};
    }

    try {
      const response = (await this.eventBus.request(
        GetWorkspacesStatusRequestSchema,
        GetWorkspacesStatusResponseSchema,
        { ids: workspaceIds },
      )) as GetWorkspacesStatusResponse;

      return response.workspaceStatus;
    } catch (error) {
      this.logger.error(
        { error, count: workspaceIds.length },
        'Failed to get workspace accessibility, denying access for security'
      );
      // Fail closed - mark all as inaccessible
      return Object.fromEntries(
        workspaceIds.map(id => [id, false])
      );
    }
  }
}
