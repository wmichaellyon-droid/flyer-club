# Flyer Club User Flows (MVP)

## Flow 1: New User Onboarding -> First Action

1. User opens app and sees onboarding welcome.
2. User selects location (`Austin, TX` default preselected).
3. User selects profile type (`Concert Lover`, `Event Enjoyer`, or `Promoter`).
4. User picks interests.
5. User optionally connects friends or skips.
6. App lands user in Feed with local cards.
7. User double taps a flyer (`Interested`) or taps `Going`.
8. System records activation event.

Success condition:
- User takes first intent action in first session.

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
