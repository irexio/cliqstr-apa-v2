# Announcements Feature Documentation

## Overview

The announcements system allows **cliq owners** to post announcements visible only within their cliq, and **superadmins** to post global announcements visible to all cliqs. Announcements share the same carousel (black bar) with events and birthdays.

## Key Features

- ✅ **Global Announcements** - Superadmin only, visible to all cliqs
- ✅ **Cliq Announcements** - Cliq owner only, visible within their cliq
- ✅ **Auto-Expiration** - Announcements auto-expire after 14 days unless pinned
- ✅ **Unified Carousel** - Announcements, events, and birthdays display together
- ✅ **Permission Validation** - Server-side validation in Convex mutations
- ✅ **No Feed Posting** - Announcements stay in carousel only (unlike events)

## Database Schema

### `announcements` Table

```typescript
{
  _id: Id<"announcements">;
  title: string;                    // Announcement title
  message: string;                  // Announcement body
  cliqId?: Id<"cliqs">;             // null for global, cliq ID for cliq announcements
  createdByUserId: Id<"users">;     // User who created this announcement
  createdAt: number;                // Unix timestamp
  pinned: boolean;                  // If true, doesn't auto-expire
  expiresAt?: number;               // Auto-expiration timestamp (undefined if pinned)
  visibility: "global" | "cliq";    // Scope of announcement
}
```

### Indexes

```typescript
.index("by_visibility", ["visibility"])
.index("by_cliq_visibility", ["cliqId", "visibility"])
.index("by_created_at", ["createdAt"])
.index("by_expires_at", ["expiresAt"])
```

## Convex Functions

### Mutations

#### `createAnnouncement`

Creates a new announcement with permission validation.

**Permissions:**
- **Global** (visibility = "global"): Only superadmin (checked via `SUPERADMIN_EMAIL` env var)
- **Cliq** (visibility = "cliq"): Only cliq owner

**Args:**
```typescript
{
  title: string;                         // Required
  message: string;                       // Required
  cliqId?: Id<"cliqs">;                  // Required if visibility = "cliq"
  pinned: boolean;                       // Default: false
  visibility: "global" | "cliq";         // Required
}
```

**Returns:** `Id<"announcements">` - The created announcement ID

**Errors:**
- "Unauthorized" - User not authenticated
- "Only superadmin can create global announcements" - Non-superadmin attempting global
- "Only cliq owner can create announcements for this cliq" - Non-owner attempting cliq
- "cliqId is required for cliq announcements" - Missing cliqId for cliq visibility

**Auto-Expiration:**
- If `pinned: false`, sets `expiresAt = now + 14 days`
- If `pinned: true`, sets `expiresAt = undefined`

---

#### `deleteAnnouncement`

Deletes an announcement.

**Permissions:**
- Creator of the announcement
- OR superadmin

**Args:**
```typescript
{
  id: Id<"announcements">;  // Required
}
```

**Returns:**
```typescript
{ success: true }
```

**Errors:**
- "Unauthorized" - User not authenticated
- "Announcement not found" - Invalid announcement ID
- "Only creator or superadmin can delete this announcement" - Insufficient permissions

---

#### `updateAnnouncement`

Updates an announcement (title, message, pinned status only).

**Permissions:**
- Creator of the announcement
- OR superadmin

**Args:**
```typescript
{
  id: Id<"announcements">;  // Required
  title: string;             // Required
  message: string;           // Required
  pinned: boolean;           // Required
}
```

**Note:** Visibility and cliqId cannot be changed. To change visibility, delete and recreate.

**Returns:** `Id<"announcements">` - The updated announcement ID

**Auto-Expiration Recalculation:**
- If `pinned: true`, sets `expiresAt = undefined`
- If `pinned: false`, recalculates `expiresAt = now + 14 days`

**Errors:**
- "Unauthorized" - User not authenticated
- "Announcement not found" - Invalid announcement ID
- "Only creator or superadmin can update this announcement" - Insufficient permissions

---

### Queries

#### `listActiveAnnouncements`

Lists all active (non-expired or pinned) announcements for a cliq.

**Args:**
```typescript
{
  cliqId?: Id<"cliqs">;  // Optional; if provided, includes cliq-specific announcements
}
```

**Returns:** Array of announcements sorted by `createdAt` descending (newest first)

**Behavior:**
- Always includes global announcements (visibility = "global")
- If `cliqId` provided, also includes cliq announcements for that cliq (visibility = "cliq" AND cliqId matches)
- Filters out expired announcements (expiresAt < now) unless pinned
- Returns empty array if no active announcements

**Sorting:** Newest first (`createdAt` descending)

---

#### `getAnnouncement`

