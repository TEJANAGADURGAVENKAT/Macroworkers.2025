-- Test script to verify the create_payment_audit_log function works
-- Run this AFTER running the main create_payment_bank_details_tables.sql script

-- Test 1: Call function with required parameters only
SELECT create_payment_audit_log(
  'test_action',
  'Test audit log entry'
);

-- Test 2: Call function with some optional parameters
SELECT create_payment_audit_log(
  'test_action_with_details',
  'Test audit log with details',
  NULL, -- payment_record_id
  NULL, -- task_id
  NULL, -- worker_id
  NULL, -- employer_id
  'old_status',
  'new_status',
  '{"test": "data"}'::jsonb
);

-- Check if the audit logs were created
SELECT * FROM public.payment_audit_logs 
WHERE action_type LIKE 'test_%'
ORDER BY performed_at DESC;

-- Clean up test data
DELETE FROM public.payment_audit_logs 
WHERE action_type LIKE 'test_%';
