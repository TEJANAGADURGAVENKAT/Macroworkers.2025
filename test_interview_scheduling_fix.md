# 🧪 Test Interview Scheduling Fix

## **Step 1: Run Database Fix**

Execute this SQL script in Supabase SQL Editor:

```sql
-- Run: complete_interview_scheduling_fix.sql
```

This will:
- ✅ Update workers who have all 5 documents approved to `interview_pending` status
- ✅ Update both `worker_status` and `status` columns
- ✅ Show before/after comparison

## **Step 2: Test the Interview Scheduling Page**

1. **Login as an employer**
2. **Go to Interview Scheduling page**
3. **Check if workers now appear**

## **Step 3: Check Browser Console**

Open browser console (F12) and look for:

**✅ Expected output:**
```
Loading workers for interview scheduling...
Found workers: [number] [array of workers]
All workers in database: [number] [array]
Worker status counts (worker_status): {interview_pending: X, verification_pending: Y, ...}
Status counts (status): {interview_pending: X, verification_pending: Y, ...}
```

## **Step 4: Verify Database State**

Run this query to check the current state:

```sql
SELECT 
  p.user_id,
  p.full_name,
  p.worker_status,
  p.status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.worker_status, p.status
ORDER BY p.created_at DESC;
```

## **Step 5: Test Complete Flow**

1. **Worker uploads documents** → Status: `document_upload_pending`
2. **Employer approves all documents** → Status: `interview_pending`
3. **Go to Interview Scheduling** → Worker should appear
4. **Schedule interview** → Should work normally

## **Expected Results**

After running the fix:

- ✅ Workers with all 5 documents approved should have `interview_pending` status
- ✅ They should appear in the Interview Scheduling page
- ✅ You should be able to schedule interviews for them
- ✅ Console should show the correct worker counts

## **If Still Not Working**

1. **Check RLS policies** - Make sure employers can read worker profiles
2. **Check Supabase logs** - Look for any errors
3. **Verify the query** - The updated query now checks both `worker_status` and `status` columns
4. **Check browser console** - Look for any JavaScript errors

The main issue was that the Interview Scheduling page was only checking `worker_status` but not the `status` column, and some workers had all documents approved but were still in `verification_pending` status.