Fetches a single announcement by ID.

**Args:**
```typescript
{
  id: Id<"announcements">;  // Required
}
```

**Returns:** Single announcement object

**Errors:**
- "Announcement not found" - Invalid announcement ID

---

#### `listAllByCliq`

Lists all announcements for a specific cliq, regardless of visibility.

**Args:**
```typescript
{
  cliqId: Id<"cliqs">;  // Required
}
```

**Returns:** Array of announcements sorted by `createdAt` descending (newest first)

**Behavior:**
- Includes all announcements for the specified cliq
- No filtering by visibility or expiration
- Returns empty array if no announcements

**Sorting:** Newest first (`createdAt` descending)

---

#### `listGlobalAnnouncements`

Lists all global announcements.

**Args:**
```typescript
{}
```

**Returns:** Array of announcements sorted by `createdAt` descending (newest first)

**Behavior:**
- Includes only global announcements
- No filtering by cliq or visibility
- Returns empty array if no global announcements

**Sorting:** Newest first (`createdAt` descending)

---

## API Routes

### `POST /api/announcements/create`

Creates a new announcement via HTTP.

**Request Body:**
```typescript
{
  title: string;                      // Required
  message: string;                    // Required
  visibility: "global" | "cliq";      // Required
  cliqId?: string;                    // Required if visibility = "cliq"
  pinned?: boolean;                   // Default: false
}
```

**Response (Success - 200):**
```typescript
{
  success: true,
  announcementId: string;
}
```

**Response (Error):**
```typescript
// 400 Bad Request
{ error: "Title and message are required" }
{ error: "Invalid visibility" }
{ error: "cliqId is required for cliq announcements" }

// 401 Unauthorized
{ error: "Unauthorized" }

// 403 Forbidden
{ error: "You do not have permission to create this announcement" }

// 500 Server Error
{ error: "Failed to create announcement" }
```

---

### `POST /api/announcements/delete`

Deletes an announcement via HTTP.

**Request Body:**
```typescript
{
  announcementId: string;  // Required
}
```

**Response (Success - 200):**
```typescript
{ success: true }
```

**Response (Error):**
```typescript
// 400 Bad Request
{ error: "announcementId is required" }

// 401 Unauthorized
{ error: "Unauthorized" }

// 403 Forbidden
{ error: "You do not have permission to delete this announcement" }

// 500 Server Error
{ error: "Failed to delete announcement" }
```

---

### `POST /api/announcements/update`

Updates an announcement via HTTP.

**Request Body:**
```typescript
{
  announcementId: string;  // Required
  title: string;           // Required
  message: string;         // Required
  pinned: boolean;         // Required
}
```

**Response (Success - 200):**
```typescript
{
  success: true,
  announcementId: string;
}
```

**Response (Error):**
```typescript
// 400 Bad Request
{ error: "announcementId is required" }
{ error: "Title and message are required" }
{ error: "pinned must be a boolean" }

// 401 Unauthorized
{ error: "Unauthorized" }

// 403 Forbidden
{ error: "You do not have permission to edit this announcement" }

// 404 Not Found
{ error: "Announcement not found" }

// 500 Server Error
{ error: "Failed to update announcement" }
```

---

### `GET /api/announcements/list`

Fetches all active announcements for a cliq, merged with events and birthdays.

**Query Parameters:**
```typescript
{
  cliqId: string;  // Required
}
```

**Response (Success - 200):**
```typescript
{
  announcements: Array<{
    id: string;
    type: "announcement" | "event" | "notice" | "birthday";
    title: string;
    description: string;
    timestamp: number;          // Unix timestamp
    clickTarget?: string;       // URL (for events)
    isGlobal?: boolean;         // true if global announcement
  }>
}
```

**Sorting:**
1. Global announcements first
2. Then by timestamp (newest first)

**Response (Error):**
```typescript
// 400 Bad Request
{ error: "cliqId is required" }

// 401 Unauthorized
{ error: "Unauthorized" }

// 500 Server Error
{ error: "Failed to fetch announcements" }
```

---

## Frontend Components

### `AnnouncementForm`

Modal component for creating and editing announcements.

**Props:**
```typescript
interface AnnouncementFormProps {
  cliqId?: string;           // Current cliq ID
  cliqName?: string;         // Current cliq name (for display)
  isSuperadmin?: boolean;    // If true, shows global/cliq radio buttons
  onSubmit: (data: AnnouncementFormData) => Promise<void>;
  onClose: () => void;
  loading?: boolean;         // Disable form while loading
  initialData?: AnnouncementFormData & { _id: string };  // For edit mode
  isEditMode?: boolean;      // If true, shows "Edit" header
}

interface AnnouncementFormData {
  title: string;
  message: string;
  visibility: "global" | "cliq";
  cliqId?: string;
  pinned: boolean;
}
```

