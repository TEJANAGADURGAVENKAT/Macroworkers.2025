-- Minimal Setup for File Upload/View System
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create storage bucket for submission files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'submission-files', 
  'submission-files', 
  false, 
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Storage bucket created successfully!' as status;

