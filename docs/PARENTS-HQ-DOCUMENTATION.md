# Parents HQ - Complete Documentation

**Last Updated: October 7, 2025**

## Overview

Parents HQ is the comprehensive parent management interface for Cliqstr, providing parents with tools to manage their children's accounts, monitor activity, and ensure safety compliance with APA (Age-Appropriate Design Code) requirements.

## 🎯 **UNIFIED ARCHITECTURE (Current Implementation)**

### **Single Entry Point: `/parents/hq`**
The Parents HQ now uses a **unified architecture** with a single entry point that intelligently switches between different modes based on context:

- **Setup Mode**: For child approval flows (invites, direct signups)
- **Manage Mode**: For ongoing child management by existing parents

### **Smart Router Integration**
All parent approval flows are routed through the **Smart Router** (`/parent-approval/smart`) which:
- Detects parent progress through the approval process
- Routes to appropriate steps (account creation, plan selection, child setup)
- Ensures consistent experience regardless of entry point

## Current Implementation Status

### ✅ Active Features (Production Ready)

#### 1. **Unified Parent Dashboard** ⭐ **NEW ARCHITECTURE**
- **Location**: `src/components/parents/ParentDashboard.tsx`
- **Purpose**: Single dashboard component that switches between setup and manage modes
- **Features**:
  - **Context-aware rendering**: Automatically switches between setup/manage modes
  - **Setup Mode**: Child approval flows with ChildSignupApprovalFlow
  - **Manage Mode**: Existing children management with permissions, monitoring, etc.
  - **Automatic mode transition**: Seamlessly switches to manage mode after child creation
  - **Consistent interface**: Same layout regardless of entry point

#### 2. **Child Permission Management**
- **Location**: `src/components/parents/ChildPermissionManager.tsx`
- **Purpose**: Granular control over child permissions
- **Features**:
  - Toggle individual permissions (can create cliqs, send invites, etc.)
  - Silent monitoring controls
  - AI moderation level settings
  - Real-time permission updates with audit logging

#### 3. **Live Silent Monitoring** ⭐ **NEW FEATURE**
- **Location**: `src/components/parents/LiveCliqMonitoring.tsx`
- **Purpose**: Real-time observation of child's cliq activity
- **Features**:
  - View live cliq feeds without child knowing
  - Read-only access (no posting/interacting)
  - Visual distinction of child's posts vs others
  - Real-time updates using Convex queries
  - Complete invisibility to children and other members

#### 4. **Activity Logs & Audit Trail**
- **Location**: `src/components/parents/ChildActivityLogs.tsx`
- **Purpose**: Historical activity monitoring
- **Features**:
  - View child's app usage history
  - Parent action audit logs
  - Detailed change tracking with before/after values
  - Configurable log limits (25, 50, 100 entries)

#### 5. **Multiple Parents Management**
- **Location**: `src/components/parents/MultipleParentsManager.tsx`
- **Purpose**: Manage multiple parents for same child
- **Features**:
  - Add/remove secondary parents
  - Role-based permissions (primary, secondary, guardian)
  - Email-based parent linking

#### 6. **Child Signup Approval Flow** ⭐ **UPDATED**
- **Location**: `src/components/parents/ChildSignupApprovalFlow.tsx`
- **Purpose**: Handle child account creation with parent approval (used in setup mode)
- **Features**:
  - Parent approval for child signups
  - Silent monitoring toggle during signup
  - Streamlined form (email above password, single password field)
  - Enhanced error handling with specific messages
  - **Callback integration**: Automatically switches to manage mode after successful child creation
  - **Unified token handling**: Standardized on `approvalToken` for all flows

## Database Schema

### Core Tables

#### `parentLinks`
- **Purpose**: Links parents to children
- **Key Fields**:
  - `parentId`: ID of parent user
  - `childId`: ID of child user
  - `email`: Parent's email address
  - `role`: parent role (primary, secondary, guardian)
  - `permissions`: granular permissions object

#### `parentAuditLogs`
- **Purpose**: Audit trail of parent actions
- **Key Fields**:
  - `parentId`: Who made the change
  - `childId`: Which child was affected
  - `action`: What action was taken
  - `oldValue`: Previous settings (JSON)
  - `newValue`: New settings (JSON)
  - `createdAt`: Timestamp