**Features:**
- ✅ Title and message fields (both required)
- ✅ Character counter for message (500 char limit)
- ✅ Visibility selector (radio buttons, only for superadmin)
- ✅ Pin checkbox (prevents 14-day auto-expiration)
- ✅ Form validation with toast notifications
- ✅ Create/Edit mode toggle
- ✅ Cancel/Submit buttons
- ✅ Disabled state during submission

**Usage Example:**

```typescript
const [showForm, setShowForm] = useState(false);

const handleCreateAnnouncement = async (data: AnnouncementFormData) => {
  const response = await fetch('/api/announcements/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error('Failed to create');
  return response.json();
};

return (
  <>
    <button onClick={() => setShowForm(true)}>
      Create Announcement
    </button>
    
    {showForm && (
      <AnnouncementForm
        cliqId="cliq_123"
        cliqName="My Cliq"
        isSuperadmin={false}
        onSubmit={handleCreateAnnouncement}
        onClose={() => setShowForm(false)}
      />
    )}
  </>
);
```

---

## Edit Workflow

### AnnouncementCard Edit Button

Clicking the Edit button (pencil icon) on an announcement card:

1. Opens `AnnouncementForm` in edit mode
2. Pre-fills all fields (title, message, pinned status)
3. Hides visibility selector (cannot change)
4. Shows "Save Changes" button instead of "Create"
5. On submit: calls `/api/announcements/update`
6. Success: closes form and reloads announcements
7. Error: shows toast and stays in form

**Edit Button Visibility:**
- Only visible to announcement creator
- Also visible to superadmin (can edit any announcement)
- Not visible to other cliq members

---

## Environment Configuration

### Required Environment Variables

**For Superadmin Detection:**

Set `SUPERADMIN_EMAIL` in your Convex deployment:

```bash
# In Vercel/Convex dashboard
SUPERADMIN_EMAIL=admin@cliqstr.com
```

The Convex function will check if `user.email === process.env.SUPERADMIN_EMAIL` to determine superadmin status.

---

## Data Flow Diagram

```
User (Cliq Owner or Superadmin)
    ↓
AnnouncementForm (UI)
    ↓
POST /api/announcements/create
    ↓
Convex: createAnnouncement mutation
    ├─ Check: isSuperadmin() for global
    ├─ Check: isCliqOwner() for cliq
    └─ Insert to announcements table
    ↓
Returned to UI
    ↓
AnnouncementRotator fetches /api/announcements/list
    ├─ Calls Convex: listActiveAnnouncements
    ├─ Calls Convex: listByCliq (events)
    ├─ Calls Convex: getNoticesByCliq (legacy)
    └─ Merges all into single carousel
    ↓
Display in black announcement bar
```

---

## Testing Checklist

### Permission Tests

- [ ] Non-superadmin cannot create global announcements (403 error)
- [ ] Cliq owner can create cliq announcements for their cliq
- [ ] Non-owner cannot create announcements for another cliq (403 error)
- [ ] Only creator or superadmin can delete announcements
- [ ] Non-creator, non-admin delete attempt returns 403

### Expiration Tests

- [ ] Unpinned announcement expires after 14 days
- [ ] Pinned announcement does not expire
- [ ] Expired announcements don't appear in listActiveAnnouncements

### UI Tests

- [ ] Form validates required fields (title, message)
- [ ] Global/cliq radio buttons only show for superadmin
- [ ] Pin checkbox prevents expiration
- [ ] Create/Edit mode correctly displays
- [ ] Cancel button closes form without saving
- [ ] Success toast shows after creation
- [ ] Error toast shows on failure

### Integration Tests

- [ ] Announcements appear in carousel (AnnouncementRotator)
- [ ] Global announcements appear in all cliqs
- [ ] Cliq announcements appear only in their cliq
- [ ] Announcements, events, birthdays merge correctly
- [ ] Oldest announcements are shown first in carousel (after global)

---

## Migration Notes

- **Legacy cliqNotices** still supported for backwards compatibility
- **Announcements** are the new standard way to post cliq messages
- **Events** remain in calendar and carousel (not affected by announcements)
- **Birthdays** still fetch from myProfiles birthdayMonthDay

---

## Future Enhancements

- [ ] Edit existing announcements (updateAnnouncement mutation)
- [ ] Announcement categories/tags
- [ ] Scheduled announcements (postAt time)
- [ ] Announcement read receipts
- [ ] Admin dashboard to view all announcements
- [ ] Announcement templates
