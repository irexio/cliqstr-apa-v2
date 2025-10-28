# Deprecation Log

## Removed Components (✅ Complete)
- `src/components/cliqs/AnnouncementsCarousel.tsx` - Replaced by AnnouncementRotator
- `src/components/cliqs/CliqAnnouncementsSection.tsx` - Replaced by AnnouncementRotator

## Tables to Clean Up
- **`events` table in Convex production** - UNUSED, DELETE via Convex dashboard
  - It exists in production but is not referenced in code
  - All calendar functionality uses `activities` table
  - Action: Delete manually from Convex dashboard to avoid future confusion

## Single Source of Truth ✅
- **Use `activities` table ONLY** for all calendar events
- All API routes correctly reference `api.activities.*`
- No separate `events` table in code

## Still Active (Required)
- `convex/activities.ts` - Core event management 
- `/api/activities/*` - API endpoints for event CRUD and RSVP
- `activities` table in Convex - Stores all calendar items

## To Implement Later
- Birthday generation in `/api/announcements/list` (currently framework only)
- Parent event approval UI (API exists at `/api/activities/approve`)

## Documentation Updates Needed
- Site copy: Change "events" → "activities" OR "calendar events" for consistency
- Internal docs: Clarify that "activities" = user-facing "events"
- Code comments: Already added clarifying note in schema.ts line 422-425

## Notes
- System terminology: "activities" in code = what users see as "events" in UI/docs
- Confirmed: No code duplication, single clean table
