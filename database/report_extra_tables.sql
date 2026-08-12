-- =============================================================================
-- J&T Supplies CRM — Report extra tables in the public schema
--
-- Lists every table in `public` that is NOT part of the current application
-- model. Run this in the Supabase Dashboard SQL Editor first so you can review
-- exactly what would be dropped before running cleanup_extra_tables.sql.
-- =============================================================================

SELECT t.tablename AS extra_table
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT IN (
    'teams',
    'query_categories',
    'product_categories',
    'product_brands',
    'profiles',
    'shifts',
    'customers',
    'products',
    'product_availability_history',
    'notifications',
    'shift_handovers',
    'shift_handover_items',
    'orders',
    'order_items',
    'order_status_history',
    'order_documents',
    'customer_queries',
    'query_activities',
    'query_internal_notes',
    'query_attachments',
    'system_settings',
    'audit_logs',
    'import_jobs',
    'route_schedules',
    'daily_order_operations',
    'daily_order_operation_history',
    'customer_product_history'
  )
ORDER BY t.tablename;
