// Supabase client + in-memory store + write-through helpers are provided by supabaseSync
import { supabase, storageGet, storageSet, storagePrime } from './supabaseSync';
export { supabase };
import { 
  Team, 
  UserProfile, 
  Customer, 
  CustomerFormInput, 
  CustomerStatus,
  QueryCategory,
  CustomerQuery,
  QueryActivity,
  QueryInternalNote,
  QueryAttachment,
  CRMNotification,
  NotificationPriority,
  QueryFormInput,
  QueryPriority,
  QueryStatus,
  Order,
  OrderItem,
  OrderStatusHistory,
  OrderDocument,
  OrderFormInput,
  OrderItemInput,
  OrderStatus,
  OrderDocumentType,
  ProductCategory,
  ProductBrand,
  Product,
  ProductAvailabilityHistory,
  ProductFormInput,
  ProductAvailabilityStatus,
  Shift,
  ShiftStatus,
  ShiftHandover,
  ShiftHandoverItem,
  HandoverStatus,
  HandoverEntityType,
  HandoverFormInput,
  SystemSettings,
  AuditLog,
  AuditActionType,
  AuditEntityType,
  UserFormInput,
  TeamFormInput,
  CategoryFormInput,
  BrandFormInput,
  ShiftConfigInput
} from '../types';
import { notificationService } from './notificationService';
import { permissions } from './permissions';




// Initial Teams Seed Data
export const SEED_TEAMS: Team[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Team 1',
    shift_info: '3 PM – 11 AM',
    shift_start: '15:00',
    shift_end: '11:00',
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Team 2',
    shift_info: '12 PM – 8 AM',
    shift_start: '12:00',
    shift_end: '08:00',
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
];

// Initial Demo Accounts Seed Data
export const SEED_USERS: UserProfile[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'tauseef@jtsupplies.com',
    full_name: 'Tauseef (Admin)',
    role: 'admin',
    team_id: '11111111-1111-1111-1111-111111111111',
    team: SEED_TEAMS[0],
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    email: 'muzammil@jtsupplies.com',
    full_name: 'Muzammil (Sales)',
    role: 'sales_agent',
    team_id: '11111111-1111-1111-1111-111111111111',
    team: SEED_TEAMS[0],
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    email: 'abdulrehman@jtsupplies.com',
    full_name: 'Abdul Rehman (Support)',
    role: 'support_agent',
    team_id: '22222222-2222-2222-2222-222222222222',
    team: SEED_TEAMS[1],
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    email: 'sohail@jtsupplies.com',
    full_name: 'Sohail (Sales)',
    role: 'sales_agent',
    team_id: '11111111-1111-1111-1111-111111111111',
    team: SEED_TEAMS[0],
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    email: 'aasil@jtsupplies.com',
    full_name: 'Aasil (Support)',
    role: 'support_agent',
    team_id: '22222222-2222-2222-2222-222222222222',
    team: SEED_TEAMS[1],
    is_active: true,
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date('2026-01-01').toISOString(),
  },
];

// Initial Business Customers Seed Data
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    customer_code: 'CUST-000001',
    company_name: '0941791 BC.ltd',
    contact_person: 'Gurpreet Singh',
    phone: '+1 (604) 555-0191',
    email: 'contact@0941791bc.ca',
    address: '10245 152 St',
    city: 'Surrey',
    country: 'Canada',
    notes: '17 items priced. Key commercial food packaging account.',
    status: 'active',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
    created_by: 'a1111111-1111-1111-1111-111111111111',
    updated_by: 'a1111111-1111-1111-1111-111111111111',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    customer_code: 'CUST-000002',
    company_name: '4G Commercial',
    contact_person: 'Tariq Mahmood',
    phone: '+1 (250) 555-0144',
    email: 'orders@4gcommercial.com',
    address: '880 Commercial Way',
    city: 'Vancouver',
    country: 'Canada',
    notes: '8 items priced. Commercial supply client.',
    status: 'active',
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString(),
    created_by: 'b2222222-2222-2222-2222-222222222222',
    updated_by: 'b2222222-2222-2222-2222-222222222222',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    customer_code: 'CUST-000003',
    company_name: '5309 Main street, Unit 100',
    contact_person: 'Usman Ali',
    phone: '+1 (604) 555-5309',
    email: 'unit100@mainstreetsupplies.ca',
    address: '5309 Main Street, Unit 100',
    city: 'Vancouver',
    country: 'Canada',
    notes: '1 item priced. Retail location customer.',
    status: 'active',
    created_at: new Date('2026-02-01').toISOString(),
    updated_at: new Date('2026-02-01').toISOString(),
    created_by: 'a1111111-1111-1111-1111-111111111111',
    updated_by: 'a1111111-1111-1111-1111-111111111111',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    customer_code: 'CUST-000004',
    company_name: 'AA Tire Kelowna',
    contact_person: 'Bilal Ahmed',
    phone: '+1 (250) 555-0177',
    email: 'service@aatilekelowna.com',
    address: '1920 Enterprise Way',
    city: 'Kelowna',
    country: 'Canada',
    notes: '3 items priced. Commercial customer.',
    status: 'active',
    created_at: new Date('2026-02-10').toISOString(),
    updated_at: new Date('2026-02-10').toISOString(),
    created_by: 'b2222222-2222-2222-2222-222222222222',
    updated_by: 'b2222222-2222-2222-2222-222222222222',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    customer_code: 'CUST-000005',
    company_name: 'Academy Store',
    contact_person: 'Farhan Khan',
    phone: '+1 (604) 555-0122',
    email: 'manager@academystore.ca',
    address: '3450 Academy Way',
    city: 'Burnaby',
    country: 'Canada',
    notes: '5 items priced. Campus supply store.',
    status: 'active',
    created_at: new Date('2026-02-18').toISOString(),
    updated_at: new Date('2026-02-18').toISOString(),
    created_by: 'b2222222-2222-2222-2222-222222222222',
    updated_by: 'b2222222-2222-2222-2222-222222222222',
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    customer_code: 'CUST-000006',
    company_name: 'Afrofusion Kamloops',
    contact_person: 'Zubair Siddiqui',
    phone: '+1 (250) 555-0188',
    email: 'kitchen@afrofusionkamloops.com',
    address: '450 Tranquille Rd',
    city: 'Kamloops',
    country: 'Canada',
    notes: '18 items priced. Restaurant & food wrapping customer.',
    status: 'active',
    created_at: new Date('2026-02-20').toISOString(),
    updated_at: new Date('2026-03-01').toISOString(),
    created_by: 'a1111111-1111-1111-1111-111111111111',
    updated_by: 'a1111111-1111-1111-1111-111111111111',
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    customer_code: 'CUST-000007',
    company_name: 'Alcatraz Chicken',
    contact_person: 'Hamza Malik',
    phone: '+1 (604) 555-0199',
    email: 'info@alcatrazchicken.com',
    address: '1120 Robson St',
    city: 'Vancouver',
    country: 'Canada',
    notes: '5 items priced. Fast food chain - regular foil & wrap orders.',
    status: 'active',
    created_at: new Date('2026-02-22').toISOString(),
    updated_at: new Date('2026-03-01').toISOString(),
    created_by: 'a1111111-1111-1111-1111-111111111111',
    updated_by: 'a1111111-1111-1111-1111-111111111111',
  },
];

// Initial Query Categories Seed Data
export const SEED_CATEGORIES: QueryCategory[] = [
  { id: '00000000-0000-0000-0001-000000000001', name: 'Order Issue', description: 'Order discrepancies, wrong quantities, or missing order confirmation', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000002', name: 'Delivery Issue', description: 'Carrier delays, damaged packaging, or incorrect delivery address', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000003', name: 'Invoice Issue', description: 'Billing errors, tax exempt status, or missing commercial invoices', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000004', name: 'Product Issue', description: 'Defective items, technical specifications, or quality assurance inquiries', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000005', name: 'Stock Availability', description: 'Product availability inquiries, backorder lead times, or stock restock dates', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000006', name: 'Payment Issue', description: 'Payment gateway failures, wire transfer confirmations, or credit terms', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000007', name: 'Customer Information', description: 'Account contact details, address updates, or tax exemption status', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000008', name: 'General Inquiry', description: 'General business inquiries, catalog requests, or support shift info', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000009', name: 'Other', description: 'Uncategorized customer tickets requiring agent evaluation', is_active: true, created_at: new Date('2026-01-01').toISOString() },
];

// Initial Customer Queries Seed Data
export const SEED_QUERIES: CustomerQuery[] = [
  {
    id: '00000000-0000-0000-0006-000000000001',
    query_number: 'QRY-000001',
    customer_id: '10000000-0000-0000-0000-000000000001',
    subject: 'Urgent Delivery Status for Hydraulic Degreaser Order',
    description: 'Customer requested immediate delivery tracking for order ORD-000001. Carrier shipment appears delayed near Chicago hub.',
    category_id: '00000000-0000-0000-0001-000000000002',
    priority: 'high',
    status: 'in_progress',
    assigned_to: 'c3333333-3333-3333-3333-333333333333',
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    resolved_at: null,
    resolved_by: null,
    resolution: null,
    closed_at: null,
    closed_by: null,
    reopened_at: null,
    reopened_by: null,
    reopen_reason: null,
    internal_notes: 'Contacted carrier logistics manager. Rescheduled delivery for tomorrow morning shift.',
  },
  {
    id: '00000000-0000-0000-0006-000000000002',
    query_number: 'QRY-000002',
    customer_id: '10000000-0000-0000-0000-000000000002',
    subject: 'Availability Inquiry for Heavy Stretch Film 80G',
    description: 'Vanguard Freight wants to place a bulk order of 200 rolls of PackGuard Heavy Stretch Film 80G. Product is marked Out of Stock.',
    category_id: '00000000-0000-0000-0001-000000000005',
    product_id: '00000000-0000-0000-0004-000000000002',
    priority: 'urgent',
    status: 'waiting_customer',
    assigned_to: 'c3333333-3333-3333-3333-333333333333',
    created_by: 'c3333333-3333-3333-3333-333333333333',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    resolved_at: null,
    resolved_by: null,
    resolution: null,
    closed_at: null,
    closed_by: null,
    reopened_at: null,
    reopened_by: null,
    reopen_reason: null,
    internal_notes: 'Notified customer that supplier resin shortage is resolving. Expected availability date sent.',
  },
  {
    id: '00000000-0000-0000-0006-000000000003',
    query_number: 'QRY-000003',
    customer_id: '10000000-0000-0000-0000-000000000003',
    subject: 'Sterile Glove Certificate of Compliance',
    description: 'Horizon Healthcare requested formal QA compliance documentation for SafeShield Nitrile Gloves.',
    category_id: '00000000-0000-0000-0001-000000000004',
    product_id: '00000000-0000-0000-0004-000000000003',
    priority: 'medium',
    status: 'resolved',
    assigned_to: 'c3333333-3333-3333-3333-333333333333',
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    resolved_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    resolved_by: 'c3333333-3333-3333-3333-333333333333',
    resolution: 'Emailed certified compliance datasheet and batch test results directly to Dr. David Chen.',
    closed_at: null,
    closed_by: null,
    reopened_at: null,
    reopened_by: null,
    reopen_reason: null,
    internal_notes: 'QA documentation attached and sent via secure mail.',
  },
];

