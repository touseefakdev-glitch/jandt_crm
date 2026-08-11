// Supabase client + in-memory store + write-through helpers are provided by supabaseSync
import { supabase, storageGet, storageSet, storagePrime } from './supabaseSync';
export { supabase };
import { extractCityFromCompanyName } from '../utils/cityExtractor';
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
  ShiftConfigInput,
  ImportJob,
  CustomerProductHistory,
  HTMLImportPreview,
  HTMLProductRecord,
  HTMLCustomerRecord,
  ImportType,
  ImportStrategy,
  ImportJobStatus,
  ImportErrorItem,
  ImportDuplicateItem,
  DayOfWeek,
  PortalType,
  RouteSchedule,
  DailyOrderOperationStatus,
  DailyOrderOperation,
  DailyOrderOperationHistory,
  WhatsAppContact,
  WhatsAppConversation,
  WhatsAppMessage,
  OrderDraft,
  OrderDraftItem,
  OrderDraftStatus,
  ProductAlias,
  CustomerProductAlias,
  RouteDestination,
  AgentAttentionAlert,
  AttentionPriority,
  OrderIntakeEvent,
  MessageClassification,
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
];

// Initial Demo Accounts Seed Data (Single Admin Account)
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
];
// Initial Business Customers Seed Data (Clean Reset State)
export const SEED_CUSTOMERS: Customer[] = [];

