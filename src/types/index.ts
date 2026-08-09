export type UserRole = 'admin' | 'sales_agent' | 'support_agent';

export interface Team {
  id: string;
  name: string;
  shift_info: string;
  description?: string;
  shift_start?: string;
  shift_end?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  team_id: string | null;
  team?: Team | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  whatsapp_number?: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  route?: string | null;
  country: string | null;
  notes: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_profile?: UserProfile | null;
  updated_by: string | null;
  updated_by_profile?: UserProfile | null;
}

export interface CustomerFormInput {
  company_name: string;
  contact_person?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  city?: string;
  route?: string;
  country?: string;
  notes?: string;
  status?: CustomerStatus;
}

// --- Step 3: Customer Query / Support Ticket Types ---

export type QueryPriority = 'low' | 'medium' | 'high' | 'urgent';

export type QueryStatus = 'new' | 'assigned' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed' | 'reopened' | 'open';

export interface QueryCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerQuery {
  id: string;
  query_number: string;
  customer_id: string;
  customer?: Customer | null;
  order_id?: string | null;
  order?: Order | null;
  product_id?: string | null;
  product?: Product | null;
  subject: string;
  description: string;
  category_id: string | null;
  category?: QueryCategory | null;
  priority: QueryPriority;
  status: QueryStatus;
  assigned_to: string | null;
  assigned_to_profile?: UserProfile | null;
  assigned_team_id?: string | null;
  assigned_team?: Team | null;
  created_by: string | null;
  created_by_profile?: UserProfile | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_by_profile?: UserProfile | null;
  resolution: string | null;
  closed_at: string | null;
  closed_by: string | null;
  closed_by_profile?: UserProfile | null;
  closure_reason?: string | null;
  reopened_at: string | null;
  reopened_by: string | null;
  reopened_by_profile?: UserProfile | null;
  reopen_reason: string | null;
  internal_notes: string | null;
  attachments?: QueryAttachment[];
}

export interface QueryFormInput {
  customer_id: string;
  subject: string;
  description: string;
  category_id?: string;
  priority?: QueryPriority;
  order_id?: string;
  product_id?: string;
  assigned_to?: string;
  internal_notes?: string;
}

export interface QueryActivity {
  id: string;
  query_id: string;
  event_type: string;
  previous_value: string | null;
  new_value: string | null;
  description: string;
  performed_by: string | null;
  performed_by_profile?: UserProfile | null;
  created_at: string;
}

export interface QueryInternalNote {
  id: string;
  query_id: string;
  note: string;
  author_id: string | null;
  author_profile?: UserProfile | null;
  created_at: string;
}

export interface QueryAttachment {
  id: string;
  query_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_path: string;
  uploaded_by: string | null;
  uploaded_by_profile?: UserProfile | null;
  uploaded_at: string;
}

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CRMNotification {
  id: string;
  recipient_user_id: string; // Recipient user ID
  user_id?: string; // Legacy alias of recipient_user_id for backward compatibility
  actor_user_id?: string | null;
  actor_profile?: UserProfile | null;
  notification_type: string; // e.g. 'query.assigned', 'order.status_changed', 'product.availability_changed'
  title: string;
  message: string;
  entity_type?: 'query' | 'order' | 'product' | 'system' | null;
  entity_id?: string | null;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string | null;
  link_path?: string | null;
  created_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  query_notifications: boolean;
  order_notifications: boolean;
  product_availability_notifications: boolean;
  urgent_alerts: boolean;
}

// --- Step 4: Order Management Types ---

export type OrderStatus = 
  | 'order_received'
  | 'sales_order_done'
  | 'invoiced'
  | 'dispatched'
  | 'signed_invoice_sent'
  | 'completed'
  | 'cancelled';

export type OrderDocumentType = 
  | 'sales_order'
  | 'invoice'
  | 'dispatch_document'
  | 'signed_invoice'
  | 'other';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  line_total: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  action: string;
  notes: string | null;
  performed_by: string | null;
  performed_by_profile?: UserProfile | null;
  created_at: string;
}

