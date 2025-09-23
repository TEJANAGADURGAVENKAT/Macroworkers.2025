# Task Submissions System Setup Guide

This guide covers the complete setup for the micro-tasks platform submission system with proper proof handling.

## Database Schema

### Enhanced `task_submissions` Table

```sql
CREATE TABLE public.task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  proof_text TEXT,
  proof_files TEXT[], -- Array of file names
  proof_type TEXT CHECK (proof_type IN ('text', 'file', 'both')) DEFAULT 'text',
  file_metadata JSONB, -- Store file metadata like size, type, etc.
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT
);
```

### Key Features

1. **Dual Proof Support**: Both text and file proofs
2. **File Metadata**: Store file information for better UX
3. **Automatic Employer ID**: Set via database trigger
4. **Proof Type Classification**: Automatically determined
5. **RLS Policies**: Secure access control

## Storage Setup

### Supabase Storage Bucket

```sql
-- Create storage bucket for submission files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submission-files', 'submission-files', false)
ON CONFLICT (id) DO NOTHING;
```

### Storage Policies

```sql
-- Workers can upload their own files
CREATE POLICY "Workers can upload submission files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'submission-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Workers can view their own files
CREATE POLICY "Workers can view their own submission files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Employers can view files for their tasks
CREATE POLICY "Employers can view submission files for their tasks" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'submission-files' 
  AND EXISTS (
    SELECT 1 FROM public.task_submissions ts
    JOIN public.tasks t ON ts.task_id = t.id
    WHERE t.created_by = auth.uid() 
    AND ts.proof_files @> ARRAY[name]
  )
);
```

## RLS Policies

### Task Submissions Policies

```sql
-- Workers can insert their own submissions
CREATE POLICY "Workers can insert their own submissions" 
ON public.task_submissions 
FOR INSERT 
WITH CHECK (worker_id = auth.uid());

-- Workers can view their own submissions
CREATE POLICY "Workers can view their own submissions" 
ON public.task_submissions 
FOR SELECT 
USING (worker_id = auth.uid());

-- Employers can view submissions for their tasks
CREATE POLICY "Task creators can view submissions for their tasks" 
ON public.task_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.id = task_id AND t.created_by = auth.uid()
));

-- Employers can update submissions for their tasks
CREATE POLICY "Task creators can update submissions for their tasks" 
ON public.task_submissions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.id = task_id AND t.created_by = auth.uid()
));
```

## Example Data

### Sample Submissions

```sql
-- Example 1: Text-only submission
INSERT INTO task_submissions (
  task_id,
  worker_id,
  proof_text,
  proof_type,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  'I completed the website design task. The homepage has been redesigned with a modern layout, responsive design, and improved user experience. All requested features have been implemented including the contact form, navigation menu, and footer. The design follows the brand guidelines provided.',
  'text',
  'pending'
);

-- Example 2: File-only submission
INSERT INTO task_submissions (
  task_id,
  worker_id,
  proof_files,
  proof_type,
  file_metadata,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  ARRAY['screenshot-homepage.png', 'design-mockup.pdf'],
  'file',
  '{"screenshot-homepage.png": {"size": 245760, "type": "image/png"}, "design-mockup.pdf": {"size": 1048576, "type": "application/pdf"}}',
  'pending'
);

-- Example 3: Mixed submission (text + files)
INSERT INTO task_submissions (
  task_id,
  worker_id,
  proof_text,
  proof_files,
  proof_type,
  file_metadata,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440006',
  'I have completed the logo design task. The logo incorporates the requested elements and follows the brand guidelines. I have provided both the vector file and a mockup showing how it looks on different backgrounds.',
  ARRAY['logo-vector.svg', 'logo-mockup.jpg'],
  'both',
  '{"logo-vector.svg": {"size": 15360, "type": "image/svg+xml"}, "logo-mockup.jpg": {"size": 512000, "type": "image/jpeg"}}',
  'pending'
);
```

## React Components

### Key Components

1. **SubmissionProofModal**: Modal for viewing submission proofs
2. **SubmissionsReview**: Employer page for reviewing submissions
3. **TaskDetail**: Worker page for submitting tasks

### Usage Examples

#### Worker Submitting a Task