export const SEED_ACTIVITIES: QueryActivity[] = [
  {
    id: '00000000-0000-0000-0014-000000000001',
    query_id: '00000000-0000-0000-0006-000000000001',
    event_type: 'query_created',
    previous_value: null,
    new_value: 'open',
    description: 'Query QRY-000001 created by Marcus Vance (Sales Agent)',
    performed_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: '00000000-0000-0000-0014-000000000002',
    query_id: '00000000-0000-0000-0006-000000000001',
    event_type: 'status_change',
    previous_value: 'open',
    new_value: 'in_progress',
    description: 'Query status changed from Open to In Progress',
    performed_by: 'c3333333-3333-3333-3333-333333333333',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

export const SEED_NOTES: QueryInternalNote[] = [
  {
    id: '00000000-0000-0000-0015-000000000001',
    query_id: '00000000-0000-0000-0006-000000000001',
    note: 'Initial carrier contact established with Chicago dispatch terminal manager.',
    author_id: 'c3333333-3333-3333-3333-333333333333',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

export const SEED_NOTIFICATIONS: CRMNotification[] = [
  {
    id: '00000000-0000-0000-0016-000000000001',
    recipient_user_id: 'c3333333-3333-3333-3333-333333333333',
    user_id: 'c3333333-3333-3333-3333-333333333333',
    actor_user_id: 'a1111111-1111-1111-1111-111111111111',
    notification_type: 'query.assigned',
    title: '🎫 Support Ticket Assigned',
    message: 'Query QRY-000001 for Apex Industrial Logistics has been assigned to your support queue. Priority: HIGH',
    entity_type: 'query',
    entity_id: '00000000-0000-0000-0006-000000000001',
    priority: 'high',
    link_path: '/queries/00000000-0000-0000-0006-000000000001',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '00000000-0000-0000-0016-000000000002',
    recipient_user_id: 'b2222222-2222-2222-2222-222222222222',
    user_id: 'b2222222-2222-2222-2222-222222222222',
    actor_user_id: 'a1111111-1111-1111-1111-111111111111',
    notification_type: 'product.availability_changed',
    title: '🔴 Product Out of Stock Alert',
    message: 'Product PKG-FILM-80G (PackGuard Heavy Stretch Film) is now OUT OF STOCK. Reason: Resupply resin delay.',
    entity_type: 'product',
    entity_id: '00000000-0000-0000-0004-000000000002',
    priority: 'high',
    link_path: '/products/00000000-0000-0000-0004-000000000002',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: '00000000-0000-0000-0005-000000000001',
    order_number: 'ORD-000001',
    customer_id: '10000000-0000-0000-0000-000000000001',
    sales_agent_id: 'b2222222-2222-2222-2222-222222222222',
    order_date: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    expected_delivery_date: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
    current_status: 'invoiced',
    subtotal: 1450.00,
    total_discount: 50.00,
    total_tax: 140.00,
    grand_total: 1540.00,
    notes: 'Heavy machinery hydraulic components shipment.',
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updated_by: 'b2222222-2222-2222-2222-222222222222',
    updated_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    order_received_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    sales_order_done_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    invoiced_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    dispatched_at: null,
    signed_invoice_sent_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    cancelled_by: null,
  },
  {
    id: '00000000-0000-0000-0005-000000000002',
    order_number: 'ORD-000002',
    customer_id: '10000000-0000-0000-0000-000000000002',
    sales_agent_id: 'b2222222-2222-2222-2222-222222222222',
    order_date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    expected_delivery_date: new Date(Date.now() + 3600000 * 24 * 1).toISOString().split('T')[0],
    current_status: 'dispatched',
    subtotal: 2800.00,
    total_discount: 100.00,
    total_tax: 270.00,
    grand_total: 2970.00,
    notes: 'Priority freight delivery to logistics terminal hub.',
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_by: 'b2222222-2222-2222-2222-222222222222',
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    order_received_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    sales_order_done_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    invoiced_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    dispatched_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    signed_invoice_sent_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    cancelled_by: null,
  },
  {
    id: '00000000-0000-0000-0005-000000000003',
    order_number: 'ORD-000003',
    customer_id: '10000000-0000-0000-0000-000000000003',
    sales_agent_id: 'a1111111-1111-1111-1111-111111111111',
    order_date: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    expected_delivery_date: new Date(Date.now() + 3600000 * 24 * 4).toISOString().split('T')[0],
    current_status: 'order_received',
    subtotal: 750.00,
    total_discount: 0.00,
    total_tax: 75.00,
    grand_total: 825.00,
    notes: 'Sterile healthcare supplies replenishment order.',
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    order_received_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    sales_order_done_at: null,
    invoiced_at: null,
    dispatched_at: null,
    signed_invoice_sent_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    cancelled_by: null,
  },
  {
    id: '00000000-0000-0000-0005-000000000004',
    order_number: 'ORD-000004',
    customer_id: '10000000-0000-0000-0000-000000000004',
    sales_agent_id: 'b2222222-2222-2222-2222-222222222222',
    order_date: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    expected_delivery_date: new Date(Date.now() - 3600000 * 24 * 2).toISOString().split('T')[0],
    current_status: 'completed',
    subtotal: 4200.00,
    total_discount: 200.00,
    total_tax: 400.00,
    grand_total: 4400.00,
    notes: 'Bulk packaging and retail distribution order.',
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated_by: 'b2222222-2222-2222-2222-222222222222',
    updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    order_received_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    sales_order_done_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    invoiced_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    dispatched_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    signed_invoice_sent_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    cancelled_at: null,
    cancellation_reason: null,
    cancelled_by: null,
  },
];

export const SEED_ORDER_ITEMS: OrderItem[] = [
  {
    id: '00000000-0000-0000-0007-000000000001',
    order_id: '00000000-0000-0000-0005-000000000001',
    product_id: '00000000-0000-0000-0004-000000000001',
    product_name_snapshot: 'ProClean Heavy-Duty Degreaser 5Gal',
    sku_snapshot: 'IND-CLEAN-500',
    quantity: 10,
    unit_price: 145.00,
    discount: 50.00,
    tax: 140.00,
    line_total: 1540.00,
    notes: 'Standard 5gal drum packaging.',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    id: '00000000-0000-0000-0007-000000000002',
    order_id: '00000000-0000-0000-0005-000000000002',
    product_id: '00000000-0000-0000-0004-000000000002',
    product_name_snapshot: 'PackGuard Heavy Stretch Film 80 Gauge',
    sku_snapshot: 'PKG-FILM-80G',
    quantity: 40,
    unit_price: 65.00,
    discount: 100.00,
    tax: 270.00,
    line_total: 2770.00,
    notes: 'Palletized 4-roll bundles.',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

export const SEED_ORDER_HISTORY: OrderStatusHistory[] = [
  {
    id: '00000000-0000-0000-0008-000000000001',
    order_id: '00000000-0000-0000-0005-000000000001',
    previous_status: null,
    new_status: 'order_received',
    action: 'Order Received',
    notes: 'Initial customer order registered.',
    performed_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
];

export const SEED_ORDER_DOCUMENTS: OrderDocument[] = [
  {
    id: '00000000-0000-0000-0009-000000000001',
    order_id: '00000000-0000-0000-0005-000000000001',
    document_type: 'sales_order',
    file_name: 'Sales_Order_ORD-000001.pdf',
    file_path: '/documents/ORD-000001/Sales_Order_ORD-000001.pdf',
    uploaded_by: 'b2222222-2222-2222-2222-222222222222',
    uploaded_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
];

// --- Step 5: Product Categories, Brands, Products, & Availability History Seed Datasets ---
export const SEED_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: '00000000-0000-0000-0002-000000000001', name: 'Food Wrap', description: 'Commercial food packaging wraps, cling wraps, parchment and wax paper sheets', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0002-000000000002', name: 'Foil Items', description: 'Standard, heavy-duty, and freezer aluminum foil rolls and insulated sheets', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0002-000000000003', name: 'Bags', description: 'Grease proof dry wax sandwich bags and commercial food service paper bags', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0002-000000000004', name: 'Pizza Essentials', description: 'Standard and corrugated pizza box inserts, liners, and liners cases', is_active: true, created_at: new Date('2026-01-01').toISOString() },
];

export const SEED_PRODUCT_BRANDS: ProductBrand[] = [
  { id: '00000000-0000-0000-0003-000000000001', name: 'J&T Packaging', description: 'Premium commercial food packaging products', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0003-000000000002', name: 'GenPak / Royal', description: 'High quality cling film rolls and baking paper supplies', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0003-000000000003', name: 'FoilPro', description: 'Heavy-duty commercial aluminum foil and freezer paper rolls', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0003-000000000004', name: 'PizzaGuard', description: 'Corrugated and moisture-resistant pizza liner products', is_active: true, created_at: new Date('2026-01-01').toISOString() },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: '00000000-0000-0000-0004-000000000001',
    sku: 'FPK-GEN-ALUMINFOIL-500FT',
    product_name: 'Aluminum Foil Roll - Width 12 inches x 500ft (6/Case)',
    description: 'Food Packaging · Food Wrap | Item Code: 199001 | Pack: Case-6-Pcs | Base UOM: Pieces | Target: Pieces | Min SP: $28.00 | Desired SP: $29.00 | Max SP: $40.50',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000003',
    unit_price: 29.00,
    availability_status: 'available',
    availability_notes: 'In stock for immediate commercial delivery.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-10').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000002',
    sku: 'FPK-FOIL-ALUMINFOIL-18IN',
    product_name: 'Aluminum Foil Roll Heavy Duty - Width 18 inches – Length 45Cmx100m (4/Case)',
    description: 'Food Packaging · Foil Items | Item Code: 106001 | Pack: Case-4-Pcs | Base UOM: Pieces | Target: Pieces | Min SP: $32.99 | Desired SP: $32.99 | Max SP: $38.22',
    category_id: '00000000-0000-0000-0002-000000000002',
    brand_id: '00000000-0000-0000-0003-000000000003',
    unit_price: 32.99,
    availability_status: 'available',
    availability_notes: 'Heavy-duty 18-inch commercial foil in stock.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-15').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000003',
    sku: 'FPK-FOIL-ALUMINFOILWIDTH-18IN',
    product_name: 'Aluminum Foil Roll – Width 18in – Length 152m (per roll)',
    description: 'Food Packaging · Foil Items | Item Code: 106002 | Base UOM: Roll | Target: Roll | Min SP: $33.00 | Desired SP: $38.00 | Max SP: $44.02',
    category_id: '00000000-0000-0000-0002-000000000002',
    brand_id: '00000000-0000-0000-0003-000000000003',
    unit_price: 38.00,
    availability_status: 'available',
    availability_notes: 'Standard 152m single roll packaging.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-01').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-01').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000004',
    sku: 'FPK-GEN-CLINGWRAP-2000FT',
    product_name: 'Cling Wrap Roll 11in – Film PVC 2000 ft – Royal (with cutter)',
    description: 'Food Packaging · Food Wrap | Item Code: 199002 | Base UOM: Roll | Target: Roll | Min SP: $34.00 | Desired SP: $35.00 | Max SP: $40.55',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000002',
    unit_price: 35.00,
    availability_status: 'available',
    availability_notes: 'Equipped with safety slide cutter box.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-10').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-10').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000005',
    sku: 'FPK-GEN-CLINGWRAPFILM-2000FT',
    product_name: 'Cling Wrap Roll 12in – Film PVC 2000 ft',
    description: 'Food Packaging · Food Wrap | Item Code: 199003 | Base UOM: Roll | Target: Roll | Min SP: $30.00 | Desired SP: $35.00 | Max SP: $39.00',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000002',
    unit_price: 35.00,
    availability_status: 'available',
    availability_notes: 'Commercial PVC cling film 12-inch roll.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-05').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-25').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000006',
    sku: 'FPK-GEN-CLINGWRAPFILMPVC-2000FT',
    product_name: 'Cling Wrap Roll 18in – Film PVC 2000 ft (with cutter)',
    description: 'Food Packaging · Food Wrap | Item Code: 199004 | Base UOM: Roll | Target: Roll | Min SP: $35.00 | Desired SP: $37.00 | Max SP: $42.86',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000002',
    unit_price: 37.00,
    availability_status: 'available',
    availability_notes: 'Wide 18-inch roll with integrated cutter.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-12').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000007',
    sku: 'FPK-GEN-ITEM-1',
    product_name: 'Cling Wrap Roll 24in – Film PVC 2000 ft (with cutter)',
    description: 'Food Packaging · Food Wrap | Item Code: 199005 | Base UOM: Roll | Target: Roll | Min SP: $45.00 | Desired SP: $49.99 | Max SP: $57.91',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000002',
    unit_price: 49.99,
    availability_status: 'available',
    availability_notes: 'Extra-wide 24-inch PVC film with cutter.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-15').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000008',
    sku: 'FPK-GEN-PAPERWAX-8X11IN',
    product_name: 'Paper Wax Dry 8×11in Scale - 2000/Pack (4/CS)',
    description: 'Food Packaging · Food Wrap | Item Code: 199006 | Pack: Case-8000-Pcs (+Pack-2000) | Base UOM: Pieces | Target: Case | Min SP: $140.00 | Desired SP: $144.00 | Max SP: $167.20',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000001',
    unit_price: 144.00,
    availability_status: 'available',
    availability_notes: 'Bulk scale dry wax paper case (8000 sheets).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-20').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-01-20').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000009',
    sku: 'FPK-FOIL-FREEZENATURA-18IN',
    product_name: 'Freezer Roll – Natural – Width 18in',
    description: 'Food Packaging · Foil Items | Item Code: 106003 | Base UOM: Roll | Target: Roll | Min SP: $49.00 | Desired SP: $50.00 | Max SP: $57.92',
    category_id: '00000000-0000-0000-0002-000000000002',
    brand_id: '00000000-0000-0000-0003-000000000003',
    unit_price: 50.00,
    availability_status: 'out_of_stock',
    availability_notes: 'Resupply shipment in transit from paper mill.',
    expected_available_date: new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0],
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-22').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000010',
    sku: 'FPK-FOIL-FREEZEROSE-18IN',
    product_name: 'Freezer Roll – Rose – Width 18in',
    description: 'Food Packaging · Foil Items | Item Code: 106004 | Base UOM: Roll | Target: Roll | Min SP: $49.00 | Desired SP: $50.00 | Max SP: $57.92',
    category_id: '00000000-0000-0000-0002-000000000002',
    brand_id: '00000000-0000-0000-0003-000000000003',
    unit_price: 50.00,
    availability_status: 'available',
    availability_notes: 'Rose tint freezer paper roll in stock.',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-01-25').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-01-25').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000011',
    sku: 'FPK-BAG-GREASEPROOF-6X0.75X6.75',
    product_name: 'Grease Proof Dry Wax Sandwich Bags 6"X3/4"x6 3/4" / 6x0.75x6.75 - 1000/CS',
    description: 'Food Packaging · Bags | Item Code: 101001 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $31.00 | Desired SP: $34.00 | Max SP: $40.00',
    category_id: '00000000-0000-0000-0002-000000000003',
    brand_id: '00000000-0000-0000-0003-000000000001',
    unit_price: 34.00,
    availability_status: 'available',
    availability_notes: 'Grease-proof dry wax paper sandwich bags (1000/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-01').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-01').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000012',
    sku: 'FPK-GEN-INSULAALUMIN-12X12IN',
    product_name: 'Insulated Aluminium Foil Paper Sheets – 12×12in (1000/CS)',
    description: 'Food Packaging · Food Wrap | Item Code: 199007 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $39.00 | Desired SP: $42.00 | Max SP: $48.60',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000003',
    unit_price: 42.00,
    availability_status: 'available',
    availability_notes: '12x12 pre-cut insulated foil sheets (1000/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-05').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-05').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000013',
    sku: 'FPK-GEN-INSULAALUMIN-14X14IN',
    product_name: 'Insulated Aluminium Foil Paper Sheets – 14×14in (1000/CS)',
    description: 'Food Packaging · Food Wrap | Item Code: 199008 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $45.00 | Desired SP: $50.00 | Max SP: $57.90',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000003',
    unit_price: 50.00,
    availability_status: 'available',
    availability_notes: '14x14 pre-cut insulated foil sheets (1000/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-08').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-08').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000014',
    sku: 'FPK-GEN-PIZZALINER-11X11',
    product_name: 'Pizza Liner 11x11 400/CS',
    description: 'Food Packaging · Pizza Essentials | Item Code: 199009 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $36.00 | Desired SP: $40.00 | Max SP: $48.00',
    category_id: '00000000-0000-0000-0002-000000000004',
    brand_id: '00000000-0000-0000-0003-000000000004',
    unit_price: 40.00,
    availability_status: 'available',
    availability_notes: '11x11 pizza liners (400/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-10').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-10').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000015',
    sku: 'FPK-GEN-PIZZALINER-13X13',
    product_name: 'Pizza Liner 13x13 - Corrugated - 400/CS',
    description: 'Food Packaging · Pizza Essentials | Item Code: 199010 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $79.00 | Desired SP: $84.00 | Max SP: $95.00',
    category_id: '00000000-0000-0000-0002-000000000004',
    brand_id: '00000000-0000-0000-0003-000000000004',
    unit_price: 84.00,
    availability_status: 'available',
    availability_notes: 'Corrugated 13x13 pizza liners (400/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-12').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-12').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000016',
    sku: 'FPK-GEN-PIZZALINER-15X15',
    product_name: 'Pizza Liner 15x15 - Corrugated - 400/CS',
    description: 'Food Packaging · Pizza Essentials | Item Code: 199011 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $85.00 | Desired SP: $92.00 | Max SP: $105.00',
    category_id: '00000000-0000-0000-0002-000000000004',
    brand_id: '00000000-0000-0000-0003-000000000004',
    unit_price: 92.00,
    availability_status: 'available',
    availability_notes: 'Corrugated 15x15 pizza liners (400/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-15').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-15').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000017',
    sku: 'FPK-GEN-PIZZALINER-9X9',
    product_name: 'Pizza Liner 9x9 - 400/CS',
    description: 'Food Packaging · Pizza Essentials | Item Code: 199012 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $28.00 | Desired SP: $34.00 | Max SP: $40.24',
    category_id: '00000000-0000-0000-0002-000000000004',
    brand_id: '00000000-0000-0000-0003-000000000004',
    unit_price: 34.00,
    availability_status: 'available',
    availability_notes: '9x9 pizza box liners (400/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-18').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-18').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000018',
    sku: 'FPK-GEN-PARCHMPAPER-16X24IN',
    product_name: 'Parchment Paper – Sheet 16×24in (1000/CS)',
    description: 'Food Packaging · Food Wrap | Item Code: 199013 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $120.00 | Desired SP: $124.00 | Max SP: $143.60',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000002',
    unit_price: 124.00,
    availability_status: 'available',
    availability_notes: '16x24 commercial parchment paper sheets (1000/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-20').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-20').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000019',
    sku: 'FPK-GEN-PATTYPAPER-5.25X5.25IN',
    product_name: 'Patty Paper 5.25x5.25in (1000/CS)',
    description: 'Food Packaging · Food Wrap | Item Code: 199014 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $9.50 | Desired SP: $10.00 | Max SP: $10.60',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000001',
    unit_price: 10.00,
    availability_status: 'available',
    availability_notes: '5.25x5.25 burger patty interleaving paper (1000/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-22').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-22').toISOString(),
  },
  {
    id: '00000000-0000-0000-0004-000000000020',
    sku: 'FPK-GEN-WAXPAPER-12X12IN',
    product_name: 'Wax Paper – Black & White – Liner Basket Black Check - 12×12in (1000/CS)',
    description: 'Food Packaging · Food Wrap | Item Code: 199015 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $34.00 | Desired SP: $36.00 | Max SP: $41.70',
    category_id: '00000000-0000-0000-0002-000000000001',
    brand_id: '00000000-0000-0000-0003-000000000001',
    unit_price: 36.00,
    availability_status: 'available',
    availability_notes: 'Black check printed basket liner wax paper (1000/CS).',
    expected_available_date: null,
    is_active: true,
    created_by: 'a1111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-25').toISOString(),
    updated_by: 'a1111111-1111-1111-1111-111111111111',
    updated_at: new Date('2026-02-25').toISOString(),
  },
];