export interface OrderDocument {
  id: string;
  order_id: string;
  document_type: OrderDocumentType;
  file_name: string;
  file_path: string;
  uploaded_by: string | null;
  uploaded_by_profile?: UserProfile | null;
  uploaded_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer?: Customer | null;
  customer_reference?: string | null;
  sales_agent_id: string | null;
  sales_agent_profile?: UserProfile | null;
  team_id?: string | null;
  team?: Team | null;
  order_date: string;
  expected_delivery_date: string | null;
  current_status: OrderStatus;
  subtotal: number;
  total_discount: number;
  total_tax: number;
  grand_total: number;
  currency?: string;
  notes: string | null;
  created_by: string | null;
  created_by_profile?: UserProfile | null;
  created_at: string;
  updated_by: string | null;
  updated_by_profile?: UserProfile | null;
  updated_at: string;
  order_received_at: string | null;
  sales_order_done_at: string | null;
  invoiced_at: string | null;
  dispatched_at: string | null;
  signed_invoice_sent_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_by_profile?: UserProfile | null;
  items?: OrderItem[];
  history?: OrderStatusHistory[];
  documents?: OrderDocument[];
}

export interface OrderItemInput {
  product_id?: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax?: number;
  notes?: string;
}

export interface OrderFormInput {
  customer_id: string;
  customer_reference?: string;
  sales_agent_id?: string;
  team_id?: string;
  order_date?: string;
  expected_delivery_date?: string;
  notes?: string;
  items: OrderItemInput[];
}

// --- Step 5: Product Catalog & Availability Management Types ---

export type ProductAvailabilityStatus = 'available' | 'out_of_stock' | 'discontinued';

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  product_name: string;
  description: string | null;
  category_id: string | null;
  category?: ProductCategory | null;
  brand_id: string | null;
  brand?: ProductBrand | null;
  unit_price: number;
  availability_status: ProductAvailabilityStatus;
  availability_notes: string | null;
  expected_available_date: string | null;
  is_active: boolean;
  created_by: string | null;
  created_by_profile?: UserProfile | null;
  created_at: string;
  updated_by: string | null;
  updated_by_profile?: UserProfile | null;
  updated_at: string;
}

export interface ProductAvailabilityHistory {
  id: string;
  product_id: string;
  previous_status: ProductAvailabilityStatus | null;
  new_status: ProductAvailabilityStatus;
  reason: string | null;
  expected_available_date: string | null;
  changed_by: string | null;
  changed_by_profile?: UserProfile | null;
  changed_at: string;
}

export interface ProductFormInput {
  sku: string;
  product_name: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  unit_price: number;
  availability_status?: ProductAvailabilityStatus;
  availability_notes?: string;
  expected_available_date?: string;
  is_active?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  allowedRoles: UserRole[];
}

export interface KpiCardData {
  id: string;
  title: string;
  value: number | string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  description: string;
}

// --- Step 7: Shift Handover & Team Operations Types ---

export type ShiftStatus = 'upcoming' | 'active' | 'completed';
export type HandoverStatus = 'draft' | 'submitted' | 'acknowledged';
export type HandoverEntityType = 'query' | 'order' | 'product' | 'customer' | 'general_task';

