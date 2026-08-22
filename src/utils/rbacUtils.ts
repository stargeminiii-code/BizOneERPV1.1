import { UserAccount, PermissionAction, UserRole } from '../types';

/**
 * RBAC Helper to check if a user has a specific action permission on a given module.
 * Super Admin has full unrestricted access.
 */
export function hasPermission(
  user: UserAccount | null | undefined,
  moduleName: string,
  action: PermissionAction = 'view'
): boolean {
  if (!user) return false;

  // Super admin always has all permissions
  if (user.role === 'super_admin') return true;

  // Admin has almost all permissions except system security lockouts
  if (user.role === 'admin' && action !== 'delete' && moduleName !== 'api_integrations') return true;

  // Check specific module permission array
  const userPerms = (user.permissions as Record<string, PermissionAction[] | undefined>)?.[moduleName];
  if (!userPerms || !Array.isArray(userPerms)) {
    // If no explicit permissions set for this module, check role defaults
    return false;
  }

  return userPerms.includes(action);
}

/**
 * RBAC Helper to check if a user can view/access a given module in sidebar / tabs.
 */
export function hasModuleAccess(
  user: UserAccount | null | undefined,
  moduleName: string
): boolean {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'admin') return true;

  const userPerms = (user.permissions as Record<string, PermissionAction[] | undefined>)?.[moduleName];
  return Boolean(userPerms && userPerms.length > 0 && userPerms.includes('view'));
}

/**
 * RBAC Task Specific action permission helper
 */
export function canPerformTaskAction(
  user: UserAccount | null | undefined,
  action: 'create' | 'edit' | 'delete' | 'checkin' | 'view'
): boolean {
  if (!user) return true; // Default permissive for unauthenticated demo
  if (user.role === 'super_admin' || user.role === 'admin') return true;

  // Checkin is allowed for any assigned staff / employee
  if (action === 'checkin' || action === 'view') return true;

  // Create / Edit
  if (action === 'create' || action === 'edit') {
    return hasPermission(user, 'customers', action);
  }

  // Delete
  if (action === 'delete') {
    return hasPermission(user, 'customers', 'delete') || user.role === 'ceo' || user.role === 'warehouse_manager';
  }

  return true;
}
