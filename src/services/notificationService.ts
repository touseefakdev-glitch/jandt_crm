import { CRMNotification, NotificationPriority, UserRole } from '../types';
import { localDb } from './db';

export type NotificationEventType =
  | 'query.assigned'
  | 'query.reassigned'
  | 'query.urgent_created'
  | 'query.reopened'
  | 'order.assigned'
  | 'order.created'
  | 'order.status_changed'
  | 'product.availability_changed'
  | 'whatsapp.attention_required'
  | 'system.admin';

export interface NotificationEventPayload {
  type: NotificationEventType;
  title: string;
  message: string;
  recipientUserIds: string[];
  actorUserId?: string | null;
  entityType?: 'query' | 'order' | 'product' | 'system';
  entityId?: string;
  priority?: NotificationPriority;
  linkPath?: string;
}

type NotificationListener = (notification: CRMNotification) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();

  /**
   * Subscribe to real-time notification events in open UI components (e.g. Header, Notifications page)
   */
  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Broadcast newly created notification to all active subscribers
   */
  private broadcast(notification: CRMNotification) {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Error broadcasting notification to listener:', err);
      }
    });
  }

  /**
   * Primary centralized event dispatcher
   */
  public dispatch(payload: NotificationEventPayload): CRMNotification[] {
    const createdNotifs: CRMNotification[] = [];
    const priority = payload.priority || 'normal';
    const uniqueRecipients = Array.from(new Set(payload.recipientUserIds));

    uniqueRecipients.forEach((recipientId) => {
      // Don't notify the actor if they performed the action on themselves unless it's a critical self-reminder
      if (payload.actorUserId && payload.actorUserId === recipientId && payload.priority !== 'urgent') {
        return;
      }

      // Role & Permission Check: Verify recipient user exists and is active
      const recipientUser = localDb.getUserById(recipientId);
      if (!recipientUser) return;

      // Duplicate Prevention Check: Check if an identical notification was generated recently (last 10 seconds)
      const existingNotifs = localDb.getNotifications(recipientId);
      const isDuplicate = existingNotifs.some(
        (n) =>
          n.notification_type === payload.type &&
          n.entity_id === payload.entityId &&
          n.title === payload.title &&
          Math.abs(new Date().getTime() - new Date(n.created_at).getTime()) < 10000
      );

      if (isDuplicate) {
        return;
      }

      // Persist notification to DB
      const created = localDb.createNotification({
        recipient_user_id: recipientId,
        actor_user_id: payload.actorUserId || null,
        notification_type: payload.type,
        title: payload.title,
        message: payload.message,
        entity_type: payload.entityType || null,
        entity_id: payload.entityId || null,
        priority: priority,
        link_path: payload.linkPath || null,
      });

      createdNotifs.push(created);
      this.broadcast(created);
    });

    return createdNotifs;
  }

  // --- Convenience Helper Event Triggers ---

  /**
   * Trigger: Query Assigned
   */
  public notifyQueryAssigned(params: {
    queryNumber: string;
    queryId: string;
    customerName: string;
    priority: string;
    recipientAgentId: string;
    actorUserId?: string;
  }) {
    const isUrgent = params.priority.toLowerCase() === 'urgent';
    this.dispatch({
      type: 'query.assigned',
      title: isUrgent ? '🔴 URGENT Support Ticket Assigned' : '🎫 Support Ticket Assigned',
      message: `Query ${params.queryNumber} for ${params.customerName} has been assigned to you. Priority: ${params.priority.toUpperCase()}`,
      recipientUserIds: [params.recipientAgentId],
      actorUserId: params.actorUserId,
      entityType: 'query',
      entityId: params.queryId,
      priority: isUrgent ? 'urgent' : 'high',
      linkPath: `/queries/${params.queryId}`,
    });
  }

  /**
   * Trigger: Query Reassigned
   */
  public notifyQueryReassigned(params: {
    queryNumber: string;
    queryId: string;
    customerName: string;
    newAgentId: string;
    actorUserId?: string;
  }) {
    this.dispatch({
      type: 'query.reassigned',
      title: '🎫 Support Ticket Reassigned',
      message: `Query ${params.queryNumber} for ${params.customerName} has been reassigned to you.`,
      recipientUserIds: [params.newAgentId],
      actorUserId: params.actorUserId,
      entityType: 'query',
      entityId: params.queryId,
      priority: 'high',
      linkPath: `/queries/${params.queryId}`,
    });
  }

  /**
   * Trigger: Urgent Query Created
   */
  public notifyUrgentQueryCreated(params: {
    queryNumber: string;
    queryId: string;
    customerName: string;
    subject: string;
    assignedAgentId?: string;
    actorUserId?: string;
  }) {
    const allAdmins = localDb.getUsers().filter((u) => u.role === 'admin').map((u) => u.id);
    const recipients = params.assignedAgentId ? [params.assignedAgentId, ...allAdmins] : allAdmins;

    this.dispatch({
      type: 'query.urgent_created',
      title: '🔴 URGENT Support Ticket Created',
      message: `Urgent Ticket ${params.queryNumber} created for ${params.customerName}: "${params.subject}"`,
      recipientUserIds: recipients,
      actorUserId: params.actorUserId,
      entityType: 'query',
      entityId: params.queryId,
      priority: 'urgent',
      linkPath: `/queries/${params.queryId}`,
    });
  }

  /**
   * Trigger: Query Reopened
   */
  public notifyQueryReopened(params: {
    queryNumber: string;
    queryId: string;
    customerName: string;
    reopenReason: string;
    assignedAgentId?: string;
    actorUserId?: string;
  }) {
    const allAdmins = localDb.getUsers().filter((u) => u.role === 'admin').map((u) => u.id);
    const recipients = params.assignedAgentId ? [params.assignedAgentId, ...allAdmins] : allAdmins;

    this.dispatch({
      type: 'query.reopened',
      title: '⚠️ Support Ticket Reopened',
      message: `Query ${params.queryNumber} for ${params.customerName} was reopened. Reason: ${params.reopenReason}`,
      recipientUserIds: recipients,
      actorUserId: params.actorUserId,
      entityType: 'query',
      entityId: params.queryId,
      priority: 'high',
      linkPath: `/queries/${params.queryId}`,
    });
  }

  /**
   * Trigger: Order Assigned
   */
  public notifyOrderAssigned(params: {
    orderNumber: string;
    orderId: string;
    customerName: string;
    assignedSalesAgentId: string;
    actorUserId?: string;
  }) {
    this.dispatch({
      type: 'order.assigned',
      title: '📦 Order Assigned to You',
      message: `Customer Order ${params.orderNumber} for ${params.customerName} has been assigned to you.`,
      recipientUserIds: [params.assignedSalesAgentId],
      actorUserId: params.actorUserId,
      entityType: 'order',
      entityId: params.orderId,
      priority: 'normal',
      linkPath: `/orders/${params.orderId}`,
    });
  }

  /**
   * Trigger: New Order Created
   */
  public notifyNewOrderCreated(params: {
    orderNumber: string;
    orderId: string;
    customerName: string;
    grandTotal: number;
    salesAgentId?: string;
    actorUserId?: string;
  }) {
    const allSalesAndAdmins = localDb
      .getUsers()
      .filter((u) => u.role === 'sales_agent' || u.role === 'admin')
      .map((u) => u.id);

    this.dispatch({
      type: 'order.created',
      title: '🛒 New Customer Order Created',
      message: `Order ${params.orderNumber} ($${params.grandTotal.toFixed(2)}) created for ${params.customerName}.`,
      recipientUserIds: allSalesAndAdmins,
      actorUserId: params.actorUserId,
      entityType: 'order',
      entityId: params.orderId,
      priority: 'normal',
      linkPath: `/orders/${params.orderId}`,
    });
  }

  /**
   * Trigger: Order Status Changed (Waiting for Invoice, Dispatch, Signed Invoice, Completed, Cancelled)
   */
  public notifyOrderStatusChanged(params: {
    orderNumber: string;
    orderId: string;
    customerName: string;
    previousStatus: string;
    newStatus: string;
    assignedSalesAgentId?: string;
    actorUserId?: string;
    cancellationReason?: string;
  }) {
    let title = `📦 Order Status Update (${params.orderNumber})`;
    let priority: NotificationPriority = 'normal';
    let message = `Order ${params.orderNumber} transitioned to ${params.newStatus.replace(/_/g, ' ').toUpperCase()}.`;

    switch (params.newStatus) {
      case 'sales_order_done':
        title = '📄 Order Waiting for Commercial Invoice';
        priority = 'high';
        message = `Order ${params.orderNumber} (${params.customerName}) is ready for Invoicing.`;
        break;
      case 'invoiced':
        title = '🚚 Order Waiting for Freight Dispatch';
        priority = 'high';
        message = `Order ${params.orderNumber} (${params.customerName}) is invoiced and awaiting dispatch.`;
        break;
      case 'dispatched':
        title = '📋 Order Dispatched — Waiting for Signed Invoice';
        priority = 'normal';
        message = `Order ${params.orderNumber} (${params.customerName}) dispatched. Awaiting signed customer invoice.`;
        break;
      case 'completed':
        title = '✅ Order Completed';
        priority = 'normal';
        message = `Order ${params.orderNumber} for ${params.customerName} has been successfully completed!`;
        break;
      case 'cancelled':
        title = '❌ Order Cancelled';
        priority = 'high';
        message = `Order ${params.orderNumber} for ${params.customerName} was cancelled. Reason: ${params.cancellationReason || 'N/A'}`;
        break;
    }

    const allSalesAndAdmins = localDb
      .getUsers()
      .filter((u) => u.role === 'sales_agent' || u.role === 'admin')
      .map((u) => u.id);

    this.dispatch({
      type: 'order.status_changed',
      title,
      message,
      recipientUserIds: allSalesAndAdmins,
      actorUserId: params.actorUserId,
      entityType: 'order',
      entityId: params.orderId,
      priority,
      linkPath: `/orders/${params.orderId}`,
    });
  }

  /**
   * Trigger: Product Availability Changed
   */
  public notifyProductAvailabilityChanged(params: {
    sku: string;
    productName: string;
    productId: string;
    newStatus: 'available' | 'out_of_stock' | 'discontinued';
    reason?: string;
    expectedDate?: string | null;
    actorUserId?: string;
  }) {
    const isOutOfStock = params.newStatus === 'out_of_stock';
    const title = isOutOfStock ? '🔴 Product Out of Stock Alert' : '🟢 Product Available Again';
    const priority: NotificationPriority = isOutOfStock ? 'high' : 'normal';

    let message = `Product ${params.sku} (${params.productName}) is now ${isOutOfStock ? 'OUT OF STOCK' : 'AVAILABLE'}.`;
    if (isOutOfStock && params.reason) {
      message += ` Reason: ${params.reason}.`;
    }
    if (isOutOfStock && params.expectedDate) {
      message += ` Expected resupply: ${new Date(params.expectedDate).toLocaleDateString()}.`;
    }

    // Notify all active Sales Agents, Support Agents, and Admins
    const recipientIds = localDb
      .getUsers()
      .filter((u) => u.role === 'sales_agent' || u.role === 'support_agent' || u.role === 'admin')
      .map((u) => u.id);

    this.dispatch({
      type: 'product.availability_changed',
      title,
      message,
      recipientUserIds: recipientIds,
      actorUserId: params.actorUserId,
      entityType: 'product',
      entityId: params.productId,
      priority,
      linkPath: `/products/${params.productId}`,
    });
  }

  /**
   * Trigger: System Admin Notification
   */
  public notifySystemAdmin(params: {
    title: string;
    message: string;
    linkPath?: string;
    actorUserId?: string;
  }) {
    const adminIds = localDb
      .getUsers()
      .filter((u) => u.role === 'admin')
      .map((u) => u.id);

    this.dispatch({
      type: 'system.admin',
      title: params.title,
      message: params.message,
      recipientUserIds: adminIds,
      actorUserId: params.actorUserId,
      entityType: 'system',
      priority: 'high',
      linkPath: params.linkPath,
    });
  }

  /**
   * Trigger: WhatsApp Message Requires Human Attention (Phase 6)
   */
  public notifyWhatsAppAttentionRequired(params: {
    alertId: string;
    conversationId?: string | null;
    customerName: string;
    messageText: string;
    classification: string;
    priority: NotificationPriority;
    linkPath?: string | null;
  }) {
    const isUrgent = params.priority === 'urgent';
    const isHigh = params.priority === 'high';
    const salesAndSupportAndAdmins = localDb
      .getUsers()
      .filter((u) => u.role === 'sales_agent' || u.role === 'support_agent' || u.role === 'admin')
      .map((u) => u.id);

    this.dispatch({
      type: 'whatsapp.attention_required',
      title: `${isUrgent ? '🔴' : isHigh ? '🟠' : '🔔'} Customer Needs Attention`,
      message: `${params.customerName}: "${params.messageText}"`,
      recipientUserIds: salesAndSupportAndAdmins,
      entityType: 'system',
      entityId: params.alertId,
      priority: params.priority,
      linkPath: params.linkPath || '/whatsapp-conversations',
    });
  }

  /**
   * Trigger: Shift Handover Submitted
   */
  public notifyHandoverSubmitted(params: {
    handoverId: string;
    outgoingTeamName: string;
    incomingTeamId: string;
    itemCount: number;
    actorUserId?: string;
  }) {
    const incomingUsers = localDb
      .getUsers()
      .filter((u) => u.team_id === params.incomingTeamId || u.role === 'admin')
      .map((u) => u.id);

    this.dispatch({
      type: 'system.admin',
      title: '📋 Shift Handover Ready',
      message: `${params.outgoingTeamName} has submitted a shift handover. ${params.itemCount} important items require operational attention.`,
      recipientUserIds: incomingUsers,
      actorUserId: params.actorUserId,
      entityType: 'system',
      entityId: params.handoverId,
      priority: 'high',
      linkPath: `/shift-handover`,
    });
  }

  /**
   * Trigger: Shift Handover Acknowledged
   */
  public notifyHandoverAcknowledged(params: {
    handoverId: string;
    incomingTeamName: string;
    outgoingTeamId: string;
    acknowledgedByName: string;
    actorUserId?: string;
  }) {
    const outgoingAndAdmins = localDb
      .getUsers()
      .filter((u) => u.team_id === params.outgoingTeamId || u.role === 'admin')
      .map((u) => u.id);

    this.dispatch({
      type: 'system.admin',
      title: '✅ Shift Handover Acknowledged',
      message: `${params.incomingTeamName} (${params.acknowledgedByName}) has acknowledged receipt of your shift handover.`,
      recipientUserIds: outgoingAndAdmins,
      actorUserId: params.actorUserId,
      entityType: 'system',
      entityId: params.handoverId,
      priority: 'normal',
      linkPath: `/shift-handover`,
    });
  }
}

export const notificationService = new NotificationService();
