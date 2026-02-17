# AGENTS.md

## Project Memory: Flyer-First Social App

This file stores the current shared understanding of the app concept so future sessions can continue quickly.

## What We Have Defined So Far

- App type: social media app with an Instagram-like scrolling feed.
- Content type: event flyers only (not general photos/posts).
- Core moderation/filtering: AI filters out posts that are not flyers.
- Flyer interaction: tapping flyer elements can redirect users to related pages (bands, artists, promoters, venues).
- Engagement model:
- `Double tap` = interested in going.
- Optional stronger action = definitely going.
- User profile behavior: flyers the user interacts with are saved to their page.
- Messaging: little to no private messaging; primary social sharing is sending flyers.
- Social graph: users can follow friends and see which flyers friends interact with.
- Discovery:
- If user follows no one, feed emphasizes local viral/high-engagement flyers.
- Explore/For You should prioritize nearby relevant events.
- Purpose: increase real-world community and participation in third places.

## Product Direction (Current)

- Keep interactions lightweight and event-intent-focused, not vanity metrics focused.
- Make discovery local-first by default.
- Design around conversion to real attendance (interest -> commitment -> showing up).

## Brainstorm Threads To Continue

- Trust and quality system for promoters and verified event hosts.
- Fraud/scam/spam prevention workflow for event content.
- Calendar integrations (Google/Apple calendar save).
- Ticket/RSVP integrations and attendance confirmations.
- Post-event loop (photos, reviews, follow-up events).
- Neighborhood/community modes (campus mode, city mode, nightlife mode, family mode).

## Open Decisions

- Final name and brand direction.
- Exact definition of "flyer" for AI moderation.
- Whether non-flyer supporting media is allowed in comments/event pages.
- Monetization model (promoted flyers, creator tools, ticket affiliate, subscriptions).
- Initial city launch strategy.

## Working Files

- Main plan and ideation doc: `docs/plan.md`
