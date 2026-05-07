-- Migration: Add missing columns to audit_logs table
-- This script adds user_email and details columns if they don't exist

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS details TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs(user_email);
