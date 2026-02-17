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

## 3. Geolocation + Radius

- Radius options are shared across Feed, Map, and Explore:
  - `2 mi`
  - `5 mi`
  - `10 mi`
  - `Citywide`
- Location permission is requested after onboarding.

## 4. Push Reminders

- Local notifications are scheduled for `Saved` or `Going` events at:
  - 24 hours before
  - 2 hours before
- Reminders are cancelled when intent is cleared.

## 5. Calendar Integration

- Event detail has `Add Calendar`.
- Uses device calendar permission and writes event into the default editable calendar.

## 6. Safety Flows

- Event detail includes:
  - report event with reason + details
  - block organizer
- Data stored in:
  - `event_reports`
  - `user_blocks`

## 7. Analytics

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