#### `userActivityLogs`
- **Purpose**: General user activity tracking
- **Key Fields**:
  - `userId`: User who performed action
  - `event`: Type of activity (login, post_created, etc.)
  - `detail`: Additional context
  - `createdAt`: Timestamp

#### `childSettings`
- **Purpose**: Child-specific permission settings
- **Key Fields**:
  - `profileId`: Links to child's profile
  - `canCreatePublicCliqs`: Permission to create public cliqs
  - `canJoinPublicCliqs`: Permission to join public cliqs
  - `isSilentlyMonitored`: Silent monitoring enabled
  - `aiModerationLevel`: AI moderation strictness
  - And many more granular permissions...

## API Endpoints

### Parent Management APIs

#### `POST /api/parent/settings/update`
- **Purpose**: Update child permissions
- **Authentication**: Requires parent session
- **Validation**: Verifies parent-child relationship
- **Audit**: Logs all changes to `parentAuditLogs`

#### `GET /api/parent/activity-logs`
- **Purpose**: Retrieve child activity logs
- **Parameters**: `childId`, `limit`
- **Returns**: Combined user activity and parent audit logs
- **Authentication**: Requires parent session

#### `POST /api/parent/children`
- **Purpose**: Create new child account
- **Authentication**: Requires parent session
- **Features**: Creates user, account, profile, and child settings

## Convex Functions

### Core Functions

#### `getChildCliqsForParentMonitoring`
- **File**: `convex/cliqs.ts`
- **Purpose**: Get cliqs where child is a member for monitoring
- **Security**: Verifies parent-child relationship

#### `getPostsForParentMonitoring`
- **File**: `convex/posts.ts`
- **Purpose**: Get cliq posts for parent monitoring (bypasses membership checks)
- **Security**: Verifies parent-child relationship and child's cliq membership

#### `logParentAction`
- **File**: `convex/users.ts`
- **Purpose**: Log parent actions for audit trail
- **Usage**: Called automatically when parents change child settings

#### `getChildActivityLogs`
- **File**: `convex/users.ts`
- **Purpose**: Retrieve child's activity logs
- **Returns**: User activity logs for specific child

#### `getParentAuditLogs`
- **File**: `convex/users.ts`
- **Purpose**: Retrieve parent audit logs for specific child
- **Returns**: All parent actions affecting the child

## User Flows

### 1. **Unified Parent HQ Access** ⭐ **NEW FLOW**
```
1. Parent accesses /parents/hq (any entry point)
2. System determines context:
   - Has approvalToken/inviteCode → Setup Mode
   - No token → Manage Mode
3. ParentDashboard renders appropriate mode:
   - Setup Mode: ChildSignupApprovalFlow for child approval
   - Manage Mode: Full management interface with children dropdown
4. After child creation: Automatic transition to Manage Mode
```

### 2. **Smart Router Flow** ⭐ **NEW ARCHITECTURE**
```
1. Parent clicks email link → Smart Router (/parent-approval/smart)
2. Smart Router detects progress:
   - No parent account → /parent-approval (account creation)
   - No plan → /choose-plan (plan selection)
   - Ready for child setup → /parents/hq?approvalToken=xxx (setup mode)
3. All flows eventually lead to unified /parents/hq
```

### 3. **Child Signup with Parent Approval** ⭐ **UPDATED**
```
1. Child attempts to sign up
2. System detects child age → Redirect to parent approval
3. Parent receives approval request
4. Parent clicks email link → Smart Router
5. Smart Router → /parents/hq?approvalToken=xxx (setup mode)
6. Parent fills out ChildSignupApprovalFlow form
7. System creates child account with parent settings
8. Automatic transition to Manage Mode
9. Child account is ready for use
```

### 4. **Live Silent Monitoring**
```
1. Parent selects child in Parents HQ
2. Parent clicks "Live Cliq Monitoring"
3. System shows child's cliqs
4. Parent selects cliq to monitor
5. Real-time feed displays (read-only)
6. Child's posts highlighted in blue
7. Updates automatically via Convex real-time queries
```

### 5. **Permission Management**
```
1. Parent selects child
2. Parent modifies permissions in ChildPermissionManager
3. System calls updateChildSettings mutation
4. Changes logged to parentAuditLogs
5. Child's permissions updated immediately
6. Activity logged for audit trail
```

## Security & Privacy

