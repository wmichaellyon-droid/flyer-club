# Flyer Club MVP Decisions (Austin Launch)

## 1. Product Boundaries

- Launch market: `Austin, TX` only.
- Platform target: `mobile app` first (iOS + Android via React Native).
- Content rule: feed accepts only `event flyer` posts.
- Primary objective: maximize conversion from discovery to real attendance.

## 2. Final MVP Screen Set (6 Screens)

1. Onboarding
2. Feed
3. Event Detail
4. Explore
5. Upload
6. Profile

Bottom navigation for MVP: `Feed`, `Explore`, `Upload`, `Profile`.

## 3. Core Actions (Locked)

- `Interested`: lightweight intent.
- `Going`: stronger commitment.
- `Share`: send flyer/event to friend or external apps.
- `Get Tickets`: open ticket/RSVP URL.

## 3.1 Profile Type Selection (Locked)

During onboarding, every user selects one profile type:

- `Concert Lover`
- `Event Enjoyer`
- `Promoter`

All profile types can upload flyers.
Promoter accounts get promoter-specific profile sections, management tools, and distribution weighting.

Interaction rules:
- Double tap on feed flyer toggles `Interested`.
- `Going` button sets intent to going (and should count as interested for analytics funnel).
- `Share` is available on feed card and event detail.
- `Get Tickets` is primary CTA on event detail.

## 4. Feed and Discovery Defaults

- Logged-in Home defaults to `Map` mode with `Map | Flyer Feed` toggle.
- Default ranking: local-first + upcoming events.
- Default radius: `15 miles` around user location.
- Radius fallback when supply is low: expand to `35 miles`.
- Expired events: removed from default feed.
- If user follows no one: prioritize `Trending in Austin`.

Required feed labels on cards:
- distance (`2.1 mi`)
- time relevance (`Tonight`, `Tomorrow`)
- neighborhood (`East Austin`)

Map defaults:
- draggable city map with tappable event pins
- `Search this area` action after map drag
- color-coded pins by event type

## 5. Profile Model (MVP)

Profile tabs/lists:
- `Interested`
- `Going`
- `Saved` (optional manual save distinct from interest)

Other profile sections:
- upcoming events count
- past attended events (v1-lite placeholder)
- following/followers counts

## 6. Social Scope (MVP)

- Keep messaging minimal: sharing only.
- No threaded DMs/chat suite in MVP.
- Show social proof on events when available:
- `X friends interested`
- `Y friends going`

## 6.1 Community Posting Model (MVP)

- Flyer uploads are open to all users (community-first supply).
- Promoter role receives:
- creator toolset
- profile-level promoter panels
- ranking/distribution boost after moderation approval

## 7. Trust and Moderation Scope (MVP)

- AI flyer classification: pass/review/reject.
- Manual review queue for uncertain uploads.
- Report event button on event detail.
- Badge support planned for v1, not required for MVP day one.

## 8. Out of Scope (MVP)

- Long-form comments/thread discussions.
- Full group-planning chat.
- Nationwide rollout logic.
- Advanced promoter analytics dashboard.

## 9. Austin MVP Success Targets

- Activation: user marks at least one event `Interested` in first 24h.
- Commitment: user marks at least one event `Going` in first 7 days.
- Supply health: recurring weekly uploads from local promoters/venues.
- Retention: repeat weekly session rate from activated users.
