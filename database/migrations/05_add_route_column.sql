-- Migration 05: Ensure route and whatsapp_number columns exist on customers table
-- Execute in Supabase SQL Editor if route or whatsapp_number column is missing from customers table.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS route VARCHAR(100);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);
