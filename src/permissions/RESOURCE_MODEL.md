# Permission Resource Model

This document defines when a service domain should become a standalone permission resource in `sdk/js/src/permissions` and in SpiceDB, and when it should inherit from a parent resource or a workspace role.

## Rule Set

Use these rules in order:

1. **Workspace boundary first**
   - Every workspace-owned record must be constrained by `workspaceId`.
   - If a caller cannot act in the workspace, the request stops there.

2. **Workspace role by default**
   - If a domain does not need independent sharing or object-level access, use workspace role checks.
   - This is the default for tenant-owned CRUD.

3. **Parent inheritance for child records**
   - If a record exists only as part of another resource, inherit from the parent.
   - Do not create a separate SpiceDB namespace or SDK domain unless the child has its own access boundary.

4. **Standalone permission resource only for important roots**
   - Create a standalone resource only when the object is independently managed, independently shared, or directly authorized by multiple services or clients.

## Standalone Resource Criteria

Create a standalone permission resource only if at least one of these is true:

- The object has its own lifecycle and management UI.
- The object can be shared or granted independently from its parent.
- The object has actions that differ materially from workspace-role checks.
- Multiple services need to authorize it directly.
- The object may later need object-level exceptions such as owner-only or private visibility.

If none of those are true, keep authorization at the workspace or parent-resource level.

## Current Standalone Resources

These are currently valid standalone SDK permission resources:

- `posts`
- `articles`
- `articleTopics`
- `files`
- `workspaceCategories`
- `workspaceFeatures`
- `events`
- `eventTicketSpecifications`
- `tours`
- `cruises`
- `boats`
- `itineraries`
- `streams`
- `businesses`
- `catalogProducts`
- `priceConfigurations`
- `connectedEmailAccounts`
- `verificationSessions`
- `collections`
- `storageCollections`
- `comments`
- `likes`
- `follows`
- `customers`
- `leads`
- `leadStages`
- `chatConversations`
- `chatMessages`
- `chatMessageRequests`
- `places`
- `notes`

## Current Decisions For Uncovered Service Domains

### Standalone Resources Added

These are worth adding because they behave like independent roots rather than internal children:

| Domain                       | Service           | Why                                                                                                  |
| ---------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `article_topic`              | `article-service` | Managed independently from articles, queried directly, and has its own tree and CRUD surface.        |
| `event_ticket_specification` | `event-service`   | Has its own CRUD and may evolve separate publishing or sales rules from the event itself.            |
| `chat_message_request`       | `chat-service`    | Represents a separate workflow from conversations and messages, including assignment and resolution. |

### Keep Parent-Inherited

These should stay under the authorization boundary of the parent resource:

| Domain                     | Service              | Inherit From                                             |
| -------------------------- | -------------------- | -------------------------------------------------------- |
| `post_item`                | `post-service`       | `post`                                                   |
| `collection_item`          | `collection-service` | `collection`                                             |
| `itinerary_stop`           | `itinerary-service`  | `itinerary`                                              |
| `conversation_participant` | `chat-service`       | `chat_conversation`                                      |
| `business_address`         | `business-service`   | `business`                                               |
| `business_associate`       | `business-service`   | `business`                                               |
| `business_verification`    | `business-service`   | `business`                                               |
| `file_reference`           | `storage-service`    | `file` or owning resource                                |
| `email`                    | `email-service`      | `connected_email_account`                                |
| `email_address`            | `email-service`      | `connected_email_account` or customer ownership workflow |
| `location`                 | `place-service`      | `place`                                                  |

### Keep Workspace-Scoped Or Platform-Scoped Only

These do not need a standalone object-level permission namespace right now:

| Domain              | Service                  | Scope                                                                     |
| ------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `workspace_amenity` | `workspace-service`      | Platform-managed taxonomy, not workspace-shared object auth.              |
| `user_details`      | `user-service`           | User ownership or workspace membership rules, not separate resource auth. |
| `address`           | `user-service`           | User ownership rules.                                                     |
| `cookie_consent`    | `cookie-consent-service` | User or session ownership rules.                                          |

### No Standalone Resource Auth Needed

These are infrastructure or ephemeral domains that should not become standalone permission resources:

| Domain                  | Service                 | Reason                                           |
| ----------------------- | ----------------------- | ------------------------------------------------ |
| `presence`              | `presence-service`      | Ephemeral aggregate state.                       |
| `presence_session`      | `presence-service`      | Ephemeral connection state.                      |
| `geoip`                 | `geoip-service`         | Utility lookup, not owned content.               |
| `mqtt-auth`             | `mqtt-auth-service`     | Topic-level auth bridge, not a content resource. |
| `elasticsearch-adapter` | `elasticsearch-adapter` | Indexing/infrastructure adapter.                 |

## Implementation Guidance

For most microservices, authorization should follow this sequence:

1. Load the record.
2. Resolve its `workspaceId` or parent resource id.
3. Check workspace role or parent resource permission.
4. Only perform direct object-level checks if the domain is classified as a standalone resource.

## Immediate Backlog

No additional standalone-resource expansion is approved right now.

Everything still listed above as parent-inherited or workspace-scoped should remain that way unless a concrete product workflow proves otherwise.
