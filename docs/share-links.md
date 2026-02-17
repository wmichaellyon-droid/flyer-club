# Share Links and SMS Previews

## What is implemented in the app

- Share actions now use one shared formatter so event links and copy are consistent.
- Every share includes a web event link like:
  - `https://flyerclub.app/e/{eventId}?utm_source=flyerclub_app&utm_medium=share&utm_campaign=event_invite`
- Every share also includes a direct app deep link:
  - `flyerclub://event/{eventId}`
- A one-tap `Text` action opens the SMS composer with prefilled event copy.
- App deep links are supported with:
  - `flyerclub://event/{eventId}`

## Why this helps SMS sharing

- Text messages usually generate the rich preview card from the first web URL in the message.
- Keeping a clean event URL in the message makes previews consistent and trackable.

## Required backend/web work for pretty previews

To make links render as rich cards in iMessage, Google Messages, etc., each event page URL should return:

- `og:title` (event title + date)
- `og:description` (short event summary)
- `og:image` (flyer image, recommended at least 1200x630)
- `og:url` (canonical event URL)
- `twitter:card` (`summary_large_image`)

## Deep link behavior target

- Preferred: configure `https://flyerclub.app/e/{eventId}` as a universal/app link.
- If app installed: open the matching event in-app.
- If app not installed: open mobile web event page with install/open-app CTA.

## Notes

- Current mobile app handles inbound `flyerclub://event/{eventId}` links.
- Universal/app links require native association files + hosted domain setup.
