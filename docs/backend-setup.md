# Backend and Production Feature Setup

## 1. Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. In Authentication settings, enable:
   - Anonymous sign-ins
4. In Expo app env, set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

If env vars are missing, the app falls back to local mock mode.

## 2. Event Moderation Pipeline

- Upload form submits event drafts.
- App-side moderation rules classify each submission:
  - `accepted`
  - `review`
  - `rejected`
- Moderation status is stored on the `events` table.
- Feed/Map/Explore only show `accepted` events.
- Upload tab shows submission queue and allows manual status changes.

## 3. Flyer Tagging (Bands/People/Venues/Promoters)

- Upload flow supports tap-to-place tags directly on the flyer image.
- Tag payload stores:
  - entity name
  - kind (`band`, `person`, `promoter`, `venue`, `collective`)
  - public/private setting
  - x/y normalized coordinates on the flyer
- Supabase tables:
  - `entities`
  - `event_entities`
- Public tags can be opened from event detail and route to an entity profile page.
- Entity profile page includes:
  - flyers uploaded by that entity (where possible)
  - flyers where that entity is tagged/involved
- Promoter + venue tags are auto-public to keep discovery consistent.

## 4. Geolocation + Radius

- Radius options are shared across Feed, Map, and Explore:
  - `2 mi`
  - `5 mi`
  - `10 mi`
  - `Citywide`
- Location permission is requested after onboarding.

## 5. Push Reminders

- Local notifications are scheduled for `Saved` or `Going` events at:
  - 24 hours before
  - 2 hours before
- Reminders are cancelled when intent is cleared.

## 6. Calendar Integration

- Event detail has `Add Calendar`.
- Uses device calendar permission and writes event into the default editable calendar.

## 7. Safety Flows

- Event detail includes:
  - report event with reason + details
  - block organizer
- Data stored in:
  - `event_reports`
  - `user_blocks`

## 8. Analytics

- Instrumented events are written to `analytics_events`.
- Included in-app:
  - app open
  - feed view
  - flyer impression
  - interested/going/saved actions
  - share
  - ticket click
  - event create
  - report
  - block
  - calendar add
  - radius changes