export const SEED_ROUTE_SCHEDULES: RouteSchedule[] = [
  { id: '00000000-0000-0000-0020-000000000001', day_of_week: 'monday', city_or_route: 'Kelowna', portal: 'kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  { id: '00000000-0000-0000-0020-000000000002', day_of_week: 'tuesday', city_or_route: 'Kelowna', portal: 'kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000003', day_of_week: 'tuesday', city_or_route: 'West Kelowna', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000004', day_of_week: 'tuesday', city_or_route: 'Summerland', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  { id: '00000000-0000-0000-0020-000000000005', day_of_week: 'wednesday', city_or_route: 'Kelowna', portal: 'kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000006', day_of_week: 'wednesday', city_or_route: 'Penticton', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000007', day_of_week: 'wednesday', city_or_route: 'West Kelowna', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000008', day_of_week: 'wednesday', city_or_route: 'Osoyoos', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000009', day_of_week: 'wednesday', city_or_route: 'Oliver', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  { id: '00000000-0000-0000-0020-000000000010', day_of_week: 'thursday', city_or_route: 'Kelowna', portal: 'kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000011', day_of_week: 'thursday', city_or_route: 'Penticton', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000012', day_of_week: 'thursday', city_or_route: 'Princeton', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000013', day_of_week: 'thursday', city_or_route: 'Keremeos', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000014', day_of_week: 'thursday', city_or_route: 'Osoyoos', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000015', day_of_week: 'thursday', city_or_route: 'Oliver', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000016', day_of_week: 'thursday', city_or_route: 'Merritt', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  { id: '00000000-0000-0000-0020-000000000017', day_of_week: 'friday', city_or_route: 'Vernon', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000018', day_of_week: 'friday', city_or_route: 'Salmon Arm', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000019', day_of_week: 'friday', city_or_route: 'Lake Country', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000020', day_of_week: 'friday', city_or_route: 'Armstrong', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  { id: '00000000-0000-0000-0020-000000000021', day_of_week: 'saturday', city_or_route: 'Vernon', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000022', day_of_week: 'saturday', city_or_route: 'Kamloops', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000023', day_of_week: 'saturday', city_or_route: 'Falkland', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000024', day_of_week: 'saturday', city_or_route: 'Chase', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000025', day_of_week: 'saturday', city_or_route: 'Salmon Arm', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000026', day_of_week: 'saturday', city_or_route: 'Lake Country', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  
  { id: '00000000-0000-0000-0020-000000000027', day_of_week: 'sunday', city_or_route: 'Kelowna', portal: 'kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000028', day_of_week: 'sunday', city_or_route: 'Penticton', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000029', day_of_week: 'sunday', city_or_route: 'Osoyoos', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000030', day_of_week: 'sunday', city_or_route: 'Oliver', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0020-000000000031', day_of_week: 'sunday', city_or_route: 'West Kelowna', portal: 'outside_kelowna', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
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

// Initial Customer Queries Seed Data (Clean Reset State)
export const SEED_QUERIES: CustomerQuery[] = [];
export const SEED_ACTIVITIES: QueryActivity[] = [];
export const SEED_NOTES: QueryInternalNote[] = [];
export const SEED_NOTIFICATIONS: CRMNotification[] = [];
export const SEED_ORDERS: Order[] = [];
export const SEED_ORDER_ITEMS: OrderItem[] = [];
export const SEED_ORDER_HISTORY: OrderStatusHistory[] = [];
export const SEED_ORDER_DOCUMENTS: OrderDocument[] = [];

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

// Initial Product & Operational Seed Datasets (Clean Reset State)
export const SEED_PRODUCTS: Product[] = [];
export const SEED_PRODUCT_HISTORY: ProductAvailabilityHistory[] = [];

// Bump this version string whenever the HTML source data changes.
// Clean slate version (auto-seeding disabled).
export const SEED_DATA_VERSION = 'v4-clean-slate';
export const SEED_SHIFTS: Shift[] = [];
export const SEED_HANDOVERS: ShiftHandover[] = [];
export const SEED_HANDOVER_ITEMS: ShiftHandoverItem[] = [];

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

  // Step 11 CSV Import System Key
  private importJobsKey = 'jt_crm_import_jobs';

  // Step 10 REBUILD Route Operations Keys
  private routeSchedulesKey = 'jt_crm_route_schedules';
  private dailyOrderOperationsKey = 'jt_crm_daily_order_operations';
  private dailyOrderOperationHistoryKey = 'jt_crm_daily_order_operation_history';

  // Step 12 HTML Business Data Integration Key
  private customerProductHistoryKey = 'jt_crm_customer_product_history';

  // WhatsApp Order Intelligence (Phase A) Keys
  private whatsappContactsKey = 'jt_crm_whatsapp_contacts';
  private whatsappConversationsKey = 'jt_crm_whatsapp_conversations';
  private whatsappMessagesKey = 'jt_crm_whatsapp_messages';
  private orderDraftsKey = 'jt_crm_order_drafts';
  private orderDraftItemsKey = 'jt_crm_order_draft_items';
  private productAliasesKey = 'jt_crm_product_aliases';
  private customerProductAliasesKey = 'jt_crm_customer_product_aliases';
  private routeDestinationsKey = 'jt_crm_route_destinations';
  private agentAttentionAlertsKey = 'jt_crm_agent_attention_alerts';
  private orderIntakeEventsKey = 'jt_crm_order_intake_events';

  // Seed version key — used to force re-seed when SEED_DATA_VERSION changes
  private seedVersionKey = 'jt_crm_seed_version';

  constructor() {
    this.init();
  }

  private init() {
    // Seed the in-memory store with system configuration data and clean empty business tables
    const seeds: Array<[string, unknown]> = [
      [this.teamsKey, SEED_TEAMS],
      [this.usersKey, SEED_USERS],
      [this.customersKey, []],
      [this.categoriesKey, SEED_CATEGORIES],
      [this.queriesKey, []],
      [this.activitiesKey, []],
      [this.notesKey, []],
      [this.notificationsKey, []],
      [this.ordersKey, []],
      [this.orderItemsKey, []],
      [this.orderHistoryKey, []],
      [this.orderDocsKey, []],
      [this.productCategoriesKey, SEED_PRODUCT_CATEGORIES],
      [this.productBrandsKey, SEED_PRODUCT_BRANDS],
      [this.productsKey, []],
      [this.productHistoryKey, []],
      [this.customerProductHistoryKey, []],
      [this.shiftsKey, []],
      [this.handoversKey, []],
      [this.handoverItemsKey, []],
      [this.queryAttachmentsKey, []],
      [this.routeSchedulesKey, SEED_ROUTE_SCHEDULES],
      [this.dailyOrderOperationsKey, []],
      [this.dailyOrderOperationHistoryKey, []],
      [this.importJobsKey, []],
      [this.auditLogsKey, []],
      [this.whatsappContactsKey, []],
      [this.whatsappConversationsKey, []],
      [this.whatsappMessagesKey, []],
      [this.orderDraftsKey, []],
      [this.orderDraftItemsKey, []],
      [this.productAliasesKey, []],
      [this.customerProductAliasesKey, []],
      [this.routeDestinationsKey, []],
      [this.agentAttentionAlertsKey, []],
      [this.orderIntakeEventsKey, []],
    ];

    seeds.forEach(([key, rows]) => {
      // Always prime storage with clean state for reset if missing
      if (storageGet(key) === null) {
        storageSet(key, JSON.stringify(rows));
      }
    });

    if (storageGet(this.systemSettingsKey) === null) {
      const defaultSettings: SystemSettings = {
        id: '00000000-0000-0000-0000-0000000000a1',
        company_name: 'J&T Supplies',
        crm_title: 'J&T Supplies CRM',
        timezone: 'America/Vancouver',
        date_format: 'MMM D, YYYY h:mm A',
        currency_symbol: '$',
        pagination_limit: 10,
        updated_at: new Date().toISOString(),
        updated_by: 'a1111111-1111-1111-1111-111111111111',
      };
      storagePrime(this.systemSettingsKey, JSON.stringify(defaultSettings));
    }

    // Ensure clean slate version control
    this.ensureCleanSlateVersion();
  }

  private ensureCleanSlateVersion() {
    const storedVersion = storageGet(this.seedVersionKey);
    if (storedVersion !== SEED_DATA_VERSION) {
      // If upgrading to clean-slate version, wipe previously auto-seeded business catalog
      storageSet(this.productsKey, JSON.stringify([]));
      storageSet(this.customersKey, JSON.stringify([]));
      storageSet(this.customerProductHistoryKey, JSON.stringify([]));
      storageSet(this.teamsKey, JSON.stringify(SEED_TEAMS));
      storageSet(this.usersKey, JSON.stringify(SEED_USERS));
      storageSet(this.seedVersionKey, SEED_DATA_VERSION);
      console.log(`[Seed] Enforced clean slate database version (${SEED_DATA_VERSION}).`);
    }
  }

  public resetToCleanSlate() {
    storageSet(this.productsKey, JSON.stringify([]));
    storageSet(this.customersKey, JSON.stringify([]));
    storageSet(this.customerProductHistoryKey, JSON.stringify([]));
    storageSet(this.queriesKey, JSON.stringify([]));
    storageSet(this.activitiesKey, JSON.stringify([]));
    storageSet(this.notesKey, JSON.stringify([]));
    storageSet(this.notificationsKey, JSON.stringify([]));
    storageSet(this.ordersKey, JSON.stringify([]));
    storageSet(this.orderItemsKey, JSON.stringify([]));
    storageSet(this.orderHistoryKey, JSON.stringify([]));
    storageSet(this.orderDocsKey, JSON.stringify([]));
    storageSet(this.whatsappContactsKey, JSON.stringify([]));
    storageSet(this.whatsappConversationsKey, JSON.stringify([]));
    storageSet(this.whatsappMessagesKey, JSON.stringify([]));
    storageSet(this.orderDraftsKey, JSON.stringify([]));
    storageSet(this.orderDraftItemsKey, JSON.stringify([]));
    storageSet(this.teamsKey, JSON.stringify(SEED_TEAMS));
    storageSet(this.usersKey, JSON.stringify(SEED_USERS));
    storageSet(this.seedVersionKey, SEED_DATA_VERSION);
    console.log('[Seed] Database reset to clean slate completed.');
  }

  private ensureHtmlBusinessDataSeeded() {
    // Auto-seeding disabled in clean slate mode.
  }


  public async seedHtmlBusinessData() {
    const { SEED_HTML_PRODUCTS, SEED_HTML_CUSTOMERS } = await import('../data/seedHtmlData');
    const categories = SEED_PRODUCT_CATEGORIES;
    const catMap = new Map<string, string>();
    categories.forEach(c => catMap.set(c.name.toLowerCase(), c.id));
    const defaultCatId = categories[0]?.id || '00000000-0000-0000-0003-000000000001';

    // 1. Convert SEED_HTML_PRODUCTS -> Product[]
    const codeToProductMap = new Map<string, Product>();
    const newProducts: Product[] = SEED_HTML_PRODUCTS.map((p, idx) => {
      const catId = catMap.get(p.category.toLowerCase()) || defaultCatId;
      const prodUuid = `00000000-0000-0000-0001-${String(idx + 1).padStart(12, '0')}`;
      const prodObj: Product = {
        id: prodUuid,
        sku: p.sku || `ITEM-${p.itemCode}`,
        product_name: p.name,
        description: p.subcategory ? `${p.category} > ${p.subcategory}` : p.category,
        category_id: catId,
        brand_id: null,
        unit_price: p.desiredSPBase || 0,
        availability_status: 'available',
        availability_notes: null,
        expected_available_date: null,
        is_active: true,
        created_at: new Date('2026-01-01').toISOString(),
        updated_at: new Date('2026-01-01').toISOString(),
        created_by: null,
        updated_by: null,
      };
      codeToProductMap.set(p.itemCode, prodObj);
      return prodObj;
    });

    storageSet(this.productsKey, JSON.stringify(newProducts));

    // 2. Convert SEED_HTML_CUSTOMERS -> Customer[] and CustomerProductHistory[]
    const newCustomers: Customer[] = [];
    const newHistory: CustomerProductHistory[] = [];

    SEED_HTML_CUSTOMERS.forEach((c, cIdx) => {
      const custUuid = `00000000-0000-0000-0002-${String(cIdx + 1).padStart(12, '0')}`;
      const custCode = `CUST-${String(cIdx + 1).padStart(4, '0')}`;
      
      const custObj: Customer = {
        id: custUuid,
        customer_code: custCode,
        company_name: c.customerName,
        contact_person: null,
        phone: '',
        whatsapp_number: '',
        email: null,
        city: '',
        route: '',
        address: '',
        country: 'USA',
        notes: null,
        status: 'active',
        created_at: new Date('2026-01-01').toISOString(),
        updated_at: new Date('2026-01-01').toISOString(),
        created_by: null,
        updated_by: null,
      };

      newCustomers.push(custObj);

      c.items.forEach((item, itemIdx) => {
        const matchedProd = codeToProductMap.get(item.itemCode);
        const histUuid = `00000000-0000-0000-0003-${String(newHistory.length + 1).padStart(12, '0')}`;
        const histObj: CustomerProductHistory = {
          id: histUuid,
          customer_id: custUuid,
          customer_name: c.customerName,
          product_id: matchedProd ? matchedProd.id : null,
          source_item_code: item.itemCode,
          source_item_name: item.itemName,
          packaging_unit: item.unit,
          customer_price: item.price,
          inner_unit: item.innerUnit,
          inner_qty: item.innerQty,
          unit_price: item.unitPrice,
          created_at: new Date('2026-01-01').toISOString(),
          updated_at: new Date('2026-01-01').toISOString(),
        };
        newHistory.push(histObj);
      });
    });


    storageSet(this.customersKey, JSON.stringify(newCustomers));
    storageSet(this.customerProductHistoryKey, JSON.stringify(newHistory));

    // Persist the current seed version so subsequent loads skip re-seeding
    storageSet(this.seedVersionKey, SEED_DATA_VERSION);
    console.log(`[Seed] HTML business data seeded successfully: ${newProducts.length} products, ${newCustomers.length} customers, ${newHistory.length} history records (version: ${SEED_DATA_VERSION}).`);
  }

  public clearAllBusinessData(): void {
    const businessKeys = [
      this.customersKey,
      this.queriesKey,
      this.activitiesKey,
      this.notesKey,
      this.notificationsKey,
      this.ordersKey,
      this.orderItemsKey,
      this.orderHistoryKey,
      this.orderDocsKey,
      this.productsKey,
      this.productHistoryKey,
      this.customerProductHistoryKey,
      this.shiftsKey,
      this.handoversKey,
      this.handoverItemsKey,
      this.queryAttachmentsKey,
      this.dailyOrderOperationsKey,
      this.dailyOrderOperationHistoryKey,
      this.importJobsKey,
      this.auditLogsKey,
    ];

    businessKeys.forEach((key) => {
      storageSet(key, JSON.stringify([]));
    });
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
          (c.whatsapp_number && c.whatsapp_number.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.city && c.city.toLowerCase().includes(query)) ||
          (c.route && c.route.toLowerCase().includes(query))
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

    const companyName = input.company_name.trim();
    const city = input.city?.trim() || extractCityFromCompanyName(companyName);

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      customer_code: customerCode,
      company_name: companyName,
      contact_person: input.contact_person?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp_number: input.whatsapp_number?.trim() || null,
      email: null,
      address: null,
      city: city,
      route: input.route?.trim() || null,
      country: input.country?.trim() || 'Canada',
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
    const companyName = input.company_name ? input.company_name.trim() : existing.company_name;
    const city = input.city ? input.city.trim() : (existing.city || extractCityFromCompanyName(companyName));

    const updated: Customer = {
      ...existing,
      company_name: companyName,
      contact_person: input.contact_person?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp_number: input.whatsapp_number !== undefined ? (input.whatsapp_number?.trim() || null) : existing.whatsapp_number,
      email: null,
      address: null,
      city: city,
      route: input.route !== undefined ? (input.route?.trim() || null) : existing.route,
      country: input.country?.trim() || 'Canada',
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

  // --- Step 11: CSV Import Jobs Methods ---

  public getImportJobs(filters: {
    searchTerm?: string;
    import_type?: string;
    status?: string;
  } = {}): ImportJob[] {
    try {
      const data = storageGet(this.importJobsKey);
      let list: ImportJob[] = data ? JSON.parse(data) : [];
      const users = this.getUsers();

      list = list.map(job => ({
        ...job,
        created_by_profile: job.created_by ? users.find(u => u.id === job.created_by) || null : null,
      }));

      if (filters.import_type && filters.import_type !== 'all') {
        list = list.filter(j => j.import_type === filters.import_type);
      }
      if (filters.status && filters.status !== 'all') {
        list = list.filter(j => j.status === filters.status);
      }
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const q = filters.searchTerm.toLowerCase().trim();
        list = list.filter(j =>
          j.file_name.toLowerCase().includes(q) ||
          j.import_type.toLowerCase().includes(q) ||
          j.import_strategy.toLowerCase().includes(q) ||
          (j.created_by_profile && j.created_by_profile.full_name.toLowerCase().includes(q))
        );
      }

      return list.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    } catch {
      return [];
    }
  }

  public getImportJobById(id: string): ImportJob | null {
    const jobs = this.getImportJobs();
    return jobs.find(j => j.id === id) || null;
  }

  public saveImportJob(job: ImportJob): ImportJob {
    try {
      const data = storageGet(this.importJobsKey);
      const list: ImportJob[] = data ? JSON.parse(data) : [];
      const index = list.findIndex(j => j.id === job.id);

      if (index >= 0) {
        list[index] = job;
      } else {
        list.unshift(job);
      }

      storageSet(this.importJobsKey, JSON.stringify(list));
      return job;
    } catch {
      return job;
    }
  }

  // =========================================================================
  // STEP 10 REBUILD: ROUTE-BASED DAILY ORDER OPERATIONS METHODS
  // =========================================================================

  public getRouteSchedules(dayOfWeek?: DayOfWeek): RouteSchedule[] {
    try {
      const data = storageGet(this.routeSchedulesKey);
      let list: RouteSchedule[] = data ? JSON.parse(data) : SEED_ROUTE_SCHEDULES;
      if (dayOfWeek) {
        list = list.filter(r => r.day_of_week === dayOfWeek);
      }
      return list;
    } catch {
      return SEED_ROUTE_SCHEDULES;
    }
  }

  public updateRouteSchedule(id: string, updates: Partial<RouteSchedule>, currentUserId: string): RouteSchedule | null {
    const list = this.getRouteSchedules();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updated: RouteSchedule = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    list[index] = updated;
    storageSet(this.routeSchedulesKey, JSON.stringify(list));

    this.logAudit({
      user_id: currentUserId,
      action: 'route_schedule_updated',
      entity_type: 'route_schedule',
      entity_id: id,
      entity_number: `${updated.day_of_week} - ${updated.city_or_route}`,
      summary: `Updated route schedule for ${updated.city_or_route} (${updated.day_of_week})`,
      previous_value: null,
      new_value: null,
    });

    return updated;
  }

  public createRouteSchedule(input: { day_of_week: DayOfWeek; city_or_route: string; portal: 'kelowna' | 'outside_kelowna'; active: boolean }, currentUserId: string): RouteSchedule {
    const list = this.getRouteSchedules();
    const newSchedule: RouteSchedule = {
      id: crypto.randomUUID(),
      day_of_week: input.day_of_week,
      city_or_route: input.city_or_route.trim(),
      portal: input.portal,
      active: input.active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = [...list, newSchedule];
    storageSet(this.routeSchedulesKey, JSON.stringify(updatedList));

    this.logAudit({
      user_id: currentUserId,
      action: 'route_schedule_updated',
      entity_type: 'route_schedule',
      entity_id: newSchedule.id,
      entity_number: `${newSchedule.day_of_week} - ${newSchedule.city_or_route}`,
      summary: `Created route schedule for ${newSchedule.city_or_route} (${newSchedule.day_of_week})`,
      previous_value: null,
      new_value: null,
    });

    return newSchedule;
  }

  public getDailyOrderOperations(options: {
    date: string; // YYYY-MM-DD
    route?: string;
    portal?: PortalType;
    searchTerm?: string;
    statusFilter?: string;
    sortBy?: string;
  }): { operations: DailyOrderOperation[]; activeRoutes: string[]; weekday: DayOfWeek } {
    try {
      const selectedDate = new Date(options.date + 'T12:00:00');
      const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const weekday = dayNames[selectedDate.getDay()];

      // Get active route schedules for this weekday
      let schedules = this.getRouteSchedules(weekday).filter(s => s.active);
      if (options.portal && options.portal !== 'all') {
        schedules = schedules.filter(s => s.portal === options.portal);
      }

      const activeRoutes = Array.from(new Set(schedules.map(s => s.city_or_route)));
      const targetRoute = options.route || activeRoutes[0] || '';

      if (!targetRoute) {
        return { operations: [], activeRoutes, weekday };
      }

      // Find customers assigned to this route or city
      const customers = this.getCustomers('').filter(c => {
        const cRoute = (c.route || '').trim().toLowerCase();
        const cCity = (c.city || '').trim().toLowerCase();
        const matchRoute = targetRoute.trim().toLowerCase();
        return cRoute === matchRoute || cCity === matchRoute;
      });

      // Load operations list from storage
      const opsData = storageGet(this.dailyOrderOperationsKey);
      let opsList: DailyOrderOperation[] = opsData ? JSON.parse(opsData) : [];
      let updatedOpsList = [...opsList];

      const users = this.getUsers();
      const queries = this.getQueries();

      // Ensure operation record exists for each customer for date & targetRoute
      const resultOps: DailyOrderOperation[] = customers.map(cust => {
        let opIndex = updatedOpsList.findIndex(o => o.customer_id === cust.id && o.operation_date === options.date);
        let op: DailyOrderOperation;

        if (opIndex >= 0) {
          op = updatedOpsList[opIndex];
        } else {
          op = {
            id: crypto.randomUUID(),
            customer_id: cust.id,
            operation_date: options.date,
            route: targetRoute,
            order_received: false,
            sales_order_generated: false,
            invoiced: false,
            dispatched: false,
            error_flag: false,
            status: 'not_started',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          updatedOpsList.push(op);
        }

        // Attach related profiles & customer & query
        op.customer = cust;
        if (op.order_received_by) op.order_received_by_profile = users.find(u => u.id === op.order_received_by) || null;
        if (op.sales_order_generated_by) op.sales_order_generated_by_profile = users.find(u => u.id === op.sales_order_generated_by) || null;
        if (op.invoiced_by) op.invoiced_by_profile = users.find(u => u.id === op.invoiced_by) || null;
        if (op.dispatched_by) op.dispatched_by_profile = users.find(u => u.id === op.dispatched_by) || null;
        if (op.error_query_id) op.error_query = queries.find(q => q.id === op.error_query_id) || null;

        return op;
      });

      // Save lazily created records if list expanded
      if (updatedOpsList.length > opsList.length) {
        storageSet(this.dailyOrderOperationsKey, JSON.stringify(updatedOpsList));
      }

      // Filter by search & status
      let filtered = resultOps;
      if (options.searchTerm) {
        const q = options.searchTerm.trim().toLowerCase();
        filtered = filtered.filter(o => 
          o.customer?.company_name.toLowerCase().includes(q) ||
          o.customer?.contact_person?.toLowerCase().includes(q) ||
          o.customer?.phone?.toLowerCase().includes(q) ||
          o.customer?.whatsapp_number?.toLowerCase().includes(q) ||
          o.sales_order_number?.toLowerCase().includes(q) ||
          o.invoice_number?.toLowerCase().includes(q)
        );
      }

      if (options.statusFilter && options.statusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === options.statusFilter);
      }

      // Sort
      filtered.sort((a, b) => {
        if (options.sortBy === 'status') {
          return a.status.localeCompare(b.status);
        }
        if (options.sortBy === 'updated_at') {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return (a.customer?.company_name || '').localeCompare(b.customer?.company_name || '');
      });

      return { operations: filtered, activeRoutes, weekday };
    } catch {
      return { operations: [], activeRoutes: [], weekday: 'monday' };
    }
  }

  public updateDailyOrderOperationStep(
    id: string,
    step: 'order_received' | 'sales_order_generated' | 'invoiced' | 'dispatched',
    referenceNumber: string | null,
    userId: string
  ): DailyOrderOperation | null {
    try {
      const opsData = storageGet(this.dailyOrderOperationsKey);
      const opsList: DailyOrderOperation[] = opsData ? JSON.parse(opsData) : [];
      const index = opsList.findIndex(o => o.id === id);
      if (index === -1) return null;

      const existing = opsList[index];
      const now = new Date().toISOString();
      const previousState = existing.status;

      // Enforce dependencies
      if (step === 'sales_order_generated' && !existing.order_received) {
        throw new Error('Order Received must be completed before generating a Sales Order.');
      }
      if (step === 'invoiced' && !existing.sales_order_generated) {
        throw new Error('Sales Order must be generated before Invoicing.');
      }
      if (step === 'dispatched' && !existing.invoiced) {
        throw new Error('Customer must be Invoiced before Dispatch.');
      }

      const updated: DailyOrderOperation = { ...existing };

      if (step === 'order_received') {
        updated.order_received = true;
        updated.order_received_at = now;
        updated.order_received_by = userId;
      } else if (step === 'sales_order_generated') {
        if (!referenceNumber || !referenceNumber.trim()) {
          throw new Error('Sales Order Number is required.');
        }
        updated.sales_order_generated = true;
        updated.sales_order_number = referenceNumber.trim();
        updated.sales_order_generated_at = now;
        updated.sales_order_generated_by = userId;
      } else if (step === 'invoiced') {
        if (!referenceNumber || !referenceNumber.trim()) {
          throw new Error('Invoice Number is required.');
        }
        updated.invoiced = true;
        updated.invoice_number = referenceNumber.trim();
        updated.invoiced_at = now;
        updated.invoiced_by = userId;
      } else if (step === 'dispatched') {
        updated.dispatched = true;
        updated.dispatched_at = now;
        updated.dispatched_by = userId;
      }

      // Derive status
      if (updated.error_flag) {
        updated.status = 'error';
      } else if (updated.order_received && updated.sales_order_generated && updated.invoiced && updated.dispatched) {
        updated.status = 'completed';
      } else if (updated.dispatched) {
        updated.status = 'dispatched';
      } else if (updated.invoiced) {
        updated.status = 'invoiced';
      } else if (updated.sales_order_generated) {
        updated.status = 'sales_order_generated';
      } else if (updated.order_received) {
        updated.status = 'order_received';
      } else {
        updated.status = 'not_started';
      }

      updated.updated_at = now;
      opsList[index] = updated;
      storageSet(this.dailyOrderOperationsKey, JSON.stringify(opsList));

      // Log history
      this.logDailyOperationHistory({
        operation_id: id,
        customer_id: updated.customer_id,
        action: `Completed step: ${step.replace(/_/g, ' ')}`,
        previous_state: previousState,
        new_state: updated.status,
        reference_number: referenceNumber,
        user_id: userId,
        timestamp: now,
      });

      this.logAudit({
        user_id: userId,
        action: 'daily_operation_update',
        entity_type: 'daily_order_operation',
        entity_id: id,
        entity_number: updated.sales_order_number || updated.invoice_number || id,
        summary: `Updated daily operation status to ${updated.status} for step '${step}'`,
        previous_value: previousState,
        new_value: updated.status,
      });

      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update daily order operation step.');
    }
  }

  public revertDailyOrderOperationStep(
    id: string,
    step: 'order_received' | 'sales_order_generated' | 'invoiced' | 'dispatched',
    reason: string,
    userId: string
  ): DailyOrderOperation | null {
    try {
      if (!reason || !reason.trim()) {
        throw new Error('A reason is required to revert a workflow step.');
      }

      const opsData = storageGet(this.dailyOrderOperationsKey);
      const opsList: DailyOrderOperation[] = opsData ? JSON.parse(opsData) : [];
      const index = opsList.findIndex(o => o.id === id);
      if (index === -1) return null;

      const existing = opsList[index];
      const now = new Date().toISOString();
      const previousState = existing.status;
      const updated: DailyOrderOperation = { ...existing };

      if (step === 'order_received') {
        updated.order_received = false;
        updated.order_received_at = null;
        updated.order_received_by = null;
        updated.sales_order_generated = false;
        updated.sales_order_number = null;
        updated.sales_order_generated_at = null;
        updated.sales_order_generated_by = null;
        updated.invoiced = false;
        updated.invoice_number = null;
        updated.invoiced_at = null;
        updated.invoiced_by = null;
        updated.dispatched = false;
        updated.dispatched_at = null;
        updated.dispatched_by = null;
      } else if (step === 'sales_order_generated') {
        updated.sales_order_generated = false;
        updated.sales_order_number = null;
        updated.sales_order_generated_at = null;
        updated.sales_order_generated_by = null;
        updated.invoiced = false;
        updated.invoice_number = null;
        updated.invoiced_at = null;
        updated.invoiced_by = null;
        updated.dispatched = false;
        updated.dispatched_at = null;
        updated.dispatched_by = null;
      } else if (step === 'invoiced') {
        updated.invoiced = false;
        updated.invoice_number = null;
        updated.invoiced_at = null;
        updated.invoiced_by = null;
        updated.dispatched = false;
        updated.dispatched_at = null;
        updated.dispatched_by = null;
      } else if (step === 'dispatched') {
        updated.dispatched = false;
        updated.dispatched_at = null;
        updated.dispatched_by = null;
      }

      // Re-derive status
      if (updated.error_flag) {
        updated.status = 'error';
      } else if (updated.dispatched) {
        updated.status = 'dispatched';
      } else if (updated.invoiced) {
        updated.status = 'invoiced';
      } else if (updated.sales_order_generated) {
        updated.status = 'sales_order_generated';
      } else if (updated.order_received) {
        updated.status = 'order_received';
      } else {
        updated.status = 'not_started';
      }

      updated.updated_at = now;
      opsList[index] = updated;
      storageSet(this.dailyOrderOperationsKey, JSON.stringify(opsList));

      this.logDailyOperationHistory({
        operation_id: id,
        customer_id: updated.customer_id,
        action: `Reverted step: ${step.replace(/_/g, ' ')}`,
        previous_state: previousState,
        new_state: updated.status,
        reason: reason.trim(),
        user_id: userId,
        timestamp: now,
      });

      this.logAudit({
        user_id: userId,
        action: 'daily_operation_undo',
        entity_type: 'daily_order_operation',
        entity_id: id,
        summary: `Reverted step '${step}' for reason: ${reason.trim()}`,
        previous_value: previousState,
        new_value: updated.status,
      });

      return updated;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to revert workflow step.');
    }
  }

  public reportDailyOrderOperationError(
    id: string,
    issueDescription: string,
    priority: 'normal' | 'high' | 'urgent',
    userId: string
  ): { operation: DailyOrderOperation; query: CustomerQuery } {
    try {
      if (!issueDescription || !issueDescription.trim()) {
        throw new Error('Error description is required.');
      }

      const opsData = storageGet(this.dailyOrderOperationsKey);
      const opsList: DailyOrderOperation[] = opsData ? JSON.parse(opsData) : [];
      const index = opsList.findIndex(o => o.id === id);
      if (index === -1) throw new Error('Daily operation record not found.');

      const existing = opsList[index];
      const customer = this.getCustomerById(existing.customer_id);
      if (!customer) throw new Error('Customer not found.');

      const categories = this.getCategories();
      const orderCat = categories.find(c => c.name.toLowerCase().includes('order')) || categories[0];

      // Create Customer Query
      const query = this.createQuery({
        customer_id: customer.id,
        subject: `Daily Operations Issue — ${customer.company_name}`,
        description: `Daily Operations Error reported on route ${existing.route} (${existing.operation_date}): ${issueDescription.trim()}`,
        category_id: orderCat ? orderCat.id : '00000000-0000-0000-0001-000000000001',
        priority: priority === 'normal' ? 'medium' : priority,
      }, userId);

      const now = new Date().toISOString();
      const previousState = existing.status;

      const updated: DailyOrderOperation = {
        ...existing,
        error_flag: true,
        error_query_id: query.id,
        status: 'error',
        updated_at: now,
      };

      opsList[index] = updated;
      storageSet(this.dailyOrderOperationsKey, JSON.stringify(opsList));

      this.logDailyOperationHistory({
        operation_id: id,
        customer_id: updated.customer_id,
        action: `Reported Error: ${query.query_number}`,
        previous_state: previousState,
        new_state: 'error',
        reference_number: query.query_number,
        user_id: userId,
        timestamp: now,
      });

      this.logAudit({
        user_id: userId,
        action: 'daily_operation_error_query',
        entity_type: 'daily_order_operation',
        entity_id: id,
        entity_number: query.query_number,
        summary: `Reported daily operation error creating query ${query.query_number}`,
        previous_value: previousState,
        new_value: 'error',
      });

      return { operation: updated, query };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to report daily operation error.');
    }
  }

  public getDailyOrderOperationHistory(operationId: string): DailyOrderOperationHistory[] {
    try {
      const data = storageGet(this.dailyOrderOperationHistoryKey);
      const list: DailyOrderOperationHistory[] = data ? JSON.parse(data) : [];
      const users = this.getUsers();

      return list
        .filter(h => h.operation_id === operationId)
        .map(h => ({
          ...h,
          user_profile: h.user_id ? users.find(u => u.id === h.user_id) || null : null,
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  public getCustomerDailyOperations(customerId: string): DailyOrderOperation[] {
    try {
      const opsData = storageGet(this.dailyOrderOperationsKey);
      const opsList: DailyOrderOperation[] = opsData ? JSON.parse(opsData) : [];
      const queries = this.getQueries();

      return opsList
        .filter(o => o.customer_id === customerId)
        .map(o => ({
          ...o,
          error_query: o.error_query_id ? queries.find(q => q.id === o.error_query_id) || null : null,
        }))
        .sort((a, b) => new Date(b.operation_date).getTime() - new Date(a.operation_date).getTime());
    } catch {
      return [];
    }
  }

  private logDailyOperationHistory(item: Omit<DailyOrderOperationHistory, 'id'>) {
    try {
      const data = storageGet(this.dailyOrderOperationHistoryKey);
      const list: DailyOrderOperationHistory[] = data ? JSON.parse(data) : [];
      const newItem: DailyOrderOperationHistory = {
        ...item,
        id: crypto.randomUUID(),
      };
      list.unshift(newItem);
      storageSet(this.dailyOrderOperationHistoryKey, JSON.stringify(list));
    } catch {}
  }

  // --- Step 12: Customer Product History & HTML Business Data Import ---

  public getCustomerProductHistory(customerId?: string): CustomerProductHistory[] {
    try {
      const data = storageGet(this.customerProductHistoryKey);
      let list: CustomerProductHistory[] = data ? JSON.parse(data) : [];
      const products = this.getProducts();

      if (customerId) {
        list = list.filter(h => h.customer_id === customerId);
      }

      return list.map(h => ({
        ...h,
        product: h.product_id ? products.find(p => p.id === h.product_id) || null : null,
      })).sort((a, b) => a.source_item_name.localeCompare(b.source_item_name));
    } catch {
      return [];
    }
  }

  public getCustomerProductHistoryByCustomerName(companyName: string): CustomerProductHistory[] {
    try {
      const data = storageGet(this.customerProductHistoryKey);
      let list: CustomerProductHistory[] = data ? JSON.parse(data) : [];
      const products = this.getProducts();

      const normSearch = companyName.toLowerCase().trim();
      list = list.filter(h => (h.customer_name && h.customer_name.toLowerCase().trim() === normSearch));

      return list.map(h => ({
        ...h,
        product: h.product_id ? products.find(p => p.id === h.product_id) || null : null,
      })).sort((a, b) => a.source_item_name.localeCompare(b.source_item_name));
    } catch {
      return [];
    }
  }

  public importHTMLBusinessData(
    preview: HTMLImportPreview,
    strategy: ImportStrategy = 'create_new_only',
    fileName: string = 'HTML_Business_Data.html',
    userId?: string
  ): ImportJob {
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // 1. Process Products
    const products = this.getProductsRaw();
    const categories = this.getCategories();
    const defaultCatId = categories[0]?.id || '00000000-0000-0000-0003-000000000001';
    const catMap = new Map<string, string>();
    categories.forEach(c => catMap.set(c.name.toLowerCase(), c.id));

    const codeToProductMap = new Map<string, Product>();
    products.forEach(p => {
      // Map itemCode if SKU matches ITEM-xxx or contains itemCode
      codeToProductMap.set(p.sku.replace('ITEM-', ''), p);
    });

    preview.productDetails.forEach((p) => {
      const existing = products.find(prod => prod.sku === p.sku || prod.id.endsWith(p.itemCode));
      if (existing) {
        if (strategy === 'update_existing') {
          existing.product_name = p.name;
          existing.unit_price = p.desiredSPBase || existing.unit_price;
          existing.updated_at = now;
          updatedCount++;
          codeToProductMap.set(p.itemCode, existing);
        } else {
          skippedCount++;
          codeToProductMap.set(p.itemCode, existing);
        }
      } else {
        const catId = catMap.get(p.category.toLowerCase()) || defaultCatId;
        const nextIdx = products.length + 1;
        const prodUuid = `00000000-0000-0000-0001-${String(nextIdx).padStart(12, '0')}`;
        const newProd: Product = {
          id: prodUuid,
          sku: p.sku || `ITEM-${p.itemCode}`,
          product_name: p.name,
          description: p.subcategory ? `${p.category} > ${p.subcategory}` : p.category,
          category_id: catId,
          brand_id: null,
          unit_price: p.desiredSPBase || 0,
          availability_status: 'available',
          availability_notes: null,
          expected_available_date: null,
          is_active: true,
          created_at: now,
          updated_at: now,
          created_by: userId || null,
          updated_by: userId || null,
        };
        products.push(newProd);
        createdCount++;
        codeToProductMap.set(p.itemCode, newProd);
      }
    });

    storageSet(this.productsKey, JSON.stringify(products));

    // 2. Process Customers
    const customers = this.getCustomers();
    const existingHist = this.getCustomerProductHistory();
    const histMap = new Map<string, CustomerProductHistory>();
    existingHist.forEach(h => histMap.set(`${h.customer_id}_${h.source_item_code}`, h));

    const normCustMap = new Map<string, Customer>();
    customers.forEach(c => normCustMap.set(c.company_name.toLowerCase().replace(/[^a-z0-9]/g, ''), c));

    preview.customerDetails.forEach((c) => {
      const normName = c.customerName.toLowerCase().replace(/[^a-z0-9]/g, '');
      let cust = normCustMap.get(normName);

      if (!cust) {
        const nextIdx = customers.length + 1;
        const custUuid = `00000000-0000-0000-0002-${String(nextIdx).padStart(12, '0')}`;
        const newCust: Customer = {
          id: custUuid,
          customer_code: `CUST-${String(nextIdx).padStart(4, '0')}`,
          company_name: c.customerName,
          contact_person: null,
          phone: '',
          whatsapp_number: '',
          email: null,
          city: '',
          route: '',
          address: '',
          country: 'USA',
          notes: null,
          status: 'active',
          created_at: now,
          updated_at: now,
          created_by: userId || null,
          updated_by: userId || null,
        };

        cust = newCust;
        customers.push(cust);
        normCustMap.set(normName, cust);
        createdCount++;
      }


      // Add historical products
      c.items.forEach((item, itemIdx) => {
        const key = `${cust!.id}_${item.itemCode}`;
        const matchedProd = codeToProductMap.get(item.itemCode);

        if (!histMap.has(key)) {
          const histUuid = `00000000-0000-0000-0003-${String(existingHist.length + 1).padStart(12, '0')}`;
          const histRecord: CustomerProductHistory = {
            id: histUuid,
            customer_id: cust!.id,
            customer_name: c.customerName,
            product_id: matchedProd ? matchedProd.id : null,
            source_item_code: item.itemCode,
            source_item_name: item.itemName,
            packaging_unit: item.unit,
            customer_price: item.price,
            inner_unit: item.innerUnit,
            inner_qty: item.innerQty,
            unit_price: item.unitPrice,
            import_batch_id: jobId,
            created_at: now,
            updated_at: now,
          };
          existingHist.push(histRecord);
          histMap.set(key, histRecord);
        }
      });
    });


    storageSet(this.customersKey, JSON.stringify(customers));
    storageSet(this.customerProductHistoryKey, JSON.stringify(existingHist));

    // Record Import Job
    const job: ImportJob = {
      id: jobId,
      import_type: 'html_business_data',
      file_name: fileName,
      import_strategy: strategy,
      total_rows: preview.productsFound + preview.customersFound + preview.historicalRelationships,
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      failed_count: 0,
      status: 'completed',
      started_at: now,
      completed_at: now,
      created_by: userId || null,
    };

    const jobs = this.getImportJobs();
    jobs.unshift(job);
    storageSet(this.importJobsKey, JSON.stringify(jobs));

    this.logAudit({
      user_id: userId || null,
      action: 'html_data_import',
      entity_type: 'import_job',
      entity_id: jobId,
      entity_number: fileName,
      summary: `Imported HTML Business Data: ${preview.productsFound} products, ${preview.customersFound} customers, ${preview.historicalRelationships} historical relationships`,
    });

    return job;
  }

  // ===========================================================================
  // WHATSAPP ORDER INTELLIGENCE — PHASE A DATA ACCESS
  // ===========================================================================

  // --- WhatsApp Contacts ---

  public getWhatsAppContacts(): WhatsAppContact[] {
    try {
      const data = storageGet(this.whatsappContactsKey);
      const list: WhatsAppContact[] = data ? JSON.parse(data) : [];
      const customers = this.getCustomers();
      return list.map(c => ({
        ...c,
        customer: c.customer_id ? customers.find(x => x.id === c.customer_id) || null : null,
      }));
    } catch { return []; }
  }

  public getWhatsAppContactById(id: string): WhatsAppContact | null {
    return this.getWhatsAppContacts().find(c => c.id === id) || null;
  }

  public getOrCreateWhatsAppContact(whatsappNumber: string, displayName?: string): WhatsAppContact {
    const clean = whatsappNumber.trim().replace(/[^0-9+]/g, '');
    const list = this.getWhatsAppContacts();
    const existing = list.find(c => c.whatsapp_number.replace(/[^0-9+]/g, '') === clean);
    if (existing) return existing;

    const now = new Date().toISOString();
    const contact: WhatsAppContact = {
      id: crypto.randomUUID(),
      customer_id: this.findCustomerByWhatsAppNumber(clean)?.id || null,
      whatsapp_number: clean,
      display_name: displayName || clean,
      is_verified: clean.length >= 10,
      created_at: now,
      updated_at: now,
    };
    list.unshift(contact);
    storageSet(this.whatsappContactsKey, JSON.stringify(list));
    return contact;
  }

  /** Finds a customer whose configured WhatsApp number matches the incoming number. */
  public findCustomerByWhatsAppNumber(whatsappNumber: string): Customer | null {
    const clean = whatsappNumber.trim().replace(/[^0-9+]/g, '');
    return (
      this.getCustomers().find(c =>
        c.whatsapp_number && c.whatsapp_number.trim().replace(/[^0-9+]/g, '') === clean
      ) || null
    );
  }

  // --- WhatsApp Conversations ---

  public getWhatsAppConversations(): WhatsAppConversation[] {
    try {
      const data = storageGet(this.whatsappConversationsKey);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  public getWhatsAppConversationById(id: string): WhatsAppConversation | null {
    return this.getWhatsAppConversations().find(c => c.id === id) || null;
  }

  public getOrCreateWhatsAppConversation(contactId: string, customerId?: string | null): WhatsAppConversation {
    const list = this.getWhatsAppConversations();
    const existing = list.find(c => c.whatsapp_contact_id === contactId && c.status === 'active');
    if (existing) return existing;

    const now = new Date().toISOString();
    const conversation: WhatsAppConversation = {
      id: crypto.randomUUID(),
      customer_id: customerId || null,
      whatsapp_contact_id: contactId,
      status: 'active',
      route: null,
      delivery_date: null,
      bot_status: 'active',
      started_at: now,
      last_message_at: now,
      created_at: now,
      updated_at: now,
    };
    list.unshift(conversation);
    storageSet(this.whatsappConversationsKey, JSON.stringify(list));
    return conversation;
  }

  public updateWhatsAppConversation(id: string, patch: Partial<WhatsAppConversation>): WhatsAppConversation | null {
    const list = this.getWhatsAppConversations();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
    storageSet(this.whatsappConversationsKey, JSON.stringify(list));
    return list[idx];
  }

  // --- WhatsApp Messages ---

  public getWhatsAppMessages(conversationId?: string): WhatsAppMessage[] {
    try {
      const data = storageGet(this.whatsappMessagesKey);
      let list: WhatsAppMessage[] = data ? JSON.parse(data) : [];
      if (conversationId) {
        list = list.filter(m => m.conversation_id === conversationId);
      }
      return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    } catch { return []; }
  }

  public addWhatsAppMessage(input: Omit<WhatsAppMessage, 'id' | 'created_at'>): WhatsAppMessage {
    const list = this.getWhatsAppMessages();
    const now = new Date().toISOString();
    const message: WhatsAppMessage = {
      ...input,
      id: crypto.randomUUID(),
      processing_status: input.processing_status || 'received',
      created_at: now,
    };
    list.push(message);
    storageSet(this.whatsappMessagesKey, JSON.stringify(list));
    this.updateWhatsAppConversation(message.conversation_id, { last_message_at: now });
    return message;
  }

  public updateWhatsAppMessage(id: string, patch: Partial<WhatsAppMessage>): WhatsAppMessage | null {
    const list = this.getWhatsAppMessages();
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    storageSet(this.whatsappMessagesKey, JSON.stringify(list));
    return list[idx];
  }

  // --- Order Drafts ---

  public getOrderDrafts(filters?: { status?: OrderDraftStatus | OrderDraftStatus[]; customerId?: string }): OrderDraft[] {
    try {
      const data = storageGet(this.orderDraftsKey);
      let list: OrderDraft[] = data ? JSON.parse(data) : [];
      if (filters?.customerId) list = list.filter(d => d.customer_id === filters.customerId);
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        list = list.filter(d => statuses.includes(d.status));
      }
      const customers = this.getCustomers();
      return list.map(d => ({ ...d, customer: d.customer_id ? customers.find(c => c.id === d.customer_id) || null : null }));
    } catch { return []; }
  }

  public getOrderDraftById(id: string): OrderDraft | null {
    return this.getOrderDrafts().find(d => d.id === id) || null;
  }

  public getActiveDraftForConversation(conversationId: string): OrderDraft | null {
    const activeStatuses: OrderDraftStatus[] = [
      'NEW_MESSAGE', 'ANALYZING', 'DRAFT_CREATED', 'NEEDS_CLARIFICATION',
      'AWAITING_CONFIRMATION', 'CUSTOMER_CORRECTING',
    ];
    return this.getOrderDrafts({ status: activeStatuses }).find(d => d.conversation_id === conversationId) || null;
  }

  public generateInternalReference(): string {
    const maxSeq = this.getOrderDrafts().reduce((max, d) => {
      const m = (d.internal_reference || '').match(/CRM-ORD-(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    return `CRM-ORD-${String(maxSeq + 1).padStart(6, '0')}`;
  }

  public createOrderDraft(input: Partial<OrderDraft> & { customer_id?: string | null }): OrderDraft {
    const list = this.getOrderDrafts();
    const now = new Date().toISOString();
    const draft: OrderDraft = {
      id: crypto.randomUUID(),
      customer_id: input.customer_id || null,
      conversation_id: input.conversation_id || null,
      route: input.route || null,
      delivery_date: input.delivery_date || null,
      status: input.status || 'DRAFT_CREATED',
      overall_confidence: input.overall_confidence ?? 0,
      clarification_reason: input.clarification_reason || null,
      pending_question: input.pending_question || null,
      confirmed_at: null,
      confirmed_message: null,
      internal_reference: null,
      bot_paused: false,
      created_at: now,
      updated_at: now,
    };
    list.unshift(draft);
    storageSet(this.orderDraftsKey, JSON.stringify(list));
    return draft;
  }

  public updateOrderDraft(id: string, patch: Partial<OrderDraft>): OrderDraft | null {
    const list = this.getOrderDrafts();
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
    storageSet(this.orderDraftsKey, JSON.stringify(list));
    return list[idx];
  }

  // --- Order Draft Items ---

  public getOrderDraftItems(draftId: string): OrderDraftItem[] {
    try {
      const data = storageGet(this.orderDraftItemsKey);
      let list: OrderDraftItem[] = data ? JSON.parse(data) : [];
      list = list.filter(i => i.order_draft_id === draftId);
      const products = this.getProducts();
      return list.map(i => ({ ...i, product: i.product_id ? products.find(p => p.id === i.product_id) || null : null }));
    } catch { return []; }
  }

  public getOrderDraftWithItems(id: string): OrderDraft | null {
    const draft = this.getOrderDraftById(id);
    if (!draft) return null;
    return { ...draft, items: this.getOrderDraftItems(id) };
  }

  public addOrderDraftItem(input: Omit<OrderDraftItem, 'id' | 'created_at' | 'updated_at'>): OrderDraftItem {
    const list = this.getAllOrderDraftItems();
    const now = new Date().toISOString();
    const item: OrderDraftItem = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
    list.unshift(item);
    storageSet(this.orderDraftItemsKey, JSON.stringify(list));
    return item;
  }

  private getAllOrderDraftItems(): OrderDraftItem[] {
    try {
      const data = storageGet(this.orderDraftItemsKey);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  public updateOrderDraftItem(id: string, patch: Partial<OrderDraftItem>): OrderDraftItem | null {
    const list = this.getAllOrderDraftItems();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
    storageSet(this.orderDraftItemsKey, JSON.stringify(list));
    return list[idx];
  }

  public removeOrderDraftItem(id: string): boolean {
    const list = this.getAllOrderDraftItems();
    const next = list.filter(i => i.id !== id);
    if (next.length === list.length) return false;
    storageSet(this.orderDraftItemsKey, JSON.stringify(next));
    return true;
  }

  public setOrderDraftItems(draftId: string, items: OrderDraftItem[]): OrderDraftItem[] {
    const all = this.getAllOrderDraftItems().filter(i => i.order_draft_id !== draftId);
    all.push(...items);
    storageSet(this.orderDraftItemsKey, JSON.stringify(all));
    return items;
  }

  // --- Product Aliases ---

  public getProductAliases(activeOnly: boolean = true): ProductAlias[] {
    try {
      const data = storageGet(this.productAliasesKey);
      let list: ProductAlias[] = data ? JSON.parse(data) : [];
      if (activeOnly) list = list.filter(a => a.is_active);
      const products = this.getProducts();
      return list.map(a => ({ ...a, product: products.find(p => p.id === a.product_id) || null }));
    } catch { return []; }
  }

  public addProductAlias(productId: string, alias: string): ProductAlias {
    const list = this.getProductAliases(false);
    const now = new Date().toISOString();
    const normalized = alias.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    const existing = list.find(a => a.product_id === productId && a.normalized_alias === normalized);
    if (existing) return existing;
    const entry: ProductAlias = {
      id: crypto.randomUUID(),
      product_id: productId,
      alias: alias.trim(),
      normalized_alias: normalized,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    list.unshift(entry);
    storageSet(this.productAliasesKey, JSON.stringify(list));
    return entry;
  }

  // --- Customer-Specific Product Aliases ---

  public getCustomerProductAliases(customerId: string, activeOnly: boolean = true): CustomerProductAlias[] {
    try {
      const data = storageGet(this.customerProductAliasesKey);
      let list: CustomerProductAlias[] = data ? JSON.parse(data) : [];
      list = list.filter(a => a.customer_id === customerId);
      if (activeOnly) list = list.filter(a => a.is_active);
      const products = this.getProducts();
      return list.map(a => ({ ...a, product: products.find(p => p.id === a.product_id) || null }));
    } catch { return []; }
  }

  public addCustomerProductAlias(customerId: string, productId: string, alias: string): CustomerProductAlias {
    const list: CustomerProductAlias[] = (() => {
      try { const data = storageGet(this.customerProductAliasesKey); return data ? JSON.parse(data) : []; } catch { return []; }
    })();
    const normalized = alias.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    const existing = list.find(a => a.customer_id === customerId && a.product_id === productId && a.normalized_alias === normalized);
    if (existing) return existing;
    const now = new Date().toISOString();
    const entry: CustomerProductAlias = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      product_id: productId,
      alias: alias.trim(),
      normalized_alias: normalized,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    list.unshift(entry);
    storageSet(this.customerProductAliasesKey, JSON.stringify(list));
    return entry;
  }

  // --- Route Destinations ---

  public getRouteDestinations(activeOnly: boolean = true): RouteDestination[] {
    try {
      const data = storageGet(this.routeDestinationsKey);
      let list: RouteDestination[] = data ? JSON.parse(data) : [];
      if (activeOnly) list = list.filter(r => r.active);
      return list;
    } catch { return []; }
  }

  public addRouteDestination(input: Omit<RouteDestination, 'id' | 'created_at' | 'updated_at'>): RouteDestination {
    const list = this.getRouteDestinations(false);
    const now = new Date().toISOString();
    const entry: RouteDestination = {
      ...input,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    list.unshift(entry);
    storageSet(this.routeDestinationsKey, JSON.stringify(list));
    return entry;
  }

  public updateRouteDestination(id: string, patch: Partial<RouteDestination>): RouteDestination | null {
    const list = this.getRouteDestinations(false);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
    storageSet(this.routeDestinationsKey, JSON.stringify(list));
    return list[idx];
  }

  // --- Agent Attention Alerts ---

  public getAgentAttentionAlerts(filters?: { status?: string; customerId?: string; conversationId?: string }): AgentAttentionAlert[] {
    try {
      const data = storageGet(this.agentAttentionAlertsKey);
      let list: AgentAttentionAlert[] = data ? JSON.parse(data) : [];
      if (filters?.status) list = list.filter(a => a.status === filters.status);
      if (filters?.customerId) list = list.filter(a => a.customer_id === filters.customerId);
      if (filters?.conversationId) list = list.filter(a => a.conversation_id === filters.conversationId);
      const customers = this.getCustomers();
      return list.map(a => ({ ...a, customer: a.customer_id ? customers.find(c => c.id === a.customer_id) || null : null }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    } catch { return []; }
  }

  public getUnresolvedAlertCounts(): { urgent: number; high: number; normal: number; total: number } {
    const alerts = this.getAgentAttentionAlerts({ status: 'new' });
    return {
      urgent: alerts.filter(a => a.priority === 'urgent').length,
      high: alerts.filter(a => a.priority === 'high').length,
      normal: alerts.filter(a => a.priority === 'normal').length,
      total: alerts.length,
    };
  }

  public createAgentAttentionAlert(input: Omit<AgentAttentionAlert, 'id' | 'status' | 'created_at' | 'updated_at'>): AgentAttentionAlert {
    const list = this.getAgentAttentionAlerts();
    const now = new Date().toISOString();
    const alert: AgentAttentionAlert = {
      ...input,
      id: crypto.randomUUID(),
      status: 'new',
      created_at: now,
      updated_at: now,
    };
    list.unshift(alert);
    storageSet(this.agentAttentionAlertsKey, JSON.stringify(list));
    return alert;
  }

  public acknowledgeAgentAttentionAlert(id: string, userId: string): AgentAttentionAlert | null {
    const list = this.getAgentAttentionAlerts();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], status: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by: userId, updated_at: new Date().toISOString() };
    storageSet(this.agentAttentionAlertsKey, JSON.stringify(list));
    return list[idx];
  }

  public resolveAgentAttentionAlert(id: string, userId: string, resolution: string): AgentAttentionAlert | null {
    const list = this.getAgentAttentionAlerts();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx], status: 'resolved', resolved_at: new Date().toISOString(),
      resolved_by: userId, resolution, updated_at: new Date().toISOString(),
    };
    storageSet(this.agentAttentionAlertsKey, JSON.stringify(list));
    return list[idx];
  }

  public linkAlertToQuery(id: string, queryId: string): AgentAttentionAlert | null {
    return this.updateAlertField(id, { query_id: queryId });
  }

  private updateAlertField(id: string, patch: Partial<AgentAttentionAlert>): AgentAttentionAlert | null {
    const list = this.getAgentAttentionAlerts();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
    storageSet(this.agentAttentionAlertsKey, JSON.stringify(list));
    return list[idx];
  }

  // --- Order Intake Events (Audit Trail) ---

  public getOrderIntakeEvents(orderDraftId?: string): OrderIntakeEvent[] {
    try {
      const data = storageGet(this.orderIntakeEventsKey);
      let list: OrderIntakeEvent[] = data ? JSON.parse(data) : [];
      if (orderDraftId) list = list.filter(e => e.order_draft_id === orderDraftId);
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } catch { return []; }
  }

  public logOrderIntakeEvent(input: Omit<OrderIntakeEvent, 'id' | 'created_at'>): OrderIntakeEvent {
    const list = this.getOrderIntakeEvents();
    const event: OrderIntakeEvent = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    list.unshift(event);
    storageSet(this.orderIntakeEventsKey, JSON.stringify(list));
    return event;
  }

  // --- Alias helpers for the matching engine ---

  public getProductAliasesForCustomer(customerId: string | null): { productAliases: ProductAlias[]; customerAliases: CustomerProductAlias[] } {
    const productAliases = this.getProductAliases(true);
    const customerAliases = customerId ? this.getCustomerProductAliases(customerId, true) : [];
    return { productAliases, customerAliases };
  }

}


export const localDb = new LocalDatabaseService();

