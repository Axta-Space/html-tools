import * as satellite from 'satellite.js'

const CACHE_TTL_MS = 110 * 60 * 1000
const CACHE_PREFIX = 'orbital_tle3_'

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { ts, text } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(CACHE_PREFIX + key); return null }
    return { text, ts }
  } catch (e) { return null }
}

function cacheSet(key, text) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), text })) } catch (e) {}
}

export function clearCache() {
  Object.keys(localStorage).filter(k => k.startsWith('orbital_')).forEach(k => localStorage.removeItem(k))
}

function parseTLEText(text, src) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const sats  = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].startsWith('1 ') || lines[i].startsWith('2 ')) { i++; continue }
    const name = lines[i]
    const tle1 = lines[i + 1] || ''
    const tle2 = lines[i + 2] || ''
    if (tle1.startsWith('1 ') && tle2.startsWith('2 ')) {
      try {
        const satrec = satellite.twoline2satrec(tle1, tle2)
        if (satrec.error === 0) {
          sats.push({
            name: name.replace(/^0 /, '').trim(),
            tle1, tle2, satrec,
            color: src.color, size: src.size, group: src.group,
            currentPos: null,
          })
        }
      } catch (e) {}
      i += 3
    } else { i++ }
  }
  return sats
}

const BASE = 'https://celestrak.org/NORAD/elements/gp.php'

export const GROUPS_CFG = [
  { label: 'ISS',      url: `${BASE}?CATNR=25544&FORMAT=TLE`,    color: '#e05c1a', size: 6,   group: 'iss',      cacheKey: 'iss' },
  { label: 'Starlink', url: `${BASE}?GROUP=starlink&FORMAT=TLE`, color: '#1a6fc4', size: 1.8, group: 'starlink', cacheKey: 'starlink' },
  { label: 'OneWeb',   url: `${BASE}?GROUP=oneweb&FORMAT=TLE`,   color: '#c4940a', size: 2.5, group: 'oneweb',   cacheKey: 'oneweb' },
  { label: 'GOES',     url: `${BASE}?GROUP=goes&FORMAT=TLE`,     color: '#8b3dcc', size: 3.5, group: 'weather',  cacheKey: 'goes' },
  { label: 'Stations', url: `${BASE}?GROUP=stations&FORMAT=TLE`, color: '#1a9e3f', size: 4,   group: 'station',  cacheKey: 'stations' },
]

const PROXIES = [
  {
    name: 'direct',
    fetch: async (url) => {
      const resp = await fetch(url, { signal: AbortSignal.timeout(16000) })
      const text = await resp.text()
      if (!resp.ok) {
        if (text.includes('GP data has not updated'))
          throw Object.assign(new Error(`RATE_LIMITED: ${text.substring(0, 160)}`), { isRateLimit: true })
        throw new Error(`HTTP ${resp.status}: ${text.substring(0, 100)}`)
      }
      if (text.includes('Invalid query')) throw new Error(`Invalid query: "${text.substring(0, 120)}"`)
      return text
    },
  },
  {
    name: 'allorigins',
    fetch: async (url) => {
      const resp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(24000) })
      if (!resp.ok) throw new Error(`allorigins HTTP ${resp.status}`)
      const w    = await resp.json()
      const text = w.contents ?? ''
      if (!text) throw new Error(`allorigins empty (upstream HTTP ${w.status?.http_code ?? '?'})`)
      if (text.includes('GP data has not updated'))
        throw Object.assign(new Error(`RATE_LIMITED: ${text.substring(0, 120)}`), { isRateLimit: true })
      return text
    },
  },
  {
    name: 'corsproxy.io',
    fetch: async (url) => {
      const resp = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(24000) })
      const text = await resp.text()
      if (!resp.ok) throw new Error(`corsproxy HTTP ${resp.status}`)
      if (text.includes('GP data has not updated'))
        throw Object.assign(new Error(`RATE_LIMITED: ${text.substring(0, 120)}`), { isRateLimit: true })
      return text
    },
  },
]

export async function loadGroup(src, { log }) {
  const cached = cacheGet(src.cacheKey)
  if (cached) {
    const ageMin = Math.round((Date.now() - cached.ts) / 60000)
    log(`${src.label}: cache hit (${ageMin} min old) ✓`, 'cache')
    return { sats: parseTLEText(cached.text, src), fromCache: true, cacheTs: cached.ts }
  }
  for (const proxy of PROXIES) {
    log(`${src.label}: trying ${proxy.name}…`, 'info')
    try {
      const text = await proxy.fetch(src.url)
      const sats = parseTLEText(text, src)
      if (sats.length === 0) throw new Error('Parsed 0 satellites')
      cacheSet(src.cacheKey, text)
      log(`${src.label}: ${sats.length} satellites ✓`, 'ok')
      return { sats, fromCache: false }
    } catch (e) {
      const isRL = e.isRateLimit
      log(`${src.label} [${proxy.name}] ${isRL ? '⚠ rate-limited' : 'failed'}: ${e.message}`, 'warn')
      if (isRL) { log('  → Wait ~2hr or click "clear & refetch"', 'info'); break }
    }
  }
  throw new Error(`All strategies exhausted for ${src.label}`)
}