export const SEED_PRODUCT_HISTORY: ProductAvailabilityHistory[] = [
  {
    id: '00000000-0000-0000-0010-000000000001',
    product_id: '00000000-0000-0000-0004-000000000002',
    previous_status: 'available',
    new_status: 'out_of_stock',
    reason: 'Raw chemical resin shortage from main supplier. Resupply shipment scheduled.',
    expected_available_date: new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0],
    changed_by: 'a1111111-1111-1111-1111-111111111111',
    changed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: '00000000-0000-0000-0010-000000000002',
    product_id: '00000000-0000-0000-0004-000000000004',
    previous_status: 'available',
    new_status: 'out_of_stock',
    reason: 'Factory line overhaul. Lead time approximately 2 weeks.',
    expected_available_date: new Date(Date.now() + 3600000 * 24 * 14).toISOString().split('T')[0],
    changed_by: 'a1111111-1111-1111-1111-111111111111',
    changed_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

export const SEED_SHIFTS: Shift[] = [
  {
    id: '00000000-0000-0000-0011-000000000001',
    team_id: '11111111-1111-1111-1111-111111111111',
    shift_date: new Date().toISOString().split('T')[0],
    start_time: '15:00',
    end_time: '11:00',
    status: 'active',
    opened_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    opened_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: '00000000-0000-0000-0011-000000000002',
    team_id: '22222222-2222-2222-2222-222222222222',
    shift_date: new Date().toISOString().split('T')[0],
    start_time: '12:00',
    end_time: '08:00',
    status: 'active',
    opened_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    opened_by: 'c3333333-3333-3333-3333-333333333333',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export const SEED_HANDOVERS: ShiftHandover[] = [
  {
    id: '00000000-0000-0000-0012-000000000001',
    shift_id: '00000000-0000-0000-0011-000000000001',
    outgoing_team_id: '11111111-1111-1111-1111-111111111111',
    incoming_team_id: '22222222-2222-2222-2222-222222222222',
    summary: 'Busy operational shift. Order fulfillment and inquiry handovers processed smoothly.',
    important_notes: 'Apex Industrial Logistics requires freight delivery confirmation for ORD-000001. PackGuard Heavy Stretch Film 80G remains Out of Stock.',
    status: 'submitted',
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    submitted_by: 'b2222222-2222-2222-2222-222222222222',
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    acknowledged_by: null,
    acknowledged_at: null,
  },
];

export const SEED_HANDOVER_ITEMS: ShiftHandoverItem[] = [
  {
    id: 'hitem-3001',
    handover_id: 'handover-2001',
    entity_type: 'query',
    entity_id: 'qry-10000000-0000-0000-0000-000000000001',
    priority: 'high',
    note: 'Customer Apex Industrial Logistics inquiring about delivery timeframe.',
    action_required: 'Check logistics manifest once carrier updates status.',
    is_completed: false,
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'hitem-3002',
    handover_id: 'handover-2001',
    entity_type: 'order',
    entity_id: 'ord-10000000-0000-0000-0000-000000000001',
    priority: 'high',
    note: 'Order ORD-000001 invoiced and ready for freight dispatch.',
    action_required: 'Confirm dispatch carrier bill of lading.',
    is_completed: false,
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'hitem-3003',
    handover_id: 'handover-2001',
    entity_type: 'product',
    entity_id: 'prod-0002-0000-0000-000000000002',
    priority: 'urgent',
    note: 'PackGuard Heavy Stretch Film 80G is currently Out of Stock.',
    action_required: 'Follow up with primary resin supplier for expected ETA.',
    is_completed: false,
    created_by: 'b2222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

class LocalDatabaseService {
  private teamsKey = 'jt_crm_teams';
  private usersKey = 'jt_crm_users';
  private customersKey = 'jt_crm_customers';
  private categoriesKey = 'jt_crm_query_categories';
  private queriesKey = 'jt_crm_queries';
  private activitiesKey = 'jt_crm_query_activities';
  private notesKey = 'jt_crm_query_notes';
  private notificationsKey = 'jt_crm_notifications';
  private ordersKey = 'jt_crm_orders';
  private orderItemsKey = 'jt_crm_order_items';
  private orderHistoryKey = 'jt_crm_order_history';
  private orderDocsKey = 'jt_crm_order_documents';

  // Step 5 Product Availability Keys
  private productCategoriesKey = 'jt_crm_product_categories';
  private productBrandsKey = 'jt_crm_product_brands';
  private productsKey = 'jt_crm_products';
  private productHistoryKey = 'jt_crm_product_history';

  // Step 7 Shift Handover Keys
  private shiftsKey = 'jt_crm_shifts';
  private handoversKey = 'jt_crm_handovers';
  private handoverItemsKey = 'jt_crm_handover_items';

  // Step 8 Query Attachments Key
  private queryAttachmentsKey = 'jt_crm_query_attachments';

  // Step 9 Admin Panel Keys
  private systemSettingsKey = 'jt_crm_system_settings';
  private auditLogsKey = 'jt_crm_audit_logs';

  constructor() {
    this.init();
  }

  private init() {
    // Seed the in-memory store with demo data so the app is usable before any
    // Supabase connection exists. initializeFromSupabase() (called on login)
    // overwrites these keys with live data when a connection is configured.
    const seeds: Array<[string, unknown]> = [
      [this.teamsKey, SEED_TEAMS],
      [this.usersKey, SEED_USERS],
      [this.customersKey, SEED_CUSTOMERS],
      [this.categoriesKey, SEED_CATEGORIES],
      [this.queriesKey, SEED_QUERIES],
      [this.activitiesKey, SEED_ACTIVITIES],
      [this.notesKey, SEED_NOTES],
      [this.notificationsKey, SEED_NOTIFICATIONS],
      [this.ordersKey, SEED_ORDERS],
      [this.orderItemsKey, SEED_ORDER_ITEMS],
      [this.orderHistoryKey, SEED_ORDER_HISTORY],
      [this.orderDocsKey, SEED_ORDER_DOCUMENTS],
      [this.productCategoriesKey, SEED_PRODUCT_CATEGORIES],
      [this.productBrandsKey, SEED_PRODUCT_BRANDS],
      [this.productsKey, SEED_PRODUCTS],
      [this.productHistoryKey, SEED_PRODUCT_HISTORY],
      [this.shiftsKey, SEED_SHIFTS],
      [this.handoversKey, SEED_HANDOVERS],
      [this.handoverItemsKey, SEED_HANDOVER_ITEMS],
      [this.queryAttachmentsKey, []],
    ];

    seeds.forEach(([key, rows]) => {
      if (storageGet(key) === null) {
        storagePrime(key, JSON.stringify(rows));
      }
    });

    if (storageGet(this.systemSettingsKey) === null) {
      const defaultSettings: SystemSettings = {
        id: '00000000-0000-0000-0000-0000000000a1',
        company_name: 'J&T Supplies',
        crm_title: 'J&T Supplies CRM',
        timezone: 'America/New_York',
        date_format: 'MMM D, YYYY h:mm A',
        currency_symbol: '$',
        pagination_limit: 10,
        updated_at: new Date().toISOString(),
        updated_by: 'a1111111-1111-1111-1111-111111111111',
      };
      storagePrime(this.systemSettingsKey, JSON.stringify(defaultSettings));
    }

    if (storageGet(this.auditLogsKey) === null) {
      const seedAuditLogs: AuditLog[] = [
        {
          id: 'audit-001',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          user_id: 'a1111111-1111-1111-1111-111111111111',
          action: 'user_created',
          entity_type: 'user',
          entity_id: 'u2222222-2222-2222-2222-222222222222',
          entity_number: 'Ali Khan',
          summary: 'Created Sales Agent user account for Ali Khan',
          previous_value: null,
          new_value: 'role: sales_agent, team: Team 1',
        },
        {
          id: 'audit-002',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          user_id: 'a1111111-1111-1111-1111-111111111111',
          action: 'product_availability_changed',
          entity_type: 'product',
          entity_id: 'p3333333-3333-3333-3333-333333333333',
          entity_number: 'PKG-FILM-80G',
          summary: 'Marked stretch film out of stock due to raw material supplier delay',
          previous_value: 'available',
          new_value: 'out_of_stock',
        },
      ];
      storagePrime(this.auditLogsKey, JSON.stringify(seedAuditLogs));
    }
  }

  public getTeams(): Team[] {
    try {
      const data = storageGet(this.teamsKey);
      return data ? JSON.parse(data) : SEED_TEAMS;
    } catch {
      return SEED_TEAMS;
    }
  }

  public getTeamById(id: string): Team | null {
    const teams = this.getTeams();
    return teams.find(t => t.id === id) || null;
  }

  public getUsers(): UserProfile[] {
    try {
      const data = storageGet(this.usersKey);
      const users: UserProfile[] = data ? JSON.parse(data) : SEED_USERS;
      const teams = this.getTeams();
      
      return users.map(u => ({
        ...u,
        team: teams.find(t => t.id === u.team_id) || null
      }));
    } catch {
      return SEED_USERS;
    }
  }

  public getUserByEmail(email: string): UserProfile | null {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public getUserById(id: string): UserProfile | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  // --- Customers Service Methods ---

  public getCustomers(searchTerm: string = '', statusFilter: 'all' | 'active' | 'inactive' = 'all'): Customer[] {
    try {
      const data = storageGet(this.customersKey);
      let customers: Customer[] = data ? JSON.parse(data) : SEED_CUSTOMERS;
      const users = this.getUsers();

      customers = customers.map(c => ({
        ...c,
        created_by_profile: c.created_by ? users.find(u => u.id === c.created_by) || null : null,
        updated_by_profile: c.updated_by ? users.find(u => u.id === c.updated_by) || null : null,
      }));

      if (statusFilter !== 'all') {
        customers = customers.filter(c => c.status === statusFilter);
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        customers = customers.filter(c =>
          c.customer_code.toLowerCase().includes(query) ||
          c.company_name.toLowerCase().includes(query) ||
          (c.contact_person && c.contact_person.toLowerCase().includes(query)) ||
          (c.phone && c.phone.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.city && c.city.toLowerCase().includes(query))
        );
      }

      return customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return SEED_CUSTOMERS;
    }
  }

  public getCustomerById(id: string): Customer | null {
    const customers = this.getCustomers();
    return customers.find(c => c.id === id) || null;
  }

  public generateCustomerCode(): string {
    const customers = this.getCustomers();
    let maxNum = 0;

    customers.forEach(c => {
      if (c.customer_code && c.customer_code.startsWith('CUST-')) {
        const numPart = parseInt(c.customer_code.replace('CUST-', ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `CUST-${nextNum.toString().padStart(6, '0')}`;
  }

  public createCustomer(input: CustomerFormInput, userId: string): Customer {
    const customers = this.getCustomers();
    const customerCode = this.generateCustomerCode();

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      customer_code: customerCode,
      company_name: input.company_name.trim(),
      contact_person: input.contact_person?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || 'USA',
      notes: input.notes?.trim() || null,
      status: input.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      updated_by: userId,
    };

    storageSet(this.customersKey, JSON.stringify([newCustomer, ...customers]));

    const userProfile = this.getUserById(userId);
    return {
      ...newCustomer,
      created_by_profile: userProfile,
      updated_by_profile: userProfile,
    };
  }

  public updateCustomer(id: string, input: CustomerFormInput, userId: string): Customer | null {
    const rawData = storageGet(this.customersKey);
    const customers: Customer[] = rawData ? JSON.parse(rawData) : SEED_CUSTOMERS;
    
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    const existing = customers[index];
    const updated: Customer = {
      ...existing,
      company_name: input.company_name.trim(),
      contact_person: input.contact_person?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || 'USA',
      notes: input.notes?.trim() || null,
      status: input.status || existing.status,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    customers[index] = updated;
    storageSet(this.customersKey, JSON.stringify(customers));

    const updater = this.getUserById(userId);
    const creator = existing.created_by ? this.getUserById(existing.created_by) : null;

    return {
      ...updated,
      created_by_profile: creator,
      updated_by_profile: updater,
    };
  }

  public toggleCustomerStatus(id: string, status: CustomerStatus, userId: string): Customer | null {
    const rawData = storageGet(this.customersKey);
    const customers: Customer[] = rawData ? JSON.parse(rawData) : SEED_CUSTOMERS;
    
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    const existing = customers[index];
    const updated: Customer = {
      ...existing,
      status,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    customers[index] = updated;
    storageSet(this.customersKey, JSON.stringify(customers));

    const updater = this.getUserById(userId);
    const creator = existing.created_by ? this.getUserById(existing.created_by) : null;

    return {
      ...updated,
      created_by_profile: creator,
      updated_by_profile: updater,
    };
  }

  // --- Step 3: Query Categories & Queries Service Methods ---

  public getCategories(): QueryCategory[] {
    try {
      const data = storageGet(this.categoriesKey);
      return data ? JSON.parse(data) : SEED_CATEGORIES;
    } catch {
      return SEED_CATEGORIES;
    }
  }

  public getCategoryById(id: string): QueryCategory | null {
    const cats = this.getCategories();
    return cats.find(c => c.id === id) || null;
  }

  public generateQueryNumber(): string {
    const queries = this.getQueriesRaw();
    let maxNum = 0;

    queries.forEach(q => {
      if (q.query_number && q.query_number.startsWith('QRY-')) {
        const numPart = parseInt(q.query_number.replace('QRY-', ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `QRY-${nextNum.toString().padStart(6, '0')}`;
  }

  private getQueriesRaw(): CustomerQuery[] {
    try {
      const data = storageGet(this.queriesKey);
      return data ? JSON.parse(data) : SEED_QUERIES;
    } catch {
      return SEED_QUERIES;
    }
  }

  public getQueries(
    filters: {
      status?: string;
      priority?: string;
      category_id?: string;
      assigned_to?: string;
      team_id?: string;
      customer_id?: string;
      searchTerm?: string;
      myQueriesOnly?: boolean;
    } = {},
    currentUserId?: string
  ): CustomerQuery[] {
    let queries = this.getQueriesRaw();
    const customers = this.getCustomers();
    const users = this.getUsers();
    const categories = this.getCategories();
    const products = this.getProducts();
    const teams = this.getTeams();
    const orders = this.getOrders();

    queries = queries.map(q => {
      const assignedUser = q.assigned_to ? users.find(u => u.id === q.assigned_to) || null : null;
      const assignedTeamId = q.assigned_team_id || (assignedUser ? assignedUser.team_id : null);
      
      return {
        ...q,
        customer: customers.find(c => c.id === q.customer_id) || null,
        order: q.order_id ? orders.find(o => o.id === q.order_id) || null : null,
        category: q.category_id ? categories.find(cat => cat.id === q.category_id) || null : null,
        product: q.product_id ? products.find(p => p.id === q.product_id) || null : null,
        assigned_to_profile: assignedUser,
        assigned_team_id: assignedTeamId,
        assigned_team: assignedTeamId ? teams.find(t => t.id === assignedTeamId) || null : null,
        created_by_profile: q.created_by ? users.find(u => u.id === q.created_by) || null : null,
        resolved_by_profile: q.resolved_by ? users.find(u => u.id === q.resolved_by) || null : null,
        closed_by_profile: q.closed_by ? users.find(u => u.id === q.closed_by) || null : null,
        reopened_by_profile: q.reopened_by ? users.find(u => u.id === q.reopened_by) || null : null,
        attachments: this.getQueryAttachments(q.id),
      };
    });

    if (filters.myQueriesOnly && currentUserId) {
      queries = queries.filter(q => q.assigned_to === currentUserId);
    }
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'open') {
        queries = queries.filter(q => q.status === 'new' || q.status === 'open' || q.status === 'assigned');
      } else {
        queries = queries.filter(q => q.status === filters.status);
      }
    }
    if (filters.priority && filters.priority !== 'all') {
      queries = queries.filter(q => q.priority === filters.priority);
    }
    if (filters.category_id && filters.category_id !== 'all') {
      queries = queries.filter(q => q.category_id === filters.category_id);
    }
    if (filters.assigned_to && filters.assigned_to !== 'all') {
      queries = queries.filter(q => q.assigned_to === filters.assigned_to);
    }
    if (filters.team_id && filters.team_id !== 'all') {
      queries = queries.filter(q => q.assigned_team_id === filters.team_id);
    }
    if (filters.customer_id) {
      queries = queries.filter(q => q.customer_id === filters.customer_id);
    }
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const qStr = filters.searchTerm.toLowerCase().trim();
      queries = queries.filter(q =>
        q.query_number.toLowerCase().includes(qStr) ||
        q.subject.toLowerCase().includes(qStr) ||
        (q.customer && q.customer.company_name.toLowerCase().includes(qStr)) ||
        (q.customer && q.customer.customer_code.toLowerCase().includes(qStr)) ||
        (q.customer && q.customer.phone && q.customer.phone.toLowerCase().includes(qStr)) ||
        (q.order && q.order.order_number.toLowerCase().includes(qStr)) ||
        (q.product && q.product.sku.toLowerCase().includes(qStr)) ||
        (q.assigned_to_profile && q.assigned_to_profile.full_name.toLowerCase().includes(qStr))
      );
    }

    return queries.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  public getQueryById(id: string): CustomerQuery | null {
    const queries = this.getQueries();
    return queries.find(q => q.id === id) || null;
  }

  public createQuery(input: QueryFormInput, userId: string): CustomerQuery {
    const queries = this.getQueriesRaw();
    const queryNumber = this.generateQueryNumber();
    const assignedUser = input.assigned_to ? this.getUserById(input.assigned_to) : null;
    const initialStatus: QueryStatus = input.assigned_to ? 'assigned' : 'new';

    const newQuery: CustomerQuery = {
      id: crypto.randomUUID(),
      query_number: queryNumber,
      customer_id: input.customer_id,
      order_id: input.order_id || null,
      product_id: input.product_id || null,
      subject: input.subject.trim(),
      description: input.description.trim(),
      category_id: input.category_id || null,
      priority: input.priority || 'medium',
      status: initialStatus,
      assigned_to: input.assigned_to || null,
      assigned_team_id: assignedUser ? assignedUser.team_id : null,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      resolved_by: null,
      resolution: null,
      closed_at: null,
      closed_by: null,
      closure_reason: null,
      reopened_at: null,
      reopened_by: null,
      reopen_reason: null,
      internal_notes: input.internal_notes?.trim() || null,
    };

    storageSet(this.queriesKey, JSON.stringify([newQuery, ...queries]));

    this.logActivity({
      query_id: newQuery.id,
      event_type: 'query_created',
      previous_value: null,
      new_value: initialStatus,
      description: `Query ${queryNumber} created for customer`,
      performed_by: userId,
    });

    if (input.internal_notes && input.internal_notes.trim()) {
      this.addQueryInternalNote(newQuery.id, input.internal_notes.trim(), userId);
    }

    if (input.priority === 'urgent') {
      const cust = this.getCustomerById(input.customer_id);
      notificationService.notifyUrgentQueryCreated({
        queryNumber: queryNumber,
        queryId: newQuery.id,
        customerName: cust ? cust.company_name : 'Customer',
        subject: input.subject,
        assignedAgentId: input.assigned_to || undefined,
        actorUserId: userId,
      });
    } else if (input.assigned_to) {
      const cust = this.getCustomerById(input.customer_id);
      notificationService.notifyQueryAssigned({
        queryNumber: queryNumber,
        queryId: newQuery.id,
        customerName: cust ? cust.company_name : 'Customer',
        priority: input.priority || 'medium',
        recipientAgentId: input.assigned_to,
        actorUserId: userId,
      });
    }

    return this.getQueryById(newQuery.id)!;
  }

  public updateQuery(id: string, input: Partial<QueryFormInput>, userId: string): CustomerQuery | null {
    const queries = this.getQueriesRaw();
    const index = queries.findIndex(q => q.id === id);
    if (index === -1) return null;

    const existing = queries[index];
    const assignedUser = input.assigned_to !== undefined ? (input.assigned_to ? this.getUserById(input.assigned_to) : null) : null;

    const updated: CustomerQuery = {
      ...existing,
      subject: input.subject !== undefined ? input.subject.trim() : existing.subject,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      category_id: input.category_id !== undefined ? input.category_id : existing.category_id,
      order_id: input.order_id !== undefined ? input.order_id : existing.order_id,
      product_id: input.product_id !== undefined ? input.product_id : existing.product_id,
      priority: input.priority !== undefined ? input.priority : existing.priority,
      assigned_to: input.assigned_to !== undefined ? input.assigned_to : existing.assigned_to,
      assigned_team_id: assignedUser ? assignedUser.team_id : existing.assigned_team_id,
      updated_at: new Date().toISOString(),
    };

    queries[index] = updated;
    storageSet(this.queriesKey, JSON.stringify(queries));

    this.logActivity({
      query_id: id,
      event_type: 'query_updated',
      previous_value: null,
      new_value: null,
      description: `Query ${existing.query_number} details updated`,
      performed_by: userId,
    });

    return this.getQueryById(id);
  }

  public assignQuery(queryId: string, assignedToUserId: string | null, currentUserId: string): CustomerQuery | null {
    const queries = this.getQueriesRaw();
    const index = queries.findIndex(q => q.id === queryId);
    if (index === -1) return null;

    const existing = queries[index];
    const previousAssignee = existing.assigned_to;
    const assignee = assignedToUserId ? this.getUserById(assignedToUserId) : null;
    
    // Auto transition status from new/open to assigned if assigning agent
    const newStatus: QueryStatus = (existing.status === 'new' || existing.status === 'open') && assignedToUserId ? 'assigned' : existing.status;

    const updated: CustomerQuery = {
      ...existing,
      assigned_to: assignedToUserId,
      assigned_team_id: assignee ? assignee.team_id : existing.assigned_team_id,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    queries[index] = updated;
    storageSet(this.queriesKey, JSON.stringify(queries));

    const assigneeName = assignee ? assignee.full_name : 'Unassigned Queue';

    this.logActivity({
      query_id: queryId,
      event_type: 'agent_assigned',
      previous_value: previousAssignee,
      new_value: assignedToUserId,
      description: `Query assigned to ${assigneeName}`,
      performed_by: currentUserId,
    });

    if (assignedToUserId) {
      const cust = existing.customer || (existing.customer_id ? this.getCustomerById(existing.customer_id) : null);
      const custName = cust ? cust.company_name : 'Customer';

      if (previousAssignee) {
        notificationService.notifyQueryReassigned({
          queryNumber: existing.query_number,
          queryId: queryId,
          customerName: custName,
          newAgentId: assignedToUserId,
          actorUserId: currentUserId,
        });
      } else {
        notificationService.notifyQueryAssigned({
          queryNumber: existing.query_number,
          queryId: queryId,
          customerName: custName,
          priority: existing.priority,
          recipientAgentId: assignedToUserId,
          actorUserId: currentUserId,
        });
      }
    }

    return this.getQueryById(queryId);
  }

  public changeQueryStatus(
    queryId: string, 
    targetStatus: QueryStatus, 
    currentUserId: string,
    extraData?: { resolution?: string; reopen_reason?: string; closure_reason?: string }
  ): CustomerQuery | null {
    const queries = this.getQueriesRaw();
    const index = queries.findIndex(q => q.id === queryId);
    if (index === -1) return null;

    const existing = queries[index];
    const previousStatus = existing.status;

    if (targetStatus === 'resolved' && (!extraData?.resolution || !extraData.resolution.trim())) {
      throw new Error('Resolution text is mandatory when resolving a query.');
    }

    if (targetStatus === 'reopened' && (!extraData?.reopen_reason || !extraData.reopen_reason.trim())) {
      throw new Error('Reopen reason is mandatory when reopening a query.');
    }

    const updated: CustomerQuery = {
      ...existing,
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === 'resolved') {
      updated.resolved_at = new Date().toISOString();
      updated.resolved_by = currentUserId;
      updated.resolution = extraData!.resolution!.trim();
    } else if (targetStatus === 'closed') {
      updated.closed_at = new Date().toISOString();
      updated.closed_by = currentUserId;
      if (extraData?.closure_reason) {
        updated.closure_reason = extraData.closure_reason.trim();
      }
    } else if (targetStatus === 'reopened') {
      updated.reopened_at = new Date().toISOString();
      updated.reopened_by = currentUserId;
      updated.reopen_reason = extraData!.reopen_reason!.trim();
    }

    queries[index] = updated;
    storageSet(this.queriesKey, JSON.stringify(queries));

    this.logActivity({
      query_id: queryId,
      event_type: 'status_changed',
      previous_value: previousStatus,
      new_value: targetStatus,
      description: `Query status changed from ${previousStatus.replace('_', ' ').toUpperCase()} to ${targetStatus.replace('_', ' ').toUpperCase()}`,
      performed_by: currentUserId,
    });

    if (targetStatus === 'reopened') {
      const cust = existing.customer || (existing.customer_id ? this.getCustomerById(existing.customer_id) : null);
      notificationService.notifyQueryReopened({
        queryNumber: existing.query_number,
        queryId: queryId,
        customerName: cust ? cust.company_name : 'Customer',
        reopenReason: extraData!.reopen_reason!,
        assignedAgentId: existing.assigned_to || undefined,
        actorUserId: currentUserId,
      });
    }

    return this.getQueryById(queryId);
  }

  // --- Attachments Methods ---

  public getQueryAttachments(queryId: string): QueryAttachment[] {
    try {
      const data = storageGet(this.queryAttachmentsKey);
      const list: QueryAttachment[] = data ? JSON.parse(data) : [];
      const users = this.getUsers();

      return list
        .filter(a => a.query_id === queryId)
        .map(a => ({
          ...a,
          uploaded_by_profile: a.uploaded_by ? users.find(u => u.id === a.uploaded_by) || null : null,
        }))
        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    } catch {
      return [];
    }
  }

  public addQueryAttachment(
    queryId: string,
    fileName: string,
    filePath: string,
    fileSize?: number,
    fileType?: string,
    userId?: string
  ): QueryAttachment {
    const data = storageGet(this.queryAttachmentsKey);
    const list: QueryAttachment[] = data ? JSON.parse(data) : [];

    const newAtt: QueryAttachment = {
      id: crypto.randomUUID(),
      query_id: queryId,
      file_name: fileName.trim(),
      file_size: fileSize || 1024 * 128,
      file_type: fileType || 'document',
      file_path: filePath,
      uploaded_by: userId || null,
      uploaded_at: new Date().toISOString(),
    };

    storageSet(this.queryAttachmentsKey, JSON.stringify([...list, newAtt]));

    if (userId) {
      this.logActivity({
        query_id: queryId,
        event_type: 'attachment_added',
        previous_value: null,
        new_value: fileName,
        description: `Attachment '${fileName}' uploaded to query`,
        performed_by: userId,
      });
    }

    return newAtt;
  }

  // --- Activities Audit Log Methods ---

  public getQueryActivities(queryId: string): QueryActivity[] {
    try {
      const data = storageGet(this.activitiesKey);
      let activities: QueryActivity[] = data ? JSON.parse(data) : SEED_ACTIVITIES;
      const users = this.getUsers();

      return activities
        .filter(a => a.query_id === queryId)
        .map(a => ({
          ...a,
          performed_by_profile: a.performed_by ? users.find(u => u.id === a.performed_by) || null : null,
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return SEED_ACTIVITIES;
    }
  }

  public logActivity(activity: Omit<QueryActivity, 'id' | 'created_at'>): QueryActivity {
    const data = storageGet(this.activitiesKey);
    const activities: QueryActivity[] = data ? JSON.parse(data) : SEED_ACTIVITIES;

    const newActivity: QueryActivity = {
      id: crypto.randomUUID(),
      ...activity,
      created_at: new Date().toISOString(),
    };

    storageSet(this.activitiesKey, JSON.stringify([...activities, newActivity]));
    return newActivity;
  }

  // --- Internal Agent Notes Methods ---

  public getQueryInternalNotes(queryId: string): QueryInternalNote[] {
    try {
      const data = storageGet(this.notesKey);
      let notes: QueryInternalNote[] = data ? JSON.parse(data) : SEED_NOTES;
      const users = this.getUsers();

      return notes
        .filter(n => n.query_id === queryId)
        .map(n => ({
          ...n,
          author_profile: n.author_id ? users.find(u => u.id === n.author_id) || null : null,
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return SEED_NOTES;
    }
  }

  public addQueryInternalNote(queryId: string, noteText: string, authorUserId: string): QueryInternalNote {
    const data = storageGet(this.notesKey);
    const notes: QueryInternalNote[] = data ? JSON.parse(data) : SEED_NOTES;

    const newNote: QueryInternalNote = {
      id: crypto.randomUUID(),
      query_id: queryId,
      note: noteText.trim(),
      author_id: authorUserId,
      created_at: new Date().toISOString(),
    };

    storageSet(this.notesKey, JSON.stringify([...notes, newNote]));

    this.logActivity({
      query_id: queryId,
      event_type: 'internal_note_added',
      previous_value: null,
      new_value: null,
      description: 'Confidential internal note added by agent',
      performed_by: authorUserId,
    });

    const author = this.getUserById(authorUserId);
    return {
      ...newNote,
      author_profile: author,
    };
  }

  // --- Notifications Data Access Methods ---

  public getNotifications(
    userId?: string,
    options?: {
      unreadOnly?: boolean;
      priority?: string;
      entityType?: string;
      searchTerm?: string;
    }
  ): CRMNotification[] {
    try {
      const data = storageGet(this.notificationsKey);
      let notifs: CRMNotification[] = data ? JSON.parse(data) : SEED_NOTIFICATIONS;

      // Ensure backward compatibility mapping recipient_user_id <-> user_id
      notifs = notifs.map(n => ({
        ...n,
        recipient_user_id: n.recipient_user_id || n.user_id || '',
        user_id: n.user_id || n.recipient_user_id || '',
        priority: n.priority || 'normal',
        notification_type: n.notification_type || (n as any).type || 'info',
        actor_profile: n.actor_user_id ? this.getUserById(n.actor_user_id) : null,
      }));

      // Filter by recipient user ID (users ONLY see their own notifications)
      if (userId) {
        notifs = notifs.filter(n => n.recipient_user_id === userId || n.user_id === userId);
      }

      // Filter by read status
      if (options?.unreadOnly) {
        notifs = notifs.filter(n => !n.is_read);
      }

      // Filter by priority
      if (options?.priority && options.priority !== 'all') {
        notifs = notifs.filter(n => n.priority === options.priority);
      }

      // Filter by entity type
      if (options?.entityType && options.entityType !== 'all') {
        notifs = notifs.filter(n => n.entity_type === options.entityType);
      }

      // Search filter
      if (options?.searchTerm?.trim()) {
        const q = options.searchTerm.toLowerCase().trim();
        notifs = notifs.filter(n =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.link_path && n.link_path.toLowerCase().includes(q))
        );
      }

      return notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return SEED_NOTIFICATIONS;
    }
  }

  public getUnreadNotificationsCount(userId: string): number {
    return this.getNotifications(userId, { unreadOnly: true }).length;
  }

  public getUrgentNotificationsCount(userId: string): number {
    const userNotifs = this.getNotifications(userId, { unreadOnly: true });
    return userNotifs.filter(n => n.priority === 'urgent' || n.priority === 'high').length;
  }

  public createNotification(input: {
    recipient_user_id: string;
    actor_user_id?: string | null;
    notification_type: string;
    title: string;
    message: string;
    entity_type?: 'query' | 'order' | 'product' | 'system' | null;
    entity_id?: string | null;
    priority?: NotificationPriority;
    link_path?: string | null;
  }): CRMNotification {
    const allNotifs = this.getNotifications();

    const newNotif: CRMNotification = {
      id: crypto.randomUUID(),
      recipient_user_id: input.recipient_user_id,
      user_id: input.recipient_user_id,
      actor_user_id: input.actor_user_id || null,
      notification_type: input.notification_type,
      title: input.title.trim(),
      message: input.message.trim(),
      entity_type: input.entity_type || null,
      entity_id: input.entity_id || null,
      priority: input.priority || 'normal',
      link_path: input.link_path || null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    storageSet(this.notificationsKey, JSON.stringify([newNotif, ...allNotifs]));
    return newNotif;
  }

  public markNotificationAsRead(id: string): boolean {
    const notifs = this.getNotifications();
    const index = notifs.findIndex(n => n.id === id);
    if (index === -1) return false;

    notifs[index].is_read = true;
    notifs[index].read_at = new Date().toISOString();
    storageSet(this.notificationsKey, JSON.stringify(notifs));
    return true;
  }

  public markNotificationAsUnread(id: string): boolean {
    const notifs = this.getNotifications();
    const index = notifs.findIndex(n => n.id === id);
    if (index === -1) return false;

    notifs[index].is_read = false;
    notifs[index].read_at = null;
    storageSet(this.notificationsKey, JSON.stringify(notifs));
    return true;
  }

  public markAllNotificationsAsRead(userId: string): boolean {
    const notifs = this.getNotifications();
    let updated = false;
    const nowStr = new Date().toISOString();

    notifs.forEach(n => {
      if ((n.recipient_user_id === userId || n.user_id === userId) && !n.is_read) {
        n.is_read = true;
        n.read_at = nowStr;
        updated = true;
      }
    });

    if (updated) {
      storageSet(this.notificationsKey, JSON.stringify(notifs));
    }
    return updated;
  }

  // --- Step 4: Order Management Service Methods ---

  public generateOrderNumber(): string {
    const orders = this.getOrdersRaw();
    let maxNum = 0;

    orders.forEach(o => {
      if (o.order_number && o.order_number.startsWith('ORD-')) {
        const numPart = parseInt(o.order_number.replace('ORD-', ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = maxNum + 1;
    return `ORD-${nextNum.toString().padStart(6, '0')}`;
  }

  private getOrdersRaw(): Order[] {
    try {
      const data = storageGet(this.ordersKey);
      return data ? JSON.parse(data) : SEED_ORDERS;
    } catch {
      return SEED_ORDERS;
    }
  }

  public calculateOrderTotals(items: OrderItemInput[]): {
    calculatedItems: (OrderItemInput & { line_total: number })[];
    subtotal: number;
    total_discount: number;
    total_tax: number;
    grand_total: number;
  } {
    let subtotal = 0;
    let total_discount = 0;
    let total_tax = 0;

    const calculatedItems = items.map(item => {
      const qty = item.quantity > 0 ? item.quantity : 1;
      const price = item.unit_price >= 0 ? item.unit_price : 0;
      const discount = item.discount && item.discount >= 0 ? item.discount : 0;
      const tax = item.tax && item.tax >= 0 ? item.tax : 0;

      const itemSubtotal = qty * price;
      const line_total = Math.max(0, itemSubtotal - discount + tax);

      subtotal += itemSubtotal;
      total_discount += discount;
      total_tax += tax;

      return {
        ...item,
        quantity: qty,
        unit_price: price,
        discount,
        tax,
        line_total: Number(line_total.toFixed(2)),
      };
    });

    const grand_total = Math.max(0, subtotal - total_discount + total_tax);

    return {
      calculatedItems,
      subtotal: Number(subtotal.toFixed(2)),
      total_discount: Number(total_discount.toFixed(2)),
      total_tax: Number(total_tax.toFixed(2)),
      grand_total: Number(grand_total.toFixed(2)),
    };
  }

  public getOrders(
    filters: {
      searchTerm?: string;
      status?: string;
      sales_agent_id?: string;
      customer_id?: string;
      team_id?: string;
      product_id?: string;
      startDate?: string;
      endDate?: string;
      myOrdersOnly?: boolean;
      teamOrdersOnly?: boolean;
    } = {},
    currentUserId?: string
  ): Order[] {
    let orders = this.getOrdersRaw();
    const customers = this.getCustomers();
    const users = this.getUsers();
    const teams = this.getTeams();
    const allItems = this.getAllOrderItemsRaw();
    const allHistory = this.getAllOrderHistoryRaw();
    const allDocs = this.getAllOrderDocsRaw();

    orders = orders.map(o => {
      const agent = o.sales_agent_id ? users.find(u => u.id === o.sales_agent_id) || null : null;
      const teamId = o.team_id || (agent ? agent.team_id : null);
      const team = teamId ? teams.find(t => t.id === teamId) || null : null;

      return {
        ...o,
        customer: customers.find(c => c.id === o.customer_id) || null,
        sales_agent_profile: agent,
        team_id: teamId || null,
        team: team,
        currency: o.currency || '$',
        created_by_profile: o.created_by ? users.find(u => u.id === o.created_by) || null : null,
        updated_by_profile: o.updated_by ? users.find(u => u.id === o.updated_by) || null : null,
        cancelled_by_profile: o.cancelled_by ? users.find(u => u.id === o.cancelled_by) || null : null,
        items: allItems.filter(i => i.order_id === o.id),
        history: allHistory.filter(h => h.order_id === o.id).map(h => ({
          ...h,
          performed_by_profile: h.performed_by ? users.find(u => u.id === h.performed_by) || null : null,
        })),
        documents: allDocs.filter(d => d.order_id === o.id).map(d => ({
          ...d,
          uploaded_by_profile: d.uploaded_by ? users.find(u => u.id === d.uploaded_by) || null : null,
        })),
      };
    });

    if (filters.myOrdersOnly && currentUserId) {
      orders = orders.filter(o => o.sales_agent_id === currentUserId);
    }
    if (filters.teamOrdersOnly && currentUserId) {
      const currentUser = users.find(u => u.id === currentUserId);
      if (currentUser && currentUser.team_id) {
        orders = orders.filter(o => o.team_id === currentUser.team_id || (o.sales_agent_profile && o.sales_agent_profile.team_id === currentUser.team_id));
      }
    }
    if (filters.status && filters.status !== 'all') {
      orders = orders.filter(o => o.current_status === filters.status);
    }
    if (filters.sales_agent_id && filters.sales_agent_id !== 'all') {
      orders = orders.filter(o => o.sales_agent_id === filters.sales_agent_id);
    }
    if (filters.customer_id) {
      orders = orders.filter(o => o.customer_id === filters.customer_id);
    }
    if (filters.team_id && filters.team_id !== 'all') {
      orders = orders.filter(o => o.team_id === filters.team_id);
    }
    if (filters.product_id) {
      orders = orders.filter(o => o.items && o.items.some(i => i.product_id === filters.product_id));
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      orders = orders.filter(o => new Date(o.order_date).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime() + 86400000;
      orders = orders.filter(o => new Date(o.order_date).getTime() <= end);
    }
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const qStr = filters.searchTerm.toLowerCase().trim();
      orders = orders.filter(o =>
        o.order_number.toLowerCase().includes(qStr) ||
        (o.customer_reference && o.customer_reference.toLowerCase().includes(qStr)) ||
        (o.customer && o.customer.company_name.toLowerCase().includes(qStr)) ||
        (o.customer && o.customer.customer_code.toLowerCase().includes(qStr)) ||
        (o.sales_agent_profile && o.sales_agent_profile.full_name.toLowerCase().includes(qStr)) ||
        (o.items && o.items.some(i => i.product_name_snapshot.toLowerCase().includes(qStr) || i.sku_snapshot.toLowerCase().includes(qStr)))
      );
    }

    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOrderById(id: string): Order | null {
    const orders = this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  private getAllOrderItemsRaw(): OrderItem[] {
    try {
      const data = storageGet(this.orderItemsKey);
      return data ? JSON.parse(data) : SEED_ORDER_ITEMS;
    } catch {
      return SEED_ORDER_ITEMS;
    }
  }

  private getAllOrderHistoryRaw(): OrderStatusHistory[] {
    try {
      const data = storageGet(this.orderHistoryKey);
      return data ? JSON.parse(data) : SEED_ORDER_HISTORY;
    } catch {
      return SEED_ORDER_HISTORY;
    }
  }

  private getAllOrderDocsRaw(): OrderDocument[] {
    try {
      const data = storageGet(this.orderDocsKey);
      return data ? JSON.parse(data) : SEED_ORDER_DOCUMENTS;
    } catch {
      return SEED_ORDER_DOCUMENTS;
    }
  }

  public createOrder(input: OrderFormInput, userId: string): Order {
    const orders = this.getOrdersRaw();
    const orderNumber = this.generateOrderNumber();
    const totals = this.calculateOrderTotals(input.items);

    const nowStr = new Date().toISOString();
    const sysSettings = this.getSystemSettings();

    const newOrder: Order = {
      id: crypto.randomUUID(),
      order_number: orderNumber,
      customer_id: input.customer_id,
      customer_reference: input.customer_reference?.trim() || null,
      sales_agent_id: input.sales_agent_id || userId,
      team_id: input.team_id || null,
      order_date: input.order_date || nowStr,
      expected_delivery_date: input.expected_delivery_date || null,
      current_status: 'order_received',
      subtotal: totals.subtotal,
      total_discount: totals.total_discount,
      total_tax: totals.total_tax,
      grand_total: totals.grand_total,
      currency: sysSettings.currency_symbol || '$',
      notes: input.notes?.trim() || null,
      created_by: userId,
      created_at: nowStr,
      updated_by: userId,
      updated_at: nowStr,
      order_received_at: nowStr,
      sales_order_done_at: null,
      invoiced_at: null,
      dispatched_at: null,
      signed_invoice_sent_at: null,
      completed_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      cancelled_by: null,
    };

    storageSet(this.ordersKey, JSON.stringify([newOrder, ...orders]));

    // Store Order Items
    const currentItems = this.getAllOrderItemsRaw();
    const newItems: OrderItem[] = totals.calculatedItems.map(item => ({
      id: crypto.randomUUID(),
      order_id: newOrder.id,
      product_id: item.product_id || null,
      product_name_snapshot: item.product_name_snapshot.trim(),
      sku_snapshot: item.sku_snapshot.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
      tax: item.tax ?? 0,
      line_total: item.line_total,
      notes: item.notes?.trim() || null,
      created_at: nowStr,
      updated_at: nowStr,
    }));

    storageSet(this.orderItemsKey, JSON.stringify([...currentItems, ...newItems]));

    // Log History Event
    this.logOrderStatusHistory({
      order_id: newOrder.id,
      previous_status: null,
      new_status: 'order_received',
      action: `Order Received`,
      notes: `Order ${orderNumber} created with ${newItems.length} line items.`,
      performed_by: userId,
    });

    this.logAudit({
      user_id: userId,
      action: 'order_created',
      entity_type: 'order',
      entity_id: newOrder.id,
      entity_number: newOrder.order_number,
      summary: `Created order ${newOrder.order_number} for customer`,
      previous_value: null,
      new_value: `Total: $${totals.grand_total}`,
    });

    const cust = this.getCustomerById(input.customer_id);
    const custName = cust ? cust.company_name : 'Customer';

    notificationService.notifyNewOrderCreated({
      orderNumber: newOrder.order_number,
      orderId: newOrder.id,
      customerName: custName,
      grandTotal: totals.grand_total,
      salesAgentId: input.sales_agent_id,
      actorUserId: userId,
    });

    if (input.sales_agent_id) {
      notificationService.notifyOrderAssigned({
        orderNumber: newOrder.order_number,
        orderId: newOrder.id,
        customerName: custName,
        assignedSalesAgentId: input.sales_agent_id,
        actorUserId: userId,
      });
    }

    return this.getOrderById(newOrder.id)!;
  }

  public updateOrder(id: string, input: OrderFormInput & { is_admin_override?: boolean }, userId: string): Order | null {
    const orders = this.getOrdersRaw();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const existing = orders[index];
    const user = this.getUserById(userId);
    const isAdmin = user?.role === 'admin';

    // Restrict editing post-dispatch unless admin override
    if (['dispatched', 'signed_invoice_sent', 'completed', 'cancelled'].includes(existing.current_status) && !input.is_admin_override && !isAdmin) {
      throw new Error(`Order editing is restricted once dispatched or completed. Admin override required to modify line items or pricing.`);
    }

    const totals = this.calculateOrderTotals(input.items);
    const nowStr = new Date().toISOString();

    const updated: Order = {
      ...existing,
      customer_id: input.customer_id,
      customer_reference: input.customer_reference !== undefined ? input.customer_reference.trim() : existing.customer_reference,
      sales_agent_id: input.sales_agent_id !== undefined ? input.sales_agent_id : existing.sales_agent_id,
      team_id: input.team_id !== undefined ? input.team_id : existing.team_id,
      order_date: input.order_date || existing.order_date,
      expected_delivery_date: input.expected_delivery_date || existing.expected_delivery_date,
      subtotal: totals.subtotal,
      total_discount: totals.total_discount,
      total_tax: totals.total_tax,
      grand_total: totals.grand_total,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      updated_at: nowStr,
      updated_by: userId,
    };

    orders[index] = updated;
    storageSet(this.ordersKey, JSON.stringify(orders));

    // Update Items
    const allItems = this.getAllOrderItemsRaw().filter(i => i.order_id !== id);
    const updatedItems: OrderItem[] = totals.calculatedItems.map(item => ({
      id: crypto.randomUUID(),
      order_id: id,
      product_id: item.product_id || null,
      product_name_snapshot: item.product_name_snapshot.trim(),
      sku_snapshot: item.sku_snapshot.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
      tax: item.tax ?? 0,
      line_total: item.line_total,
      notes: item.notes?.trim() || null,
      created_at: nowStr,
      updated_at: nowStr,
    }));

    storageSet(this.orderItemsKey, JSON.stringify([...allItems, ...updatedItems]));

    this.logOrderStatusHistory({
      order_id: id,
      previous_status: existing.current_status,
      new_status: existing.current_status,
      action: input.is_admin_override ? 'Order Modified (Admin Override)' : 'Order Modified',
      notes: `Updated line items and financial totals. Grand Total: $${totals.grand_total.toFixed(2)}`,
      performed_by: userId,
    });

    return this.getOrderById(id);
  }

  public advanceOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    currentUserId: string,
    extraData?: { notes?: string; cancellation_reason?: string; is_admin_override?: boolean }
  ): Order | null {
    const orders = this.getOrdersRaw();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const existing = orders[index];
    const previousStatus = existing.current_status;
    const nowStr = new Date().toISOString();
    const existingDocs = this.getOrderDocuments(orderId);

    const sequentialMap: Record<OrderStatus, OrderStatus | null> = {
      order_received: 'sales_order_done',
      sales_order_done: 'invoiced',
      invoiced: 'dispatched',
      dispatched: 'signed_invoice_sent',
      signed_invoice_sent: 'completed',
      completed: null,
      cancelled: null,
    };

    if (targetStatus !== 'cancelled' && !extraData?.is_admin_override) {
      const expectedNext = sequentialMap[previousStatus];
      if (expectedNext !== targetStatus) {
        throw new Error(
          `Invalid workflow progression. Order must transition sequentially from ${previousStatus.replace(/_/g, ' ').toUpperCase()} to ${expectedNext?.replace(/_/g, ' ').toUpperCase()}. Admin override required to bypass stages.`
        );
      }

      // Mandatory Document Checks
      if (targetStatus === 'invoiced') {
        const hasInvoiceDoc = existingDocs.some(d => d.document_type === 'invoice' || d.document_type === 'sales_order');
        if (!hasInvoiceDoc) {
          throw new Error(`Advancing to INVOICED status requires an invoice or sales order document reference. Please upload an invoice document or use Admin Override.`);
        }
      }

      if (targetStatus === 'signed_invoice_sent') {
        const hasSignedDoc = existingDocs.some(d => d.document_type === 'signed_invoice');
        if (!hasSignedDoc) {
          throw new Error(`Advancing to SIGNED INVOICE SENT status requires a signed invoice document reference. Please upload the signed invoice document or use Admin Override.`);
        }
      }
    }

    if (targetStatus === 'cancelled' && (!extraData?.cancellation_reason || !extraData.cancellation_reason.trim())) {
      throw new Error('A cancellation reason is required to cancel an order.');
    }

    const updated: Order = {
      ...existing,
      current_status: targetStatus,
      updated_at: nowStr,
      updated_by: currentUserId,
    };

    if (targetStatus === 'sales_order_done' && !updated.sales_order_done_at) updated.sales_order_done_at = nowStr;
    if (targetStatus === 'invoiced' && !updated.invoiced_at) updated.invoiced_at = nowStr;
    if (targetStatus === 'dispatched' && !updated.dispatched_at) updated.dispatched_at = nowStr;
    if (targetStatus === 'signed_invoice_sent' && !updated.signed_invoice_sent_at) updated.signed_invoice_sent_at = nowStr;
    if (targetStatus === 'completed' && !updated.completed_at) updated.completed_at = nowStr;

    if (targetStatus === 'cancelled') {
      updated.cancelled_at = nowStr;
      updated.cancelled_by = currentUserId;
      updated.cancellation_reason = extraData!.cancellation_reason!.trim();
    }

    orders[index] = updated;
    storageSet(this.ordersKey, JSON.stringify(orders));

    let actionLabel = `Status Advanced: ${targetStatus.replace(/_/g, ' ').toUpperCase()}`;
    if (extraData?.is_admin_override) {
      actionLabel = `Admin Override Status: ${targetStatus.replace(/_/g, ' ').toUpperCase()}`;
    } else if (targetStatus === 'cancelled') {
      actionLabel = `Order Cancelled`;
    }

    this.logOrderStatusHistory({
      order_id: orderId,
      previous_status: previousStatus,
      new_status: targetStatus,
      action: actionLabel,
      notes: extraData?.cancellation_reason || extraData?.notes || undefined,
      performed_by: currentUserId,
    });

    this.logAudit({
      user_id: currentUserId,
      action: 'order_status_changed',
      entity_type: 'order',
      entity_id: orderId,
      entity_number: existing.order_number,
      summary: `Order ${existing.order_number} status changed to ${targetStatus}`,
      previous_value: previousStatus,
      new_value: targetStatus,
    });

    const cust = existing.customer || (existing.customer_id ? this.getCustomerById(existing.customer_id) : null);
    notificationService.notifyOrderStatusChanged({
      orderNumber: existing.order_number,
      orderId: orderId,
      customerName: cust ? cust.company_name : 'Customer',
      previousStatus: previousStatus,
      newStatus: targetStatus,
      assignedSalesAgentId: existing.sales_agent_id || undefined,
      actorUserId: currentUserId,
      cancellationReason: extraData?.cancellation_reason,
    });

    return this.getOrderById(orderId);
  }

  public logOrderStatusHistory(event: {
    order_id: string;
    previous_status: OrderStatus | null;
    new_status: OrderStatus;
    action: string;
    notes?: string;
    performed_by: string;
  }): OrderStatusHistory {
    const data = storageGet(this.orderHistoryKey);
    const list: OrderStatusHistory[] = data ? JSON.parse(data) : SEED_ORDER_HISTORY;

    const newEvt: OrderStatusHistory = {
      id: crypto.randomUUID(),
      order_id: event.order_id,
      previous_status: event.previous_status,
      new_status: event.new_status,
      action: event.action,
      notes: event.notes || null,
      performed_by: event.performed_by,
      created_at: new Date().toISOString(),
    };

    storageSet(this.orderHistoryKey, JSON.stringify([...list, newEvt]));
    return newEvt;
  }

  // --- Order Documents Methods ---

  public getOrderDocuments(orderId: string): OrderDocument[] {
    try {
      const data = storageGet(this.orderDocsKey);
      let docs: OrderDocument[] = data ? JSON.parse(data) : SEED_ORDER_DOCUMENTS;
      const users = this.getUsers();

      return docs
        .filter(d => d.order_id === orderId)
        .map(d => ({
          ...d,
          uploaded_by_profile: d.uploaded_by ? users.find(u => u.id === d.uploaded_by) || null : null,
        }))
        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
    } catch {
      return SEED_ORDER_DOCUMENTS;
    }
  }

  public addOrderDocument(
    orderId: string,
    documentType: OrderDocumentType,
    fileName: string,
    filePath: string,
    currentUserId: string
  ): OrderDocument {
    const data = storageGet(this.orderDocsKey);
    const docs: OrderDocument[] = data ? JSON.parse(data) : SEED_ORDER_DOCUMENTS;

    const newDoc: OrderDocument = {
      id: crypto.randomUUID(),
      order_id: orderId,
      document_type: documentType,
      file_name: fileName.trim(),
      file_path: filePath.trim(),
      uploaded_by: currentUserId,
      uploaded_at: new Date().toISOString(),
    };

    storageSet(this.orderDocsKey, JSON.stringify([...docs, newDoc]));

    const uploader = this.getUserById(currentUserId);
    this.logOrderStatusHistory({
      order_id: orderId,
      previous_status: null,
      new_status: 'order_received',
      action: `Document Uploaded: ${documentType.replace('_', ' ').toUpperCase()}`,
      notes: `File: ${fileName}`,
      performed_by: currentUserId,
    });

    return {
      ...newDoc,
      uploaded_by_profile: uploader,
    };
  }

  // --- Step 5: Product Catalog & Availability Service Methods ---

  public getProductCategories(): ProductCategory[] {
    try {
      const data = storageGet(this.productCategoriesKey);
      return data ? JSON.parse(data) : SEED_PRODUCT_CATEGORIES;
    } catch {
      return SEED_PRODUCT_CATEGORIES;
    }
  }

  public getProductBrands(): ProductBrand[] {
    try {
      const data = storageGet(this.productBrandsKey);
      return data ? JSON.parse(data) : SEED_PRODUCT_BRANDS;
    } catch {
      return SEED_PRODUCT_BRANDS;
    }
  }

  private getProductsRaw(): Product[] {
    try {
      const data = storageGet(this.productsKey);
      return data ? JSON.parse(data) : SEED_PRODUCTS;
    } catch {
      return SEED_PRODUCTS;
    }
  }

  public getProducts(filters: {
    searchTerm?: string;
    availability_status?: string;
    category_id?: string;
    brand_id?: string;
    activeOnly?: boolean;
  } = {}): Product[] {
    let products = this.getProductsRaw();
    const categories = this.getProductCategories();
    const brands = this.getProductBrands();
    const users = this.getUsers();

    products = products.map(p => ({
      ...p,
      category: p.category_id ? categories.find(c => c.id === p.category_id) || null : null,
      brand: p.brand_id ? brands.find(b => b.id === p.brand_id) || null : null,
      created_by_profile: p.created_by ? users.find(u => u.id === p.created_by) || null : null,
      updated_by_profile: p.updated_by ? users.find(u => u.id === p.updated_by) || null : null,
    }));

    if (filters.activeOnly) {
      products = products.filter(p => p.is_active);
    }
    if (filters.availability_status && filters.availability_status !== 'all') {
      products = products.filter(p => p.availability_status === filters.availability_status);
    }
    if (filters.category_id && filters.category_id !== 'all') {
      products = products.filter(p => p.category_id === filters.category_id);
    }
    if (filters.brand_id && filters.brand_id !== 'all') {
      products = products.filter(p => p.brand_id === filters.brand_id);
    }
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const qStr = filters.searchTerm.toLowerCase().trim();
      products = products.filter(p =>
        p.sku.toLowerCase().includes(qStr) ||
        p.product_name.toLowerCase().includes(qStr) ||
        (p.category && p.category.name.toLowerCase().includes(qStr)) ||
        (p.brand && p.brand.name.toLowerCase().includes(qStr)) ||
        (p.description && p.description.toLowerCase().includes(qStr))
      );
    }

    return products.sort((a, b) => a.product_name.localeCompare(b.product_name));
  }

  public getProductById(id: string): Product | null {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  public getProductBySku(sku: string): Product | null {
    const products = this.getProducts();
    return products.find(p => p.sku.toLowerCase() === sku.toLowerCase().trim()) || null;
  }

  public createProduct(input: ProductFormInput, userId: string): Product {
    const products = this.getProductsRaw();
    
    // Validate unique SKU
    if (products.some(p => p.sku.toLowerCase() === input.sku.toLowerCase().trim())) {
      throw new Error(`Product SKU "${input.sku}" already exists. SKUs must be unique.`);
    }

    const nowStr = new Date().toISOString();

    const newProduct: Product = {
      id: crypto.randomUUID(),
      sku: input.sku.trim().toUpperCase(),
      product_name: input.product_name.trim(),
      description: input.description?.trim() || null,
      category_id: input.category_id || null,
      brand_id: input.brand_id || null,
      unit_price: input.unit_price >= 0 ? input.unit_price : 0,
      availability_status: input.availability_status || 'available',
      availability_notes: input.availability_notes?.trim() || null,
      expected_available_date: input.expected_available_date || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      created_by: userId,
      created_at: nowStr,
      updated_by: userId,
      updated_at: nowStr,
    };

    storageSet(this.productsKey, JSON.stringify([newProduct, ...products]));

    // Log initial history if created as Out of Stock
    if (newProduct.availability_status !== 'available') {
      this.logProductAvailabilityHistory({
        product_id: newProduct.id,
        previous_status: null,
        new_status: newProduct.availability_status,
        reason: newProduct.availability_notes || 'Initial product setup.',
        expected_available_date: newProduct.expected_available_date,
        changed_by: userId,
      });
    }

    return this.getProductById(newProduct.id)!;
  }

  public updateProduct(id: string, input: ProductFormInput, userId: string): Product | null {
    const products = this.getProductsRaw();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = products[index];

    // Validate SKU uniqueness if SKU changed
    if (input.sku && input.sku.toLowerCase().trim() !== existing.sku.toLowerCase()) {
      if (products.some(p => p.id !== id && p.sku.toLowerCase() === input.sku.toLowerCase().trim())) {
        throw new Error(`Product SKU "${input.sku}" already exists. SKUs must be unique.`);
      }
    }

    const nowStr = new Date().toISOString();

    const updated: Product = {
      ...existing,
      sku: input.sku ? input.sku.trim().toUpperCase() : existing.sku,
      product_name: input.product_name ? input.product_name.trim() : existing.product_name,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      category_id: input.category_id !== undefined ? input.category_id : existing.category_id,
      brand_id: input.brand_id !== undefined ? input.brand_id : existing.brand_id,
      unit_price: input.unit_price !== undefined ? Math.max(0, input.unit_price) : existing.unit_price,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
      updated_at: nowStr,
      updated_by: userId,
    };

    products[index] = updated;
    storageSet(this.productsKey, JSON.stringify(products));

    return this.getProductById(id);
  }

  public changeProductAvailability(
    productId: string,
    targetStatus: ProductAvailabilityStatus,
    reason: string,
    expectedDate: string | null,
    userId: string
  ): Product | null {
    const products = this.getProductsRaw();
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return null;

    const existing = products[index];
    const previousStatus = existing.availability_status;

    if (targetStatus === 'out_of_stock' && (!reason || !reason.trim())) {
      throw new Error('A reason or availability note is required when marking a product Out of Stock.');
    }

    const nowStr = new Date().toISOString();

    const updated: Product = {
      ...existing,
      availability_status: targetStatus,
      availability_notes: reason.trim() || null,
      expected_available_date: targetStatus === 'available' ? null : expectedDate || null,
      updated_at: nowStr,
      updated_by: userId,
    };

    products[index] = updated;
    storageSet(this.productsKey, JSON.stringify(products));

    // Log Availability History
    this.logProductAvailabilityHistory({
      product_id: productId,
      previous_status: previousStatus,
      new_status: targetStatus,
      reason: reason.trim() || null,
      expected_available_date: expectedDate || null,
      changed_by: userId,
    });

    // Trigger System Notifications via notificationService
    notificationService.notifyProductAvailabilityChanged({
      sku: existing.sku,
      productName: existing.product_name,
      productId: productId,
      newStatus: targetStatus,
      reason: reason.trim(),
      expectedDate: expectedDate,
      actorUserId: userId,
    });

    return this.getProductById(productId);
  }

  public getProductAvailabilityHistory(productId: string): ProductAvailabilityHistory[] {
    try {
      const data = storageGet(this.productHistoryKey);
      let list: ProductAvailabilityHistory[] = data ? JSON.parse(data) : SEED_PRODUCT_HISTORY;
      const users = this.getUsers();

      return list
        .filter(h => h.product_id === productId)
        .map(h => ({
          ...h,
          changed_by_profile: h.changed_by ? users.find(u => u.id === h.changed_by) || null : null,
        }))
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    } catch {
      return SEED_PRODUCT_HISTORY;
    }
  }

  public logProductAvailabilityHistory(event: {
    product_id: string;
    previous_status: ProductAvailabilityStatus | null;
    new_status: ProductAvailabilityStatus;
    reason: string | null;
    expected_available_date: string | null;
    changed_by: string;
  }): ProductAvailabilityHistory {
    const data = storageGet(this.productHistoryKey);
    const list: ProductAvailabilityHistory[] = data ? JSON.parse(data) : SEED_PRODUCT_HISTORY;

    const newEvt: ProductAvailabilityHistory = {
      id: crypto.randomUUID(),
      product_id: event.product_id,
      previous_status: event.previous_status,
      new_status: event.new_status,
      reason: event.reason || null,
      expected_available_date: event.expected_available_date || null,
      changed_by: event.changed_by,
      changed_at: new Date().toISOString(),
    };

    storageSet(this.productHistoryKey, JSON.stringify([...list, newEvt]));
    return newEvt;
  }

  public getOutOfStockProducts(): Product[] {
    return this.getProducts({ availability_status: 'out_of_stock' });
  }

  // --- Step 7: Shift & Handover Service Methods ---

  public getShifts(): Shift[] {
    try {
      const data = storageGet(this.shiftsKey);
      const list: Shift[] = data ? JSON.parse(data) : SEED_SHIFTS;
      const teams = this.getTeams();
      return list.map(s => ({
        ...s,
        team: teams.find(t => t.id === s.team_id) || null,
      }));
    } catch {
      return SEED_SHIFTS;
    }
  }

  public getCurrentShiftForTeam(teamId: string): Shift {
    const shifts = this.getShifts();
    let current = shifts.find(s => s.team_id === teamId && s.status === 'active');
    
    if (!current) {
      const team = this.getTeams().find(t => t.id === teamId);
      const nowStr = new Date().toISOString();
      current = {
        id: crypto.randomUUID(),
        team_id: teamId,
        team: team || null,
        shift_date: nowStr.split('T')[0],
        start_time: team?.shift_start || '15:00',
        end_time: team?.shift_end || '11:00',
        status: 'active',
        opened_at: nowStr,
        created_at: nowStr,
        updated_at: nowStr,
      };
      storageSet(this.shiftsKey, JSON.stringify([current, ...shifts]));
    }
    return current;
  }

  public getHandovers(filters: {
    status?: string;
    teamId?: string;
    searchTerm?: string;
  } = {}): ShiftHandover[] {
    try {
      const data = storageGet(this.handoversKey);
      let list: ShiftHandover[] = data ? JSON.parse(data) : SEED_HANDOVERS;
      const teams = this.getTeams();
      const users = this.getUsers();

      list = list.map(h => ({
        ...h,
        outgoing_team: teams.find(t => t.id === h.outgoing_team_id) || null,
        incoming_team: teams.find(t => t.id === h.incoming_team_id) || null,
        created_by_profile: h.created_by ? users.find(u => u.id === h.created_by) || null : null,
        submitted_by_profile: h.submitted_by ? users.find(u => u.id === h.submitted_by) || null : null,
        acknowledged_by_profile: h.acknowledged_by ? users.find(u => u.id === h.acknowledged_by) || null : null,
        items: this.getHandoverItems(h.id),
      }));

      if (filters.status && filters.status !== 'all') {
        list = list.filter(h => h.status === filters.status);
      }
      if (filters.teamId && filters.teamId !== 'all') {
        list = list.filter(h => h.outgoing_team_id === filters.teamId || h.incoming_team_id === filters.teamId);
      }
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const q = filters.searchTerm.toLowerCase().trim();
        list = list.filter(h =>
          h.summary.toLowerCase().includes(q) ||
          (h.important_notes && h.important_notes.toLowerCase().includes(q)) ||
          (h.outgoing_team && h.outgoing_team.name.toLowerCase().includes(q)) ||
          (h.incoming_team && h.incoming_team.name.toLowerCase().includes(q))
        );
      }

      return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return SEED_HANDOVERS;
    }
  }

  public getHandoverById(id: string): ShiftHandover | null {
    const handovers = this.getHandovers();
    return handovers.find(h => h.id === id) || null;
  }

  public getHandoverItems(handoverId: string): ShiftHandoverItem[] {
    try {
      const data = storageGet(this.handoverItemsKey);
      const list: ShiftHandoverItem[] = data ? JSON.parse(data) : SEED_HANDOVER_ITEMS;
      const users = this.getUsers();

      return list
        .filter(i => i.handover_id === handoverId)
        .map(item => {
          let query_snapshot: CustomerQuery | null = null;
          let order_snapshot: Order | null = null;
          let product_snapshot: Product | null = null;

          if (item.entity_type === 'query' && item.entity_id) {
            query_snapshot = this.getQueryById(item.entity_id);
          } else if (item.entity_type === 'order' && item.entity_id) {
            order_snapshot = this.getOrderById(item.entity_id);
          } else if (item.entity_type === 'product' && item.entity_id) {
            product_snapshot = this.getProductById(item.entity_id);
          }

          return {
            ...item,
            completed_by_profile: item.completed_by ? users.find(u => u.id === item.completed_by) || null : null,
            query_snapshot,
            order_snapshot,
            product_snapshot,
          };
        });
    } catch {
      return [];
    }
  }

  public createHandover(input: HandoverFormInput, userId: string): ShiftHandover {
    const user = this.getUserById(userId);
    const outgoingTeamId = user?.team_id || '11111111-1111-1111-1111-111111111111';
    const activeShift = this.getCurrentShiftForTeam(outgoingTeamId);

    const nowStr = new Date().toISOString();
    const handoverId = crypto.randomUUID();

    const newHandover: ShiftHandover = {
      id: handoverId,
      shift_id: activeShift.id,
      outgoing_team_id: outgoingTeamId,
      incoming_team_id: input.incoming_team_id,
      summary: input.summary.trim(),
      important_notes: input.important_notes?.trim() || null,
      status: 'submitted',
      created_by: userId,
      created_at: nowStr,
      submitted_by: userId,
      submitted_at: nowStr,
      acknowledged_by: null,
      acknowledged_at: null,
    };

    // Store Handover Items
    const rawItems = storageGet(this.handoverItemsKey);
    const allItems: ShiftHandoverItem[] = rawItems ? JSON.parse(rawItems) : SEED_HANDOVER_ITEMS;

    const newItems: ShiftHandoverItem[] = input.items.map(item => ({
      id: crypto.randomUUID(),
      handover_id: handoverId,
      entity_type: item.entity_type,
      entity_id: item.entity_id || null,
      priority: item.priority || 'medium',
      note: item.note.trim(),
      action_required: item.action_required?.trim() || null,
      is_completed: false,
      completed_at: null,
      completed_by: null,
      completion_note: null,
      created_by: userId,
      created_at: nowStr,
    }));

    const rawHandovers = storageGet(this.handoversKey);
    const allHandovers: ShiftHandover[] = rawHandovers ? JSON.parse(rawHandovers) : SEED_HANDOVERS;

    storageSet(this.handoversKey, JSON.stringify([newHandover, ...allHandovers]));
    storageSet(this.handoverItemsKey, JSON.stringify([...allItems, ...newItems]));

    // Trigger Notification to incoming team
    const outgoingTeam = this.getTeams().find(t => t.id === outgoingTeamId);
    notificationService.notifyHandoverSubmitted({
      handoverId: newHandover.id,
      outgoingTeamName: outgoingTeam?.name || 'Outgoing Team',
      incomingTeamId: input.incoming_team_id,
      itemCount: newItems.length,
      actorUserId: userId,
    });

    return this.getHandoverById(newHandover.id)!;
  }

  public acknowledgeHandover(handoverId: string, userId: string): ShiftHandover | null {
    const rawHandovers = storageGet(this.handoversKey);
    const allHandovers: ShiftHandover[] = rawHandovers ? JSON.parse(rawHandovers) : SEED_HANDOVERS;

    const index = allHandovers.findIndex(h => h.id === handoverId);
    if (index === -1) return null;

    const existing = allHandovers[index];
    const user = this.getUserById(userId);
    const nowStr = new Date().toISOString();

    const updated: ShiftHandover = {
      ...existing,
      status: 'acknowledged',
      acknowledged_by: userId,
      acknowledged_at: nowStr,
    };

    allHandovers[index] = updated;
    storageSet(this.handoversKey, JSON.stringify(allHandovers));

    // Trigger Notification to outgoing team
    const incomingTeam = this.getTeams().find(t => t.id === existing.incoming_team_id);
    notificationService.notifyHandoverAcknowledged({
      handoverId: handoverId,
      incomingTeamName: incomingTeam?.name || 'Incoming Team',
      outgoingTeamId: existing.outgoing_team_id,
      acknowledgedByName: user?.full_name || 'Agent',
      actorUserId: userId,
    });

    return this.getHandoverById(handoverId);
  }

  public completeHandoverItem(itemId: string, userId: string, completionNote?: string): boolean {
    const rawItems = storageGet(this.handoverItemsKey);
    const allItems: ShiftHandoverItem[] = rawItems ? JSON.parse(rawItems) : SEED_HANDOVER_ITEMS;

    const index = allItems.findIndex(i => i.id === itemId);
    if (index === -1) return false;

    const nowStr = new Date().toISOString();
    allItems[index] = {
      ...allItems[index],
      is_completed: true,
      completed_at: nowStr,
      completed_by: userId,
      completion_note: completionNote?.trim() || 'Action completed by incoming agent.',
    };

    storageSet(this.handoverItemsKey, JSON.stringify(allItems));
    return true;
  }

  /**
   * Automatic pending work aggregator for handover form
   */
  public getPendingWorkForHandover(outgoingTeamId: string) {
    const allQueries = this.getQueries();
    const allOrders = this.getOrders();
    const outOfStockProducts = this.getOutOfStockProducts();

    // Filter relevant pending queries (open, in_progress, waiting_customer, reopened, or high/urgent)
    const pendingQueries = allQueries.filter(q =>
      ['open', 'in_progress', 'waiting_customer', 'reopened'].includes(q.status)
    );

    // Filter relevant pending orders (not completed and not cancelled)
    const pendingOrders = allOrders.filter(o =>
      !['completed', 'cancelled'].includes(o.current_status)
    );

    return {
      queries: pendingQueries,
      orders: pendingOrders,
      products: outOfStockProducts,
    };
  }

  // --- Step 9: Admin Panel Data Access Methods ---

  // --- User Management Methods ---

  public createUser(input: UserFormInput, currentUserId: string): UserProfile {
    const users = this.getUsers();
    
    // Auto-generate UUID and unique ID string
    const newUserId = crypto.randomUUID();
    const newUser: UserProfile = {
      id: newUserId,
      email: input.email.toLowerCase().trim(),
      full_name: input.full_name.trim(),
      role: input.role,
      team_id: input.team_id || null,
      is_active: input.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    storageSet(this.usersKey, JSON.stringify([...users, newUser]));

    this.logAudit({
      user_id: currentUserId,
      action: 'user_created',
      entity_type: 'user',
      entity_id: newUserId,
      entity_number: newUser.full_name,
      summary: `Created ${input.role.replace('_', ' ')} account for ${newUser.full_name} (${newUser.email})`,
      previous_value: null,
      new_value: `role: ${input.role}, active: ${input.is_active}`,
    });

    return newUser;
  }

  public updateUser(userId: string, input: Partial<UserFormInput>, currentUserId: string): UserProfile | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    const existing = users[index];
    const roleChanged = input.role && input.role !== existing.role;
    const teamChanged = input.team_id !== undefined && input.team_id !== existing.team_id;

    const updated: UserProfile = {
      ...existing,
      full_name: input.full_name !== undefined ? input.full_name.trim() : existing.full_name,
      email: input.email !== undefined ? input.email.toLowerCase().trim() : existing.email,
      role: input.role !== undefined ? input.role : existing.role,
      team_id: input.team_id !== undefined ? input.team_id : existing.team_id,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
    };

    users[index] = updated;
    storageSet(this.usersKey, JSON.stringify(users));

    if (roleChanged) {
      this.logAudit({
        user_id: currentUserId,
        action: 'role_changed',
        entity_type: 'user',
        entity_id: userId,
        entity_number: existing.full_name,
        summary: `Changed user role for ${existing.full_name} from ${existing.role} to ${input.role}`,
        previous_value: existing.role,
        new_value: input.role,
      });
    }

    if (teamChanged) {
      this.logAudit({
        user_id: currentUserId,
        action: 'team_changed',
        entity_type: 'user',
        entity_id: userId,
        entity_number: existing.full_name,
        summary: `Updated team assignment for ${existing.full_name}`,
        previous_value: existing.team_id || 'None',
        new_value: input.team_id || 'None',
      });
    }

    this.logAudit({
      user_id: currentUserId,
      action: 'user_updated',
      entity_type: 'user',
      entity_id: userId,
      entity_number: existing.full_name,
      summary: `Updated user profile details for ${existing.full_name}`,
      previous_value: null,
      new_value: null,
    });

    return updated;
  }

  public setUserActiveStatus(userId: string, isActive: boolean, currentUserId: string): UserProfile | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    const existing = users[index];
    const updated: UserProfile = {
      ...existing,
      is_active: isActive,
    };

    users[index] = updated;
    storageSet(this.usersKey, JSON.stringify(users));

    this.logAudit({
      user_id: currentUserId,
      action: isActive ? 'user_activated' : 'user_deactivated',
      entity_type: 'user',
      entity_id: userId,
      entity_number: existing.full_name,
      summary: `${isActive ? 'Activated' : 'Deactivated'} user account for ${existing.full_name}`,
      previous_value: existing.is_active ? 'active' : 'inactive',
      new_value: isActive ? 'active' : 'inactive',
    });

    return updated;
  }

  public getUserActiveWork(userId: string) {
    const queries = this.getQueries({ assigned_to: userId })
      .filter(q => q.status !== 'closed' && q.status !== 'resolved');
    const orders = this.getOrders({ sales_agent_id: userId })
      .filter(o => o.current_status !== 'completed' && o.current_status !== 'cancelled');

    return {
      openQueries: queries,
      pendingOrders: orders,
    };
  }

  // --- Team Management Methods ---

  public createTeam(input: TeamFormInput, currentUserId: string): Team {
    const teams = this.getTeams();
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      shift_info: input.shift_info.trim(),
      description: input.description?.trim() || '',
      is_active: input.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    storageSet(this.teamsKey, JSON.stringify([...teams, newTeam]));

    this.logAudit({
      user_id: currentUserId,
      action: 'team_created',
      entity_type: 'team',
      entity_id: newTeam.id,
      entity_number: newTeam.name,
      summary: `Created operational team ${newTeam.name} (${newTeam.shift_info})`,
      previous_value: null,
      new_value: newTeam.shift_info,
    });

    return newTeam;
  }

  public updateTeam(teamId: string, input: Partial<TeamFormInput>, currentUserId: string): Team | null {
    const teams = this.getTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) return null;

    const existing = teams[index];
    const updated: Team = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      shift_info: input.shift_info !== undefined ? input.shift_info.trim() : existing.shift_info,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
    };

    teams[index] = updated;
    storageSet(this.teamsKey, JSON.stringify(teams));

    this.logAudit({
      user_id: currentUserId,
      action: 'team_updated',
      entity_type: 'team',
      entity_id: teamId,
      entity_number: existing.name,
      summary: `Updated operational team ${existing.name}`,
      previous_value: existing.shift_info,
      new_value: updated.shift_info,
    });

    return updated;
  }

  // --- Taxonomy & Category Management Methods ---

  public addQueryCategory(input: CategoryFormInput, currentUserId: string): QueryCategory {
    const list = this.getCategories();
    const newCat: QueryCategory = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || '',
      is_active: input.is_active,
      created_at: new Date().toISOString(),
    };

    storageSet(this.categoriesKey, JSON.stringify([...list, newCat]));

    this.logAudit({
      user_id: currentUserId,
      action: 'query_category_created',
      entity_type: 'query_category',
      entity_id: newCat.id,
      entity_number: newCat.name,
      summary: `Added query category '${newCat.name}'`,
      previous_value: null,
      new_value: newCat.name,
    });

    return newCat;
  }

  public updateQueryCategory(categoryId: string, input: Partial<CategoryFormInput>, currentUserId: string): QueryCategory | null {
    const list = this.getCategories();
    const index = list.findIndex(c => c.id === categoryId);
    if (index === -1) return null;

    const existing = list[index];
    const updated: QueryCategory = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
    };

    list[index] = updated;
    storageSet(this.categoriesKey, JSON.stringify(list));

    this.logAudit({
      user_id: currentUserId,
      action: 'query_category_updated',
      entity_type: 'query_category',
      entity_id: categoryId,
      entity_number: existing.name,
      summary: `Updated query category '${existing.name}'`,
      previous_value: null,
      new_value: null,
    });

    return updated;
  }

  public addProductCategory(input: CategoryFormInput, currentUserId: string): ProductCategory {
    const list = this.getProductCategories();
    const newCat: ProductCategory = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || '',
      is_active: input.is_active,
      created_at: new Date().toISOString(),
    };

    storageSet(this.productCategoriesKey, JSON.stringify([...list, newCat]));

    this.logAudit({
      user_id: currentUserId,
      action: 'product_category_created',
      entity_type: 'product_category',
      entity_id: newCat.id,
      entity_number: newCat.name,
      summary: `Added product category '${newCat.name}'`,
      previous_value: null,
      new_value: newCat.name,
    });

    return newCat;
  }

  public updateProductCategory(categoryId: string, input: Partial<CategoryFormInput>, currentUserId: string): ProductCategory | null {
    const list = this.getProductCategories();
    const index = list.findIndex(c => c.id === categoryId);
    if (index === -1) return null;

    const existing = list[index];
    const updated: ProductCategory = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
    };

    list[index] = updated;
    storageSet(this.productCategoriesKey, JSON.stringify(list));

    this.logAudit({
      user_id: currentUserId,
      action: 'product_category_updated',
      entity_type: 'product_category',
      entity_id: categoryId,
      entity_number: existing.name,
      summary: `Updated product category '${existing.name}'`,
      previous_value: null,
      new_value: null,
    });

    return updated;
  }

  public addProductBrand(input: BrandFormInput, currentUserId: string): ProductBrand {
    const list = this.getProductBrands();
    const newBrand: ProductBrand = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || '',
      is_active: input.is_active,
      created_at: new Date().toISOString(),
    };

    storageSet(this.productBrandsKey, JSON.stringify([...list, newBrand]));

    this.logAudit({
      user_id: currentUserId,
      action: 'product_brand_created',
      entity_type: 'product_brand',
      entity_id: newBrand.id,
      entity_number: newBrand.name,
      summary: `Added product brand '${newBrand.name}'`,
      previous_value: null,
      new_value: newBrand.name,
    });

    return newBrand;
  }

  public updateProductBrand(brandId: string, input: Partial<BrandFormInput>, currentUserId: string): ProductBrand | null {
    const list = this.getProductBrands();
    const index = list.findIndex(b => b.id === brandId);
    if (index === -1) return null;

    const existing = list[index];
    const updated: ProductBrand = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
    };

    list[index] = updated;
    storageSet(this.productBrandsKey, JSON.stringify(list));

    this.logAudit({
      user_id: currentUserId,
      action: 'product_brand_updated',
      entity_type: 'product_brand',
      entity_id: brandId,
      entity_number: existing.name,
      summary: `Updated product brand '${existing.name}'`,
      previous_value: null,
      new_value: null,
    });

    return updated;
  }

  // --- System Settings Methods ---

  public getSystemSettings(): SystemSettings {
    try {
      const data = storageGet(this.systemSettingsKey);
      if (data) {
        const parsed: SystemSettings = JSON.parse(data);
        const users = this.getUsers();
        return {
          ...parsed,
          updated_by_profile: parsed.updated_by ? users.find(u => u.id === parsed.updated_by) || null : null,
        };
      }
    } catch {}

    return {
      id: '00000000-0000-0000-0000-0000000000a1',
      company_name: 'J&T Supplies',
      crm_title: 'J&T Supplies CRM',
      timezone: 'America/New_York',
      date_format: 'MMM D, YYYY h:mm A',
      currency_symbol: '$',
      pagination_limit: 10,
      updated_at: new Date().toISOString(),
    };
  }

  public updateSystemSettings(input: Partial<SystemSettings>, currentUserId: string): SystemSettings {
    const existing = this.getSystemSettings();
    const updated: SystemSettings = {
      ...existing,
      company_name: input.company_name !== undefined ? input.company_name.trim() : existing.company_name,
      crm_title: input.crm_title !== undefined ? input.crm_title.trim() : existing.crm_title,
      timezone: input.timezone !== undefined ? input.timezone.trim() : existing.timezone,
      date_format: input.date_format !== undefined ? input.date_format.trim() : existing.date_format,
      currency_symbol: input.currency_symbol !== undefined ? input.currency_symbol.trim() : existing.currency_symbol,
      pagination_limit: input.pagination_limit !== undefined ? Number(input.pagination_limit) : existing.pagination_limit,
      updated_at: new Date().toISOString(),
      updated_by: currentUserId,
    };

    storageSet(this.systemSettingsKey, JSON.stringify(updated));

    this.logAudit({
      user_id: currentUserId,
      action: 'settings_updated',
      entity_type: 'system_settings',
      entity_id: updated.id,
      entity_number: updated.crm_title,
      summary: 'Updated CRM System Configuration Settings',
      previous_value: null,
      new_value: `tz: ${updated.timezone}, currency: ${updated.currency_symbol}`,
    });

    return this.getSystemSettings();
  }

  // --- Immutable System Audit Logs Methods ---

  public getAuditLogs(filters: {
    user_id?: string;
    action?: string;
    entity_type?: string;
    searchTerm?: string;
  } = {}): AuditLog[] {
    try {
      const data = storageGet(this.auditLogsKey);
      let logs: AuditLog[] = data ? JSON.parse(data) : [];
      const users = this.getUsers();

      logs = logs.map(l => ({
        ...l,
        user_profile: l.user_id ? users.find(u => u.id === l.user_id) || null : null,
      }));

      if (filters.user_id && filters.user_id !== 'all') {
        logs = logs.filter(l => l.user_id === filters.user_id);
      }
      if (filters.action && filters.action !== 'all') {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.entity_type && filters.entity_type !== 'all') {
        logs = logs.filter(l => l.entity_type === filters.entity_type);
      }
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const q = filters.searchTerm.toLowerCase().trim();
        logs = logs.filter(l =>
          l.summary.toLowerCase().includes(q) ||
          (l.entity_number && l.entity_number.toLowerCase().includes(q)) ||
          (l.entity_id && l.entity_id.toLowerCase().includes(q)) ||
          (l.user_profile && l.user_profile.full_name.toLowerCase().includes(q))
        );
      }

      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    try {
      const data = storageGet(this.auditLogsKey);
      const logs: AuditLog[] = data ? JSON.parse(data) : [];

      const newLog: AuditLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...entry,
      };

      storageSet(this.auditLogsKey, JSON.stringify([newLog, ...logs]));
      return newLog;
    } catch {
      return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...entry,
      };
    }
  }

}

export const localDb = new LocalDatabaseService();