### Parent-Child Relationship Verification
- All parent actions verify parent-child relationship via `parentLinks` table
- No parent can access another parent's child data
- All API endpoints require valid parent session

### Silent Monitoring Privacy
- **Complete Invisibility**: Children cannot see monitoring interface
- **No Notifications**: No alerts or indicators to child
- **Read-Only Access**: Parents cannot post or interact in child's cliqs
- **Real-Time Updates**: Uses Convex subscriptions for live data

### Audit Trail
- **All Parent Actions Logged**: Every permission change is recorded
- **Before/After Values**: Complete change history stored
- **Timestamp Tracking**: All actions timestamped
- **Parent Identification**: Always know which parent made changes

## File Structure

### Active Components
```
src/components/parents/
├── ParentDashboard.tsx              # ⭐ UNIFIED dashboard (setup/manage modes)
├── ChildPermissionManager.tsx       # Permission controls
├── LiveCliqMonitoring.tsx          # Live monitoring
├── ChildActivityLogs.tsx           # Activity history
├── MultipleParentsManager.tsx      # Multi-parent management
├── ChildSignupApprovalFlow.tsx     # Child signup approval (setup mode)
└── PendingApprovalsSection.tsx     # Pending approvals display
```

### API Routes
```
src/app/api/parent/
├── settings/update/route.ts        # Update child settings
├── activity-logs/route.ts          # Get activity logs
├── children/route.ts               # Create child accounts (unified)
└── pending-approvals/route.ts      # Get pending approvals
```

### Smart Router & Entry Points
```
src/app/
├── parents/hq/page.tsx             # ⭐ UNIFIED entry point
├── parent-approval/smart/page.tsx  # ⭐ Smart router
├── parent-approval/page.tsx        # Parent account creation
└── choose-plan/page.tsx            # Plan selection
```

### Convex Functions
```
convex/
├── users.ts                        # User management & audit logging
├── cliqs.ts                        # Cliq management & monitoring
├── posts.ts                        # Post management & monitoring
└── parentLinks.ts                  # Parent-child relationships
```

## 🧹 **CLEANUP COMPLETED (October 7, 2025)**

### ✅ **Removed Deprecated Files**
The following files have been **permanently removed** during the unified architecture cleanup:

```
❌ DELETED:
├── src/app/parents/hq/dashboard/page.tsx     # Replaced by unified /parents/hq
├── src/components/parents/ParentsHQContent.tsx # Merged into ParentDashboard
├── src/components/parents/ParentsHQWithSignup.tsx # Legacy pre-session version
└── docs/PARENTS-HQ-WIZARD.md                # Obsolete multi-step wizard docs
```

### ✅ **Updated Route References**
All references to `/parents/hq/dashboard` have been updated to use the unified `/parents/hq` route:

```
✅ UPDATED:
├── src/lib/auth/sendParentEmail.ts
├── src/components/Header/UserDropdown.tsx
├── src/app/invite/accept/_client.tsx
├── src/app/sign-in/sign-in-form.tsx
├── src/app/parent-approval/_client.tsx
├── src/app/choose-plan/choose-plan-form.tsx
└── src/app/api/parent-approval/accept/route.ts
```

### ✅ **Build Verification**
- `npm run build` passes successfully
- No import or module errors
- All deprecated components removed
- Unified `/parents/hq` remains only functional entry point

## Configuration

### Environment Variables
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `CONVEX_DEPLOYMENT`: Convex deployment name
- Various email and authentication settings

### Session Configuration
- **File**: `src/lib/auth/session-config.ts`
- **Purpose**: Iron-session configuration for parent authentication
- **Security**: Encrypted session cookies with secure settings

## Testing & Development

### Test Files
```
tests/
├── auth/signup-flows.spec.ts       # Authentication flow tests
├── invites/                        # Invite flow tests
└── edge-cases/                     # Edge case testing
```

### Development Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm test`: Run test suite

## Future Enhancements

### Planned Features
1. **SMS Notifications**: Twilio integration for Red Alerts
2. **Advanced Analytics**: Detailed activity reports
3. **Bulk Operations**: Manage multiple children at once
4. **Time-based Controls**: Schedule-based permission changes
5. **Geofencing**: Location-based safety controls

### Technical Improvements
1. **Performance Optimization**: Caching for large activity logs
2. **Real-time Notifications**: WebSocket-based parent alerts
3. **Mobile App**: Native mobile interface for parents
4. **API Rate Limiting**: Enhanced security measures

