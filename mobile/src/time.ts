export function formatDateLabel(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatTimeRangeLabel(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function combineDateAndTime(dateString: string, timeString: string) {
  const [hourPartRaw, minutePartRaw = '0'] = timeString.trim().split(':');
  const hour = Number(hourPartRaw);
  const minute = Number(minutePartRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function defaultEventEndIso(startIso: string, hours = 3) {
  const start = new Date(startIso);
  start.setHours(start.getHours() + hours);
  return start.toISOString();
}
