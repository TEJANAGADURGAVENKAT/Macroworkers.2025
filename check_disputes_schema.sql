-- Check current disputes table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'disputes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if resolution-related columns exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' 
    AND column_name = 'resolved_by'
    AND table_schema = 'public'
  ) THEN 'resolved_by EXISTS' ELSE 'resolved_by MISSING' END as resolved_by_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' 
    AND column_name = 'resolved_at'
    AND table_schema = 'public'
  ) THEN 'resolved_at EXISTS' ELSE 'resolved_at MISSING' END as resolved_at_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'disputes' 
    AND column_name = 'resolution_notes'
    AND table_schema = 'public'
  ) THEN 'resolution_notes EXISTS' ELSE 'resolution_notes MISSING' END as resolution_notes_status;