## Troubleshooting

### Common Issues

#### "Not authorized to monitor this child"
- **Cause**: Parent-child relationship not established
- **Solution**: Verify `parentLinks` table has correct relationship

#### "Child is not a member of this cliq"
- **Cause**: Child not actually in the selected cliq
- **Solution**: Check `memberships` table for child's cliq memberships

#### Activity logs not showing
- **Cause**: No activity logged yet or database issues
- **Solution**: Check `userActivityLogs` table and ensure logging is working

### Debug Commands
```bash
# Check parent-child relationships
npx convex run users:getParentLinksForChild --childId "child_user_id"

# View activity logs
npx convex run users:getChildActivityLogs --childId "child_user_id"

# Check child settings
npx convex run users:getChildSettings --profileId "profile_id"
```

## Monitoring Instructions

### How to Use Live Silent Monitoring

#### **Step 1: Access Parents HQ**
1. Log in to your parent account
2. Navigate to **Parents HQ** (usually from account menu or direct link)
3. You'll see a list of all your children

#### **Step 2: Select a Child**
1. Choose the child you want to monitor from the dropdown
2. The system will load all management options for that child
3. Scroll down to find the **"Live Cliq Monitoring"** section

#### **Step 3: Choose a Cliq to Monitor**
1. In the Live Cliq Monitoring section, you'll see a dropdown with all cliqs your child has joined
2. Select the cliq you want to monitor
3. The monitoring will activate automatically (you'll see a green "Monitoring Active" indicator)

#### **Step 4: View Live Activity**
1. The live feed will display all posts and replies in real-time
2. **Your child's posts and replies are highlighted in blue** for easy identification
3. You can see:
   - All posts in the cliq
   - All replies to posts
   - Who posted what and when
   - Images shared in posts
   - Real-time updates as new content appears

#### **Step 5: Understanding the Interface**
- **Blue highlighted posts**: Your child's content
- **White posts**: Other members' content
- **Timestamps**: When each post/reply was made
- **Author names**: Who posted each item
- **Reply counts**: How many replies each post has
- **Real-time updates**: New content appears automatically

### **Important Monitoring Guidelines**

#### **What You CAN Do:**
✅ **View all posts and replies** in your child's cliqs  
✅ **See who is posting** and when  
✅ **Monitor in real-time** with automatic updates  
✅ **Switch between different cliqs** your child has joined  
✅ **View historical activity** through Activity Logs  
✅ **Change monitoring settings** through Child Permission Manager  

#### **What You CANNOT Do:**
❌ **Post or reply** in your child's cliqs  
❌ **Interact with other members**  
❌ **Like or react** to posts  
❌ **Send messages** to anyone  
❌ **Join or leave** cliqs on behalf of your child  

#### **Privacy & Invisibility:**
🔒 **Your child cannot see** that you're monitoring  
🔒 **Other cliq members cannot see** that you're monitoring  
🔒 **No notifications are sent** to anyone about your monitoring  
🔒 **No indicators appear** in the child's interface  
🔒 **Complete invisibility** - monitoring is completely silent  

### **Activity Logs vs Live Monitoring**

#### **Activity Logs** (Historical)
- **Purpose**: View past activity and actions
- **Location**: "Activity Logs" section in Parents HQ
- **Content**: Login/logout events, posts created, cliq joins, etc.
- **Updates**: Historical data, not real-time
- **Best for**: Reviewing what happened in the past

#### **Live Monitoring** (Real-time)
- **Purpose**: Watch activity as it happens
- **Location**: "Live Cliq Monitoring" section in Parents HQ
- **Content**: Live posts, replies, and interactions
- **Updates**: Real-time via Convex subscriptions
- **Best for**: Watching current activity and conversations

### **Troubleshooting Monitoring Issues**

#### **"No cliqs found for [child name]"**
- **Cause**: Your child hasn't joined any cliqs yet
- **Solution**: Wait for your child to join cliqs, or help them create/join cliqs

#### **"Select a cliq to monitor" but dropdown is empty**
- **Cause**: Your child is not a member of any cliqs
- **Solution**: Check if your child has successfully joined cliqs

#### **Live feed shows "No posts in this cliq yet"**
- **Cause**: The cliq exists but no one has posted yet
- **Solution**: Wait for members to start posting, or check if the cliq is active

#### **Posts not updating in real-time**
- **Cause**: Network connectivity or Convex connection issues
- **Solution**: Refresh the page or check your internet connection

#### **"Not authorized to monitor this child"**
- **Cause**: Parent-child relationship not properly established
- **Solution**: Contact support - this indicates a system configuration issue

### **Best Practices for Monitoring**

#### **When to Monitor:**
- **New cliqs**: Monitor when your child joins new cliqs
- **Concerning behavior**: If you notice changes in your child's behavior
- **Safety concerns**: If you have specific safety concerns
- **Regular check-ins**: Periodic monitoring to stay informed

#### **How Often to Monitor:**
- **Daily**: For younger children or new users
- **Weekly**: For established users with good behavior
- **As needed**: Based on your child's age and maturity level
- **During concerns**: More frequent monitoring when issues arise

#### **What to Look For:**
- **Inappropriate content**: Posts or replies that concern you
- **Unknown contacts**: People you don't recognize
- **Behavioral changes**: Changes in posting patterns or content
- **Safety issues**: Any content that raises safety concerns

#### **What to Do If You Find Concerns:**
1. **Document the concern**: Take screenshots or note details
2. **Use Red Alert**: If there's immediate safety concern, use the Red Alert system
3. **Adjust permissions**: Use Child Permission Manager to restrict access if needed
4. **Contact other parents**: If multiple children are involved
5. **Report to Cliqstr**: Contact support for serious issues

### **Monitoring Settings & Permissions**

#### **Silent Monitoring Toggle**
- **Location**: Child Permission Manager → Silent Monitoring
- **Purpose**: Enable/disable silent monitoring for your child
- **Default**: Usually enabled during child signup
- **Effect**: Controls whether you can monitor your child's activity

#### **Permission Controls**
- **Location**: Child Permission Manager
- **Purpose**: Control what your child can do
- **Related to monitoring**: Some permissions affect what you can monitor
- **Example**: If child can't create cliqs, you won't see cliq creation in monitoring

### **Technical Details for Advanced Users**

#### **Real-time Updates**
- **Technology**: Convex real-time subscriptions
- **Update frequency**: Instant (as soon as new content is posted)
- **Network usage**: Minimal - only new content is transmitted
- **Offline behavior**: Updates resume when connection is restored

#### **Data Storage**
- **Posts**: Stored in `posts` table
- **Replies**: Stored in `replies` table
- **Activity logs**: Stored in `userActivityLogs` table
- **Audit logs**: Stored in `parentAuditLogs` table

#### **Security**
- **Authentication**: Requires valid parent session
- **Authorization**: Verifies parent-child relationship
- **Data access**: Only parents can monitor their own children
- **Privacy**: No data shared with third parties

## Support & Maintenance

### Regular Maintenance
1. **Audit Log Cleanup**: Periodically archive old audit logs
2. **Activity Log Rotation**: Manage activity log storage
3. **Permission Review**: Regular review of child permissions
4. **Security Updates**: Keep dependencies updated

### System Monitoring
- **Error Tracking**: Monitor for parent access errors
- **Performance**: Track query performance for large activity logs
- **Usage Analytics**: Monitor parent engagement with features
- **Real-time Connection Health**: Monitor Convex subscription stability

---

## Summary

Parents HQ is a comprehensive, secure, and privacy-focused system that allows parents to manage their children's Cliqstr experience while maintaining complete transparency and control. The system includes real-time monitoring, detailed audit trails, and granular permission controls, all while ensuring children's privacy and safety.

### **🎯 Key Architectural Improvements (October 7, 2025)**

1. **Unified Entry Point**: Single `/parents/hq` route handles all parent functionality
2. **Context-Aware Dashboard**: Automatically switches between setup and manage modes
3. **Smart Router Integration**: Intelligent routing based on parent progress
4. **Simplified Codebase**: Removed duplicate logic and deprecated components
5. **Consistent User Experience**: Same interface regardless of entry point

### **✅ Current Status**
- **Production Ready**: Fully functional and actively used
- **Clean Architecture**: No deprecated or legacy components
- **Build Verified**: Passes all tests and builds successfully
- **Future-Proof**: Extensible design for new features

The unified implementation eliminates confusion, reduces maintenance overhead, and provides a stable foundation for future enhancements.
