# Flyer Club App Framework (MVP)

## 1. Technical Stack

- Mobile app: `Expo + React Native + TypeScript`.
- Navigation: stack + bottom tabs.
- Backend (MVP target): `Supabase` for auth, database, storage.
- Media storage: Supabase bucket for flyer assets.
- Analytics: PostHog, Amplitude, or Firebase Analytics (pick one before beta).

## 2. App Navigation Blueprint

Root stack:
- `Onboarding` (shown until onboarding complete)
- `MainTabs`
- `EventDetail` (pushed from Feed/Explore/Profile)

Main tabs:
- `Feed`
- `Explore`
- `Upload`
- `Profile`

## 3. Feed Scrolling System (Core)

Implementation:
- Use `FlatList` with vertical scrolling.
- Page-like snapping for strong flyer focus.
- Preload next 3-5 cards for smooth perceived performance.
- Lazy-load media and cache thumbnails.

Behavior:
- Infinite pagination.
- Pull-to-refresh for latest local events.
- Remove expired events from active list.
- Local-first ranking inputs:
- distance
- event start time proximity
- social velocity
- friend proof

Card actions:
- Double tap -> toggle `Interested`.
- `Going` button -> set `going`.
- `Share` button -> native share sheet.
- Card tap -> `EventDetail`.

## 4. Profile System (Core)

Primary model:
- Profile is an event-intent dashboard, not a vanity content wall.

Sections:
- `Interested` list (upcoming first).
- `Going` list (upcoming first).
- `Saved` list (optional bookmarks).
- Past events (read-only history v1-lite).

Rules:
- `Going` implies stronger commitment than `Interested`.
- Same event can only be one active intent state at a time.
- State transitions:
- none -> interested
- interested -> going
- going -> interested (allowed)
- interested/going -> none (remove)

## 5. High-Level Data Contract

Core entities:
- `User`: id, handle, city, location, preferences.
- `Event`: id, title, start_at, venue_id, city, neighborhood, ticket_url.
- `FlyerPost`: id, event_id, media_url, moderation_status.
- `Interaction`: user_id, event_id, state (`interested|going|saved`), updated_at.
- `Share`: sender_user_id, event_id, destination, created_at.

## 6. State Management (MVP)

- Server state: TanStack Query (or React Query equivalent).
- UI state: local component state + small global store for session user.
- Optimistic updates for `Interested`/`Going` toggles.
- Retry queue for offline interaction taps.

## 7. Performance and Reliability Baselines

- Feed card first paint target: under 1.2s on average LTE.
- Interaction tap response target: under 120ms optimistic UI.
- API pagination size: 15-20 events per page.
- Crash-free sessions target: 99%+ in beta.

## 8. Security/Moderation Baselines

- Only verified authenticated users can upload.
- AI moderation gate before publish.
- Manual review queue for uncertain uploads.
- Event report action on detail screen.

## 9. Build Order

1. Scaffold navigation + screen shells (6 screens).
2. Build feed list with mock data and action state.
3. Build profile intent lists powered by shared interaction store.
4. Add event detail route and CTA actions.
5. Add upload screen with moderation state placeholders.
6. Integrate backend APIs and auth.
