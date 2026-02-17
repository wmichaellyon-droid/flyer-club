# Flyer Social App Plan

## 1. Product Concept

Build a social app where the feed is event flyers, not general lifestyle content. Users scroll like Instagram/TikTok, but interactions are attendance-focused:

- `Interested`
- `Going`

The core mission is to increase in-person community participation in local third places.

## 2. Problem Statement

Current event discovery is fragmented across Instagram posts, stories, group chats, and random websites. Users miss events because there is no single, local, intent-driven feed.

This app solves that by:

- centralizing event flyers,
- filtering irrelevant content,
- prioritizing local relevance and social proof,
- converting browsing into real attendance.

## 3. Target Users (Initial)

- Users ages 16-35 who attend music, nightlife, arts, community, and campus events.
- Local promoters, artists, bands, venues that already create flyers.
- Friend groups who coordinate what events to attend.

## 4. Core UX and Features

## Feed

- Infinite vertical feed of flyers.
- AI checks whether a post is a flyer before it enters feed.
- Local-first ranking (city/area proximity and event date relevance).

## Flyer Detail

- Tap flyer to open event detail page.
- Flyer hotspots/links route to related entities:
- artist profile,
- promoter profile,
- venue profile,
- ticket/RSVP link.

## Event Intent Actions

- Double tap: `Interested`.
- Button: `Going`.
- Saved events appear in user profile under personal event lists.

## Social Layer

- Follow friends and creators/promoters.
- See friend interactions on events (e.g., "3 friends interested").
- Minimal messaging: send/share flyer to friends, no heavy chat suite.

## Explore/For You

- If user follows nobody: show local trending flyers and high-engagement posts in nearby areas.
- If user follows people: blend followed graph + local trending + personal preference signals.

## 5. MVP Scope (Must-Have)

- User auth + profile
- Post upload for flyers
- AI flyer classification (accept/reject queue)
- Feed + event detail page
- `Interested` and `Going` interactions
- Follow system
- Flyer sharing to friends
- Basic location setup (city/ZIP)

## 6. V1 Expansion (Should-Have)

- Verified promoter/venue badges
- Calendar add (`Add to Google/Apple Calendar`)
- Event reminders (24h + 2h before event)
- Duplicate event detection (same event posted by multiple accounts)
- Anti-spam and trust scoring

## 7. V2+ Ideas (Could-Have)

- Group planning (friend event plans)
- Check-in at venue (optional attendance proof)
- Post-event recap threads/photos
- Personalized neighborhood channels
- Tickets + waitlist + sold out alerts
- Promoter analytics dashboard

## 8. AI Strategy (Flyer Filtering)

## Objective

Detect whether uploaded content is an event flyer with high precision.

## Practical MVP Pipeline

1. Image pre-check (format, resolution, text density).
2. Vision model classifier: `flyer` vs `non-flyer`.
3. OCR extraction for event signals:
- date/time,
- venue,
- lineup names,
- event title.
4. Confidence thresholding:
- high confidence pass,
- medium confidence manual review,
- low confidence reject.

## Risks

- Meme/graphic false positives.
- Styled selfie/photo false negatives.
- Flyer variants across different cultures and design styles.

## Mitigation

- Human review queue for uncertain predictions.
- Ongoing active-learning from moderation outcomes.
- Region-specific model tuning over time.

## 9. Ranking and Recommendation Signals

- Distance to event and user location.
- Event date proximity (upcoming boosted, expired removed).
- Social proof (`friends interested/going`).
- Local engagement velocity.
- User taste profile (genres, venues, creators interacted with).
- Trust score of promoter/host.

## 10. Data Model (High-Level)

- `User`: id, handle, location, follows, preferences.
- `Creator/Promoter`: profile, verification status, trust score.
- `Event`: title, datetime, venue, city, tags, ticket URL.
- `FlyerPost`: media, AI status, linked event, creator id.
- `Interaction`: user_id, post_id/event_id, state (`interested|going`), timestamp.
- `Share`: sender, recipient, event_id/post_id, timestamp.

## 11. Success Metrics

- Weekly active users (WAU).
- % users marking at least one event `Interested` per week.
- `Interested -> Going` conversion rate.
- Reminder click-through and attendance proxy rate.
- D30 retention for users with at least 3 interactions.
- Supply health: active promoters posting weekly.

## 12. Go-To-Market (Initial)

- Start in one city or campus with concentrated event density.
- Recruit 20-50 local promoters/venues early.
- Seed launch-week event content before user onboarding.
- Growth loop: shared flyers invite non-users into app.

## 13. Monetization Options

- Promoted flyers (clearly labeled).
- Subscription tools for promoters (analytics, scheduling, advanced reach targeting).
- Ticket affiliate revenue share.
- City sponsorship/partnership campaigns.

## 14. Key Risks and Controls

- Empty-feed problem in early markets -> solve via seed partnerships and curated early content.
- Fake/scam events -> trust system + moderation + reports.
- Low attendance conversion despite high engagement -> improve reminders, social coordination, and event quality signals.

## 15. Open Questions for Next Brainstorm

- Name ideas and brand style:
- examples: `Flyr`, `Scene`, `OutThere`, `ThirdPlace`.
- Should comments exist on flyer posts, or keep interaction intentionally minimal?
- Should users be able to post non-flyer content on event detail pages only?
- How strict should local radius be for default feed?
- Do we need separate modes (music, arts, nightlife, family, campus)?

## 16. 2-Week Draft Build Plan

1. Week 1:
- Define schemas (`User`, `Event`, `FlyerPost`, `Interaction`).
- Build auth + profile + upload flow.
- Integrate first-pass flyer classifier + moderation queue.
- Build feed rendering and event detail page.
2. Week 2:
- Add `Interested`/`Going` states + profile saved lists.
- Add follow graph + friend interaction indicators.
- Add local/trending ranking baseline.
- Add share-to-friend flow.
- Instrument analytics for core funnel.

## 17. Next Brainstorm Backlog (Prioritized)

1. Trust and safety framework details (reporting, appeals, verification).
2. Event taxonomy (genres/tags) and onboarding preference capture.
3. Notification design (reminders vs spam boundaries).
4. Exact ranking formula v1 and exploration strategy.
5. Launch city acquisition strategy and promoter onboarding kit.
