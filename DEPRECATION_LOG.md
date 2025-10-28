# Deprecation Log

## Overview
This document tracks deprecated code, removed files, and architectural decisions for future cleanup and reference.

## Completed Migrations

### ✅ Activities → Events Table Rename (COMPLETED)
- **Date**: October 28, 2025
- **Scope**: Renamed `activities` table to `events` throughout the codebase for professional terminology aligned with business plan
- **Changes**:
  - `convex/activities.ts` → `convex/events.ts` (all mutations/queries renamed: `createActivity` → `createEvent`, `deleteActivity` → `deleteEvent`, etc.)
  - `convex/schema.ts`: Renamed table definition from `activities` to `events`, migrated all indexes
  - Updated all API routes to call `api.events.*` instead of `api.activities.*`
  - Convex production deployment: Successfully migrated table and indexes
- **Files Modified**: 11 files
  - Renamed: `convex/activities.ts` → `convex/events.ts`
  - Updated: 8 API routes in `src/app/api/*`
  - Updated: `convex/schema.ts`
  - Auto-generated: `convex/_generated/api.d.ts`
- **Status**: ✅ **DEPLOYED TO CONVEX PRODUCTION**

### ✅ Old Activities/Events Components Removed (COMPLETED)
- **Date**: October 27, 2025
- **Removed Files**:
  - `src/components/cliqs/AnnouncementsCarousel.tsx` (old carousel implementation)
  - `src/components/cliqs/CliqAnnouncementsSection.tsx` (old announcement section)
- **Reason**: Replaced with new unified `AnnouncementRotator` component for cleaner architecture
- **Status**: ✅ **COMPLETE**

## Unused Database Artifacts

### ⚠️ Old `events` Table (In Convex Production Only)
- **Status**: UNUSED - should be manually deleted
- **Details**: An `events` table exists in Convex production (visible in dashboard) but is NOT defined in `convex/schema.ts` and NOT used by any application code
- **Why It Exists**: Was likely created during early development before `activities` was the standard
- **Action**: Must be manually deleted from Convex dashboard (tables cannot be deleted via schema changes)
- **Relation**: The `events` table name has now been adopted for the primary events system (previously `activities`)

## Active Components & Files

### Calendar/Events System
- `convex/events.ts` - Primary Convex file for event mutations/queries
- `src/app/api/activities/*` - API routes (named `activities` for backwards compatibility in routing, but call `api.events` internally)
- `src/app/api/announcements/list/route.ts` - Combines events, notices, birthdays
- `src/app/api/calendar/*` - Calendar export and debug endpoints
- `src/components/calendar/EventForm.tsx` - Event creation UI
- `src/components/calendar/EventCard.tsx` - Event detail display
- `src/app/calendar/page.tsx` - Main calendar page
- `src/components/cliqs/AnnouncementRotator.tsx` - Thin rotating announcement box

### Cliq Notices System
- `convex/cliqNotices.ts` - Cliq-specific admin notices
- `src/app/api/cliqs/[id]/notices` - Manage cliq notices

## Architecture Notes

### Single Source of Truth
- **Events Table**: `events` (formerly `activities`) is the single source of truth for all calendar items
- **Birthdays**: Generated dynamically via `getBirthdayEvents` query (not stored)
- **Notices**: Stored separately in `cliqNotices` table for admin announcements

### Frontend Architecture
- Announcement Rotator: Thin, black-bg box that rotates through events/notices/birthdays
- Calendar Page: Full calendar UI with RSVP buttons and delete functionality
- Event Creation: Form-based creation with support for recurring events
