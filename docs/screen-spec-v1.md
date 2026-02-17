# Flyer Club Screen Spec v1 (MVP)

## 1. Onboarding

Goal:
- Get location and taste signals fast, then drop user into value.

Key UI blocks:
- Welcome + value statement.
- Location selector (`Austin` default).
- Interest chips.
- Continue CTA.

Primary actions:
- Continue
- Skip friend connect

Data required:
- user city
- user coordinates
- selected interests

Analytics events:
- `onboarding_started`
- `onboarding_completed`
- `interest_selected`

## 2. Feed

Goal:
- Drive rapid discovery and intent actions.

Key UI blocks:
- Vertical flyer cards.
- Local relevance badges (`distance`, `Tonight/Tomorrow`, neighborhood).
- Social proof line (`friends interested/going`).
- Inline actions: Interested, Going, Share.

Primary actions:
- Double tap flyer -> Interested
- Tap Going
- Tap Share
- Tap card -> Event Detail

Data required:
- ranked event list
- flyer image URL
- event datetime
- distance + neighborhood
- friend interaction counts

Analytics events:
- `feed_viewed`
- `flyer_impression`
- `interested_toggled`
- `going_clicked`
- `share_clicked`
- `event_opened_from_feed`

## 3. Event Detail

Goal:
- Convert interest into commitment and outbound ticket action.

Key UI blocks:
- Hero flyer image.
- Event title, date/time, venue, neighborhood.
- Core action row: Interested, Going, Share.
- Ticket CTA (`Get Tickets`).
- Linked entities: artist/promoter/venue.
- About section.

Primary actions:
- Interested
- Going
- Share
- Get Tickets
- Add to Calendar (secondary)

Data required:
- full event record
- ticket URL
- lineup entities
- map/location fields

Analytics events:
- `event_detail_viewed`
- `get_tickets_clicked`
- `calendar_add_clicked`

## 4. Explore

Goal:
- Help users actively find nearby events outside feed ranking.

Key UI blocks:
- Search bar.
- Toggle: map/list.
- Filter chips (`Tonight`, `This Weekend`, `Free`, `Live Music`, `21+`).
- Nearby sections by neighborhood.

Primary actions:
- Apply filters
- Open event detail

Data required:
- searchable event index
- geospatial location data
- event tags

Analytics events:
- `explore_viewed`
- `explore_filter_applied`
- `explore_event_opened`

## 5. Upload

Goal:
- Let promoters submit events fast with quality guardrails.

Key UI blocks:
- Flyer upload control.
- Event metadata form.
- AI moderation status (`Analyzing`, `Approved`, `Needs Review`, `Rejected`).

Primary actions:
- Upload flyer
- Submit event
- Edit and resubmit

Data required:
- uploaded media
- event metadata
- moderation status + reason

Analytics events:
- `upload_started`
- `upload_submitted`
- `upload_ai_approved`
- `upload_ai_rejected`
- `upload_sent_to_review`

## 6. Profile

Goal:
- Give user a clear personal event plan.

Key UI blocks:
- Header (avatar, handle, city, follow counts).
- Tabs/lists: Interested, Going, Saved.
- Upcoming event cards.
- Past events placeholder.

Primary actions:
- Open event detail from list
- Remove/update intent
- Share event from list

Data required:
- user profile
- interaction lists by state
- follow counts

Analytics events:
- `profile_viewed`
- `profile_tab_switched`
- `profile_event_opened`
