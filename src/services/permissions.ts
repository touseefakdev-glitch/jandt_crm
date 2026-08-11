import { UserProfile, UserRole } from '../types';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export class PermissionsService {
  
  // --- Admin Access ---
  public static canAccessAdminPanel(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  public static canManageUsers(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  public static canManageTeams(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  public static canManageSystemSettings(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  public static canViewAuditLogs(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  public static canManageTaxonomies(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  public static canPerformImport(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin') return { allowed: true };
    return { allowed: false, reason: 'Only System Administrators can perform bulk CSV data imports.' };
  }

  // --- Product & Availability Permissions ---
  public static canViewProducts(user: UserProfile | null): boolean {
    return !!user;
  }

  public static canManageProducts(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  }

  public static canChangeProductAvailability(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin') return { allowed: true };
    return { allowed: false, reason: 'Only System Administrators can change product availability status.' };
  }

  // --- Customer Permissions ---
  public static canViewCustomers(user: UserProfile | null): boolean {
    return !!user;
  }

  public static canManageCustomers(user: UserProfile | null): boolean {
    return !!user; // Admin, Sales, Support can create/edit customers
  }

  public static canDeactivateCustomer(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin') return { allowed: true };
    return { allowed: false, reason: 'Only System Administrators can deactivate customer accounts.' };
  }

  // --- Order & Daily Operations Permissions ---
  public static canViewOrders(user: UserProfile | null): boolean {
    return !!user;
  }

  public static canViewDailyOperations(user: UserProfile | null): boolean {
    return !!user;
  }

  public static canUpdateDailyOperations(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin' || user.role === 'sales_agent') return { allowed: true };
    return { allowed: false, reason: 'Support Agents have read-only access to daily operations.' };
  }

  public static canRevertDailyOperations(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin' || user.role === 'sales_agent') return { allowed: true };
    return { allowed: false, reason: 'Only Sales Agents and Admins can revert completed workflow steps.' };
  }

  public static canManageRouteSchedules(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin') return { allowed: true };
    return { allowed: false, reason: 'Only System Administrators can manage route schedules.' };
  }

  public static canManageOrderRequestAutomation(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin') return { allowed: true };
    return { allowed: false, reason: 'Only System Administrators can configure daily order request automation.' };
  }

  public static canCreateOrders(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin' || user.role === 'sales_agent') return { allowed: true };
    return { allowed: false, reason: 'Support Agents are restricted from creating new customer orders.' };
  }

  public static canProgressOrderWorkflow(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin' || user.role === 'sales_agent') return { allowed: true };
    return { allowed: false, reason: 'Support Agents cannot progress order workflow stages.' };
  }

  public static canCancelOrder(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin' || user.role === 'sales_agent') return { allowed: true };
    return { allowed: false, reason: 'Only Sales Agents and Admins can cancel orders.' };
  }

  // --- Query / Support Ticket Permissions ---
  public static canViewQueries(user: UserProfile | null): boolean {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'support_agent';
  }

  public static canManageQueries(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin' || user.role === 'support_agent') return { allowed: true };
    return { allowed: false, reason: 'Sales Agents are restricted from managing support tickets.' };
  }

  public static canViewInternalSupportNotes(user: UserProfile | null): boolean {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'support_agent';
  }

  // --- WhatsApp Ordering (Phase 8) Permissions ---
  public static canViewWhatsAppMonitor(user: UserProfile | null): boolean {
    return !!user;
  }

  public static canManageWhatsAppOrderProcessing(user: UserProfile | null): PermissionCheckResult {
    if (!user) return { allowed: false, reason: 'Authentication required.' };
    if (user.role === 'admin' || user.role === 'sales_agent') return { allowed: true };
    return { allowed: false, reason: 'Only Sales Agents and Admins can retry failed order processing.' };
  }

  // --- Shift Handover Permissions ---
  public static canViewHandovers(user: UserProfile | null): boolean {
    return !!user;
  }

  public static canCreateHandover(user: UserProfile | null): boolean {
    return !!user;
  }

  public static canAcknowledgeHandover(user: UserProfile | null): boolean {
    return !!user;
  }
}

export const permissions = PermissionsService;
