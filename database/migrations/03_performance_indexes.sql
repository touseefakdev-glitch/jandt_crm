-- =============================================================================
-- J&T Supplies CRM — Phase 1 Performance Indexes
-- Run against the Supabase project (SQL Editor): apply once, idempotent.
-- Targets the server-side paginated queries introduced in Phase 1:
--   customers/products/queries/notifications/out-of-stock lists + dashboard counts
-- =============================================================================

-- Trigram index extension for ILIKE '%term%' substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- customers (list: search, status filter, order by created_at)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_company_trgm
    ON public.customers USING gin (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_code_trgm
    ON public.customers USING gin (customer_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_city_trgm
    ON public.customers USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_status_created
    ON public.customers (status, created_at DESC);

-- -----------------------------------------------------------------------------
-- products (list: search, availability/category/brand filters, active flag, sort)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
    ON public.products USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
    ON public.products USING gin (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm
    ON public.products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_status_active
    ON public.products (availability_status, is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_active
    ON public.products (category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand_active
    ON public.products (brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_sort
    ON public.products (product_name);

-- -----------------------------------------------------------------------------
-- customer_queries (list: workspace tabs, status/priority/category filters,
--                   assigned_to / assigned_team_id, sort by updated_at)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_queries_subject_trgm
    ON public.customer_queries USING gin (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_queries_updated_at
    ON public.customer_queries (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_status_updated
    ON public.customer_queries (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_priority_updated
    ON public.customer_queries (priority, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_category_updated
    ON public.customer_queries (category_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_assigned_updated
    ON public.customer_queries (assigned_to, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_team_updated
    ON public.customer_queries (assigned_team_id, updated_at DESC);

-- -----------------------------------------------------------------------------
-- notifications (list + header badge: recipient + unread + priority + created_at)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
    ON public.notifications (recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON public.notifications (recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_title_trgm
    ON public.notifications USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notifications_message_trgm
    ON public.notifications USING gin (message gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Dashboard count queries (head counts)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_active_status
    ON public.products (is_active) INCLUDE (availability_status);
CREATE INDEX IF NOT EXISTS idx_queries_open_priority
    ON public.customer_queries (status, priority);

-- -----------------------------------------------------------------------------
-- Child tables: FK index coverage for detail-page joins (future server reads)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
    ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id
    ON public.order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_order_id
    ON public.order_documents (order_id);
CREATE INDEX IF NOT EXISTS idx_query_activities_query_id
    ON public.query_activities (query_id);
CREATE INDEX IF NOT EXISTS idx_query_notes_query_id
    ON public.query_internal_notes (query_id);
CREATE INDEX IF NOT EXISTS idx_query_attachments_query_id
    ON public.query_attachments (query_id);
CREATE INDEX IF NOT EXISTS idx_handover_items_handover_id
    ON public.shift_handover_items (handover_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_history_customer_id
    ON public.customer_product_history (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_history_product_id
    ON public.customer_product_history (product_id);
CREATE INDEX IF NOT EXISTS idx_daily_ops_customer_date
    ON public.daily_order_operations (customer_id, operation_date);
CREATE INDEX IF NOT EXISTS idx_daily_ops_history_operation_id
    ON public.daily_order_operation_history (operation_id);
