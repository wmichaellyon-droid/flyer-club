# Flyer Club User Flows (MVP)

## Flow 1: New User Onboarding -> First Action

1. User opens app and lands on required login screen.
2. User enters profile name (required) and unlocks the next step.
3. User enters email (required) and unlocks the next step.
4. User optionally adds a profile photo URL (or skips).
5. User answers 5 event taste questions one-by-one using interactive moving picture bubbles.
6. User continues to onboarding.
7. User selects location (`Austin, TX` default preselected).
8. User selects profile type (`Concert Lover`, `Event Enjoyer`, or `Promoter`).
9. User confirms interests.
10. App lands user in Feed with local cards.
11. User double taps a flyer (`Interested`) or taps `Going`.
12. System records activation event.

Success condition:
- User takes first intent action in first session.

## Flow 1B: Home Map Discovery

1. User lands on Home in `Map` mode.
2. User drags map to neighborhood of interest.
3. App shows `Search this area`.
4. User taps button and sees refreshed nearby pins.
5. User taps a colored pin and opens quick action sheet.
6. User taps `Interested`, `Going`, `Share`, or `Get Tickets`.

Success condition:
- User discovers and acts on local events directly from map.

## Flow 2: Feed Scroll -> Event Detail -> Ticket

1. User scrolls vertical flyer feed.
2. User sees local badges (`Tonight`, distance, neighborhood).
3. User taps flyer card.
4. App opens Event Detail with full info.
5. User taps `Get Tickets`.
6. App opens external ticket URL in in-app browser.

Success condition:
- User reaches outbound ticket page.

## Flow 3: Intent Update Path (`Interested` -> `Going`)

1. User marks event as `Interested`.
2. Event appears in Profile `Interested` list.
3. User revisits event via profile or reminder.
4. User taps `Going`.
5. Event moves into `Going` list.

Success condition:
- Track conversion from interested to going.

## Flow 4: Share Loop (Growth)

1. User taps `Share` on feed card or event detail.
2. User selects contact or external app.
3. Recipient opens deep link.
4. Non-user recipient sees app install landing and event preview.
5. After install/signup, recipient lands on the same event detail.

Success condition:
- Shared flyer leads to install/signup + event view.

## Flow 5: Community Upload and Moderation

1. User opens `Upload`.
2. User adds flyer image and event metadata.
3. AI classifies image as flyer or non-flyer.
4. If high confidence flyer: post published.
5. If medium confidence: queued for manual review.
6. If reject: uploader receives reason and retry guidance.
7. If uploader role is promoter: post gets promoter distribution weighting after approval.

Success condition:
- High-quality flyer supply enters feed with low spam.
