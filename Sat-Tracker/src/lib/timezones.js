export const TIMEZONES = [
  { label: 'UTC',                tz: 'UTC' },
  { label: 'New York (ET)',      tz: 'America/New_York' },
  { label: 'Chicago (CT)',       tz: 'America/Chicago' },
  { label: 'Denver (MT)',        tz: 'America/Denver' },
  { label: 'Los Angeles (PT)',   tz: 'America/Los_Angeles' },
  { label: 'Anchorage (AKT)',    tz: 'America/Anchorage' },
  { label: 'Honolulu (HST)',     tz: 'Pacific/Honolulu' },
  { label: 'London (GMT/BST)',   tz: 'Europe/London' },
  { label: 'Paris (CET/CEST)',   tz: 'Europe/Paris' },
  { label: 'Dubai (GST)',        tz: 'Asia/Dubai' },
  { label: 'Mumbai (IST)',       tz: 'Asia/Kolkata' },
  { label: 'Singapore (SGT)',    tz: 'Asia/Singapore' },
  { label: 'Tokyo (JST)',        tz: 'Asia/Tokyo' },
  { label: 'Sydney (AEST/AEDT)', tz: 'Australia/Sydney' },
]

export function buildTzOptions() {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone
  return [
    { label: `Local (${local})`, tz: local },
    ...TIMEZONES.filter(t => t.tz !== local),
  ]
}

export function formatLocalTime(date, tz) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZoneName: 'short',
  }).format(date)
}
