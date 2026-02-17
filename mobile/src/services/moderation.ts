import { EventDraft, ModerationStatus } from '../types';

interface ModerationResult {
  status: ModerationStatus;
  reason: string;
  score: number;
}

const suspiciousTokens = ['selfie', 'meme', 'vacation', 'cat', 'dog'];

export function evaluateFlyerDraft(draft: EventDraft): ModerationResult {
  let score = 0;
  const reasons: string[] = [];
  const flyer = draft.flyerImageUrl.toLowerCase();

  if (flyer.startsWith('http://') || flyer.startsWith('https://')) {
    score += 2;
  } else {
    reasons.push('Flyer URL must be web-accessible.');
  }

  if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(flyer)) {
    score += 2;
  } else {
    reasons.push('Flyer should be an image file URL.');
  }

  if (draft.title.trim().length >= 4 && draft.venue.trim().length >= 3 && draft.address.trim().length >= 5) {
    score += 2;
  } else {
    reasons.push('Missing core event fields (title/venue/address).');
  }

  if (draft.startAtIso && draft.endAtIso && new Date(draft.endAtIso) > new Date(draft.startAtIso)) {
    score += 1;
  } else {
    reasons.push('Invalid event date/time range.');
  }

  if (draft.ticketUrl.startsWith('http://') || draft.ticketUrl.startsWith('https://')) {
    score += 1;
  } else {
    reasons.push('Ticket link must be a valid URL.');
  }

  if (draft.tags.length >= 1 && draft.category.trim().length > 0 && draft.subcategory.trim().length > 0) {
    score += 1;
  } else {
    reasons.push('Add category, subcategory, and at least one tag.');
  }

  if (suspiciousTokens.some((token) => flyer.includes(token))) {
    score -= 3;
    reasons.push('Flyer appears non-event related.');
  }

  if (score >= 8) {
    return {
      status: 'accepted',
      reason: 'Passed automated flyer checks.',
      score,
    };
  }

  if (score >= 5) {
    return {
      status: 'review',
      reason: reasons[0] ?? 'Needs manual moderation review.',
      score,
    };
  }

  return {
    status: 'rejected',
    reason: reasons[0] ?? 'Failed flyer moderation checks.',
    score,
  };
}