export interface Shift {
  id: string;
  team_id: string;
  team?: Team | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  opened_at: string;
  closed_at?: string | null;
  opened_by?: string | null;
  closed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftHandoverItem {
  id: string;
  handover_id: string;
  entity_type: HandoverEntityType;
  entity_id?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  note: string;
  action_required?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
  completed_by_profile?: UserProfile | null;
  completion_note?: string | null;
  created_by?: string | null;
  created_at: string;
  // Snapshot / Loaded Entity References
  query_snapshot?: CustomerQuery | null;
  order_snapshot?: Order | null;
  product_snapshot?: Product | null;
}

export interface ShiftHandover {
  id: string;
  shift_id?: string | null;
  shift?: Shift | null;
  outgoing_team_id: string;
  outgoing_team?: Team | null;
  incoming_team_id: string;
  incoming_team?: Team | null;
  summary: string;
  important_notes?: string | null;
  status: HandoverStatus;
  created_by?: string | null;
  created_by_profile?: UserProfile | null;
  created_at: string;
  submitted_by?: string | null;
  submitted_by_profile?: UserProfile | null;
  submitted_at?: string | null;
  acknowledged_by?: string | null;
  acknowledged_by_profile?: UserProfile | null;
  acknowledged_at?: string | null;
  items?: ShiftHandoverItem[];
}

export interface HandoverFormInput {
  incoming_team_id: string;
  summary: string;
  important_notes?: string;
  items: {
    entity_type: HandoverEntityType;
    entity_id?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    note: string;
    action_required?: string;
  }[];
}

// --- Step 9: Admin Panel, User Management & Permissions Types ---

export interface SystemSettings {
  id: string;
  company_name: string;
  crm_title: string;
  timezone: string;
  date_format: string;
  currency_symbol: string;
  pagination_limit: number;
  updated_at: string;
  updated_by?: string | null;
  updated_by_profile?: UserProfile | null;
}

export type AuditActionType = 
  | 'user_created' 
  | 'user_updated' 
  | 'user_deactivated' 
  | 'user_activated' 
  | 'role_changed' 
  | 'team_changed' 
  | 'team_created'
  | 'team_updated'
  | 'query_created' 
  | 'query_assigned' 
  | 'query_status_changed' 
  | 'query_category_created'
  | 'query_category_updated'
  | 'order_created' 
  | 'order_status_changed' 
  | 'order_cancelled' 
  | 'product_created'
  | 'product_updated'
  | 'product_availability_changed' 
  | 'product_category_created'
  | 'product_category_updated'
  | 'product_brand_created'
  | 'product_brand_updated'
  | 'shift_handover_submitted' 
  | 'shift_handover_acknowledged' 
  | 'settings_updated'
  | 'import_products'
  | 'import_customers';

export type AuditEntityType = 
  | 'user' 
  | 'team' 
  | 'customer' 
  | 'query' 
  | 'query_category' 
  | 'order' 
  | 'product' 
  | 'product_category' 
  | 'product_brand' 
  | 'shift' 
  | 'shift_handover' 
  | 'system_settings'
  | 'import_job';

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_profile?: UserProfile | null;
  action: AuditActionType | string;
  entity_type: AuditEntityType | string;
  entity_id?: string | null;
  entity_number?: string | null;
  summary: string;
  previous_value?: string | null;
  new_value?: string | null;
}

export interface UserFormInput {
  full_name: string;
  email: string;
  role: UserRole;
  team_id?: string | null;
  is_active: boolean;
}

export interface TeamFormInput {
  name: string;
  shift_info: string;
  description?: string;
  is_active: boolean;
}

export interface CategoryFormInput {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface BrandFormInput {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface ShiftConfigInput {
  team_id: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
}

// --- Step 11: CSV Import System Types ---

export type ImportType = 'products' | 'customers';

export type ImportStrategy = 'create_new_only' | 'update_existing' | 'skip_existing';

export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed';

export interface ImportErrorItem {
  row: number;
  data: Record<string, string>;
  error: string;
}

export interface ImportDuplicateItem {
  row: number;
  data: Record<string, string>;
  existing_id: string;
  existing_name: string;
  existing_identifier: string; // SKU or Phone/WhatsApp
  reason: string;
}

export interface ImportJob {
  id: string;
  import_type: ImportType;
  file_name: string;
  import_strategy: ImportStrategy;
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  status: ImportJobStatus;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
  created_by_profile?: UserProfile | null;
  errors?: ImportErrorItem[];
}



