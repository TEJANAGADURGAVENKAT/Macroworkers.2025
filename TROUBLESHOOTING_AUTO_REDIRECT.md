# 🔧 Auto-Redirect Troubleshooting Guide

## 🚨 **Issue: Worker not getting redirected when employer approves documents**

### **Step 1: Run Database Fix Script**

First, run this comprehensive fix script in Supabase SQL Editor:

```sql
-- Run: fix_auto_redirect_issues.sql
```

This will:
- ✅ Add the `status` column if missing
- ✅ Update existing worker statuses
- ✅ Set up proper RLS policies
- ✅ Create necessary indexes
- ✅ Grant proper permissions

### **Step 2: Test the Setup**

1. **Go to the test page:** `http://localhost:3000/debug/test-redirect`
2. **Enter a worker's user ID** (or click "Use Current User")
3. **Click "Update Status to interview_pending"**
4. **Check if the worker gets redirected**

### **Step 3: Check Browser Console**

Open browser console (F12) and look for these messages:

**✅ Good messages:**
```
Setting up realtime subscription for user: [user-id]
Realtime subscription status: SUBSCRIBED
Profile status change received: [payload]
Worker status changed to interview_pending, redirecting...
```

**❌ Problem messages:**
```
Realtime subscription status: CHANNEL_ERROR
Error checking status: [error]
```

### **Step 4: Manual Testing Steps**

1. **Login as a worker**
2. **Open browser console (F12)**
3. **Go to employer dashboard**
4. **Approve all documents for that worker**
5. **Watch console for realtime messages**
6. **Check if redirect happens**

### **Step 5: Debug Database State**

Run this query in Supabase to check worker status:

```sql
SELECT 
  user_id,
  full_name,
  worker_status,
  status,
  COUNT(wd.id) as total_docs,
  COUNT(CASE WHEN wd.verification_status = 'approved' THEN 1 END) as approved_docs
FROM profiles p
LEFT JOIN worker_documents wd ON p.user_id = wd.worker_id
WHERE p.role = 'worker'
GROUP BY p.user_id, p.full_name, p.worker_status, p.status
ORDER BY p.created_at DESC;
```

### **Step 6: Common Issues & Solutions**

#### **Issue 1: Status column doesn't exist**
**Solution:** Run `fix_auto_redirect_issues.sql`

#### **Issue 2: Realtime subscription not working**
**Solution:** 
- Check if RLS policies are correct
- Verify Supabase realtime is enabled
- Check browser console for errors

#### **Issue 3: Worker status not updating**
**Solution:**
- Check if employer approval function updates both `worker_status` and `status`
- Verify the approval logic in `EmployerDashboard.tsx`

#### **Issue 4: Redirect not happening**
**Solution:**
- Check if `handleStatusChangeToInterviewPending` is being called
- Verify the redirect logic in `WorkerDashboard.tsx`
- Check if the worker is on the correct page

### **Step 7: Force Test the Redirect**

1. **Login as a worker**
2. **Go to:** `http://localhost:3000/debug/test-redirect`
3. **Click "Use Current User"**
4. **Click "Update Status to interview_pending"**
5. **Should see redirect toast and be redirected**

### **Step 8: Check Network Tab**

1. **Open browser DevTools**
2. **Go to Network tab**
3. **Approve documents as employer**
4. **Look for:**
   - `profiles` table updates
   - Realtime WebSocket connections
   - Any failed requests

### **Step 9: Verify RLS Policies**

Run this query to check RLS policies:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

### **Step 10: Test Complete Flow**

1. **Worker uploads documents** → Status: `document_upload_pending`
2. **Employer approves all documents** → Status: `interview_pending`
3. **Worker gets realtime notification** → Console shows status change
4. **Worker sees redirect toast** → "Documents Approved! 🎉"
5. **Worker gets redirected** → Goes to `/interview-schedule`

## 🎯 **Expected Behavior**

When everything works correctly:

1. **Employer approves documents** → Database updates both `worker_status` and `status` to `interview_pending`
2. **Realtime event fires** → Worker's browser receives the update
3. **Console shows messages** → "Profile status change received" and "Worker status changed to interview_pending"
4. **Toast appears** → "Documents Approved! 🎉" message
5. **Redirect happens** → After 2 seconds, worker goes to `/interview-schedule`

## 🚀 **Quick Fix Commands**

If you're still having issues, try these in order:

1. **Run database fix:**
   ```sql
   -- Run: fix_auto_redirect_issues.sql
   ```

2. **Test manually:**
   - Go to `/debug/test-redirect`
   - Update worker status manually
   - Check if redirect works

3. **Check console:**
   - Look for error messages
   - Verify realtime subscription status

4. **Restart the app:**
   - Stop the development server
   - Run `npm start` again
   - Test the flow

## 📞 **Still Not Working?**

If the issue persists:

1. **Share the console output** from the browser
2. **Share the database query results** from Step 5
3. **Check if Supabase realtime is enabled** in your project settings
4. **Verify the worker is logged in** and on the correct page

The most common issue is that the database scripts weren't run properly, so make sure to run `fix_auto_redirect_issues.sql` first!