```typescript
import { uploadSubmissionFile, validateSubmissionProof } from '@/lib/submission-utils';

const handleSubmit = async () => {
  // Validate proof
  const validation = validateSubmissionProof({
    text: proofText,
    files: proofFiles
  });

  if (!validation.isValid) {
    toast({
      title: "Invalid proof",
      description: validation.errors.join(', '),
      variant: "destructive"
    });
    return;
  }

  // Upload files
  const uploadedFiles = [];
  for (const file of proofFiles) {
    const result = await uploadSubmissionFile(file, user.id);
    uploadedFiles.push(result.fileName);
  }

  // Create submission
  const { data, error } = await supabase
    .from('task_submissions')
    .insert({
      task_id: task.id,
      worker_id: user.id,
      proof_text: proofText || null,
      proof_files: uploadedFiles.length > 0 ? uploadedFiles : null,
      status: 'pending'
    });
};
```

#### Employer Viewing Proofs

```typescript
import { getSubmissionFileUrl } from '@/lib/submission-utils';

const loadFileUrls = async (submission) => {
  const filePromises = submission.proof_files.map(async (fileName) => {
    const url = await getSubmissionFileUrl(submission.worker_id, fileName);
    return { name: fileName, url };
  });
  
  const files = await Promise.all(filePromises);
  setFiles(files);
};
```

## File Handling

### Supported File Types

- **Images**: jpg, jpeg, png, gif, webp, svg
- **Documents**: pdf, doc, docx, txt, md
- **Videos**: mp4, avi, mov, wmv
- **Audio**: mp3, wav, ogg

### File Size Limits

- Maximum file size: 10MB per file
- Maximum files per submission: 5

### File Storage Structure

```
submission-files/
├── worker-id-1/
│   ├── 1703123456789-screenshot.png
│   └── 1703123456790-document.pdf
└── worker-id-2/
    ├── 1703123456791-logo.svg
    └── 1703123456792-mockup.jpg
```

## Security Considerations

1. **File Access Control**: Files are stored in private buckets with signed URLs
2. **RLS Policies**: Database-level access control
3. **File Validation**: Type and size validation on upload
4. **URL Expiry**: Signed URLs expire after 1 hour
5. **Worker Isolation**: Files are stored in worker-specific folders

## Testing

### Test Cases

1. **Worker submits text-only proof**
2. **Worker submits file-only proof**
3. **Worker submits mixed proof (text + files)**
4. **Employer views text proof**
5. **Employer views file proof**
6. **Employer downloads files**
7. **Employer approves/rejects submission**
8. **File upload validation**
9. **RLS policy enforcement**

### Example Test Data

```sql
-- Create test tasks
INSERT INTO tasks (id, title, description, budget, created_by, status) VALUES
('task-1', 'Design Website Homepage', 'Create a modern homepage design', 500, 'employer-1', 'active'),
('task-2', 'Write Blog Post', 'Write a 1000-word blog post about AI', 200, 'employer-1', 'active'),
('task-3', 'Logo Design', 'Design a company logo', 300, 'employer-2', 'active');

-- Create test submissions
INSERT INTO task_submissions (task_id, worker_id, proof_text, proof_files, status) VALUES
('task-1', 'worker-1', 'Completed the homepage design with responsive layout', ARRAY['homepage-screenshot.png'], 'pending'),
('task-2', 'worker-2', 'Here is my blog post about AI: [content...]', NULL, 'pending'),
('task-3', 'worker-3', NULL, ARRAY['logo-vector.svg', 'logo-mockup.jpg'], 'pending');
```

## Troubleshooting

### Common Issues

1. **File upload fails**: Check storage bucket exists and policies are correct
2. **Signed URL generation fails**: Verify file path and worker permissions
3. **RLS policy blocks access**: Ensure user has correct role and ownership
4. **Modal doesn't show files**: Check file loading logic and error handling

### Debug Steps

1. Check browser console for errors
2. Verify Supabase storage bucket configuration
3. Test RLS policies with direct database queries
4. Validate file upload permissions
5. Check signed URL generation

## Performance Optimization

1. **Lazy Loading**: Load file URLs only when modal opens
2. **Caching**: Cache signed URLs for short periods
3. **Pagination**: Implement pagination for large submission lists
4. **Image Optimization**: Compress images before upload
5. **CDN**: Use Supabase CDN for faster file delivery
