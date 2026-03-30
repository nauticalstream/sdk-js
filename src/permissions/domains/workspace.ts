export enum WorkspaceRole {
  UNSPECIFIED = 'unspecified',
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum WorkspacePermission {
  VIEW = 'view',
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
  INVITE_MEMBER = 'invite_member',
  REMOVE_MEMBER = 'remove_member',
  UPDATE_SETTINGS = 'update_settings',
  DELETE = 'delete',
  MANAGE_WORKSPACE_FEATURES = 'manage_workspace_features',
  MANAGE_WORKSPACE_CATEGORIES = 'manage_workspace_categories',
}