# Auto-Redirect Worker to Interview Schedule Page Setup Guide

This guide will help you implement the auto-redirect functionality for workers when their documents are approved by employers.

## 🚀 **Quick Setup (3 Steps)**

### **Step 1: Run Database Scripts**

Execute these SQL scripts in your Supabase SQL Editor in order:

1. **Add Status Column:**
   ```sql
   -- Run: add_status_column_to_profiles.sql
   ```

2. **Update RLS Policies:**
   ```sql
   -- Run: update_rls_policies_for_auto_redirect.sql
   ```

### **Step 2: Deploy Code Changes**

The following files have been updated/created:
- ✅ `src/pages/worker/InterviewSchedule.tsx` - New interview schedule page
- ✅ `src/components/auth/InterviewStatusGuard.tsx` - Access control for interview page
- ✅ `src/pages/worker/WorkerDashboard.tsx` - Added realtime subscription & auto-redirect
- ✅ `src/pages/employer/EmployerDashboard.tsx` - Updated to trigger status changes
- ✅ `src/App.tsx` - Added protected route for `/interview-schedule`

### **Step 3: Test the Flow**

1. **Worker uploads documents** → Status: `document_upload_pending`
2. **Employer approves all documents** → Status: `interview_pending` (triggers realtime event)
3. **Worker gets realtime notification** → Shows toast + auto-redirects to `/interview-schedule`
4. **Worker sees interview schedule page** → Can view interview details

## 📋 **Detailed Implementation**

### **Database Schema Changes**

#### **New Status Column:**
```sql
ALTER TABLE profiles 
ADD COLUMN status TEXT DEFAULT 'document_upload_pending' 
CHECK (status IN ('document_upload_pending', 'verification_pending', 'interview_pending', 'interview_scheduled', 'accepted', 'rejected'));
```

#### **Status Flow:**
- `document_upload_pending` → Worker needs to upload documents
- `verification_pending` → Documents uploaded, waiting for employer approval
- `interview_pending` → All documents approved, ready for interview scheduling
- `interview_scheduled` → Interview has been scheduled
- `accepted` → Worker selected after interview
- `rejected` → Worker rejected after interview

### **Worker Side Features**

#### **Realtime Subscription:**
- Workers subscribe to their own profile changes
- Automatic detection when status changes to `interview_pending`
- Smooth toast notification with approval message
- Auto-redirect to interview schedule page after 2 seconds

#### **Interview Schedule Page:**
- Protected route accessible only to workers with appropriate status
- Shows interview details if scheduled
- Displays worker profile information
- Access control with helpful error messages

### **Employer Side Features**

#### **Document Approval:**
- When employer approves all documents for a worker
- Automatically updates both `worker_status` and `status` columns
- Triggers realtime event that worker receives
- Shows success toast to employer

#### **Manual Status Updates:**
- Employers can manually update worker status
- Updates both status columns for consistency
- Logs all status changes for audit trail

### **Security Features**

#### **Row Level Security (RLS):**
- Workers can only view their own profile
- Workers cannot modify their own status
- Employers can view and update worker profiles
- System functions can update profiles (for triggers)

#### **Access Control:**
- Interview schedule page protected by `InterviewStatusGuard`
- Different access levels based on worker status
- Helpful error messages for unauthorized access

## 🎯 **User Experience Flow**

### **For Workers:**

1. **Upload Documents** → Status: `document_upload_pending`
2. **Wait for Approval** → Status: `verification_pending`
3. **Documents Approved** → Real-time notification appears
4. **Auto-Redirect** → Smooth transition to interview schedule page
5. **View Interview Details** → See scheduled interview or wait for scheduling

### **For Employers:**

1. **Review Documents** → See worker documents in verification tab
2. **Approve Documents** → Click approve on each document
3. **All Documents Approved** → Worker status automatically updates
4. **Worker Gets Notified** → Real-time notification sent to worker
5. **Schedule Interview** → Use interview scheduling tab

## 🔧 **Technical Details**

### **Realtime Subscription:**
```typescript
const channel = supabase
  .channel('worker_profile_changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'profiles',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Handle status change
  })
  .subscribe();
```

### **Auto-Redirect Logic:**
```typescript
const handleStatusChangeToInterviewPending = () => {
  // Show toast notification
  toast({
    title: "Documents Approved! 🎉",
    description: "Your documents have been approved. Please proceed to schedule your interview.",
  });

  // Redirect after 2 seconds
  setTimeout(() => {
    navigate('/interview-schedule');
  }, 2000);
};
```

### **Status Update Trigger:**
```typescript
await supabase
  .from('profiles')
  .update({ 
    worker_status: 'interview_pending',
    status: 'interview_pending',
    updated_at: new Date().toISOString()
  })
  .eq('user_id', workerId);
```

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Worker not getting redirected:**
   - Check if realtime subscription is working
   - Verify status column was added to profiles table
   - Check browser console for errors

2. **Access denied on interview page:**
   - Verify worker status is `interview_pending` or higher
   - Check RLS policies are correctly applied
   - Ensure InterviewStatusGuard is working

3. **Employer can't update status:**
   - Check RLS policies for employer permissions
   - Verify employer role in profiles table
   - Check Supabase logs for errors

### **Debug Steps:**

1. **Check Database:**
   ```sql
   SELECT user_id, full_name, role, worker_status, status 
   FROM profiles 
   WHERE role = 'worker' 
   ORDER BY created_at DESC;
   ```

2. **Check Realtime:**
   - Open browser console
   - Look for "Profile status change received" messages
   - Verify subscription is active

3. **Check Status Updates:**
   - Monitor Supabase logs
   - Check if both `worker_status` and `status` are updated
   - Verify realtime events are triggered

## ✅ **Testing Checklist**

- [ ] Database scripts executed successfully
- [ ] Status column added to profiles table
- [ ] RLS policies applied correctly
- [ ] Worker can upload documents
- [ ] Employer can approve documents
- [ ] Worker gets realtime notification
- [ ] Worker auto-redirects to interview page
- [ ] Interview page shows correct information
- [ ] Access control works for unauthorized users
- [ ] Manual status updates work for employers

## 🎉 **Success!**

Once implemented, the system will provide a seamless experience where:
- Workers are automatically notified when their documents are approved
- They are smoothly redirected to the interview scheduling page
- Employers can easily manage the approval process
- All status changes are tracked and secured properly

The auto-redirect functionality creates a smooth, real-time workflow that keeps workers engaged and informed throughout the onboarding process.

