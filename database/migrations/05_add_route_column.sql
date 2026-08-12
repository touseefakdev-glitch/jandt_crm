-- Migration 05: Ensure route column exists on customers table
-- Execute in Supabase SQL Editor if route column is missing from customers table.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS route VARCHAR(100);
