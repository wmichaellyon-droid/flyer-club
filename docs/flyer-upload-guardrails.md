# Flyer Upload Guardrails (MVP -> V1)

## 1. Flyer Definition (Enforced)

A post is a valid flyer only if all are true:

- Primary purpose is promoting a specific event.
- Contains at least two event signals in image text:
- date/time
- venue or location
- event title or host/promoter
- Includes graphic layout typical of promotional creatives (not casual camera photo as primary content).

Rejected examples:
- selfies, food photos, landscape shots, memes, unrelated posters.
- generic aesthetic graphics with no concrete event signals.

## 2. Multi-Layer Upload Pipeline

1. File gate:
- allow only image formats (`jpg`, `jpeg`, `png`, `webp`).
- min resolution and aspect ratio bounds.
- remove EXIF, scan basic malware signatures.

2. OCR extraction:
- extract all visible text.
- compute `text density` and `event keyword` signals.

3. Vision classifier:
- model A: `flyer` vs `non_flyer`.
- model B: `photo/selfie/food/meme/screenshot` categories.

4. Layout heuristics:
- detect design blocks, text overlays, and poster-style composition.
- downscore full-bleed camera photos with minimal overlay text.

5. Event-entity parser:
- parse structured fields from OCR (date, time, venue, city, lineup).
- require minimum confidence for at least 2 critical fields.

6. Abuse checks:
- perceptual hash duplicate detection.
- near-duplicate campaign spam detection.
- account-level upload velocity checks.

7. Scoring:
- combine all checks into a `flyer confidence` score 0-1.
- combine abuse checks into `risk score` 0-1.

8. Decision:
- `auto_approve` if confidence high and risk low.
- `manual_review` if confidence medium or risk medium.
- `auto_reject` if confidence low or risk high.

## 3. Decision Thresholds (Starting Point)

- Auto approve: flyer confidence `>= 0.85` and risk `< 0.30`.
- Manual review: flyer confidence `0.55-0.84` or risk `0.30-0.69`.
- Auto reject: flyer confidence `< 0.55` or risk `>= 0.70`.

Tune thresholds weekly based on moderation outcomes.

## 4. Human Review Queue Rules

- Review SLA: under 15 minutes during peak Austin hours.
- Reviewers see:
- model scores and extracted OCR text
- parsed event fields
- similar prior uploads
- reviewer chooses approve/reject with reason code.

Reason code examples:
- `NON_FLYER_PHOTO`
- `MISSING_EVENT_INFO`
- `DUPLICATE_SPAM`
- `LOW_IMAGE_QUALITY`

## 5. Account and Abuse Controls

- Require verified phone or trusted email before first upload.
- Progressive rate limits:
- new accounts: low daily upload cap
- trusted promoters: higher cap
- cooldown when rejection rate is high.
- Temporary upload suspension on repeated abuse.

## 6. Product UX for Rejections

When rejected, show specific fix guidance:
- “Add date/time and venue text to flyer.”
- “Upload a promotional flyer image, not a camera photo.”
- “This appears duplicated from an existing event.”

Always allow resubmission with edited creative.

## 7. Metrics to Watch Weekly

- Precision on approved uploads.
- False reject rate (legit flyers rejected).
- Manual review load and median review time.
- Rejection reason distribution.
- Repeat abuse account rate.

## 8. MVP Recommendation

For Austin launch, optimize for high precision first:
- It is better to review more borderline uploads than let non-flyer content into feed.
- Keep feed quality strict early to establish trust with users.
