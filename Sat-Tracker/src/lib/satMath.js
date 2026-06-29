import * as satellite from 'satellite.js'

export function getSatPos(satrec, date) {
  try {
    const pv = satellite.propagate(satrec, date)
    if (!pv?.position || typeof pv.position !== 'object') return null
    const gd = satellite.eciToGeodetic(pv.position, satellite.gstime(date))
    return {
      lon: satellite.degreesLong(gd.longitude),
      lat: satellite.degreesLat(gd.latitude),
      alt: gd.height,
    }
  } catch (e) { return null }
}

export function orbitProgress(sat) {
  try {
    const s = sat.satrec
    const now = new Date()
    const jdNow = satellite.jday(
      now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(),
    )
    const minutesSinceEpoch = (jdNow - s.jdsatepoch) * 1440
    const M = s.mo + s.no * minutesSinceEpoch
    let frac = (M / (2 * Math.PI)) % 1
    if (frac < 0) frac += 1
    return isFinite(frac) ? frac : null
  } catch (e) { return null }
}

export function computeGroundTrackSegments(sat) {
  const now = new Date()
  const points = []
  for (let m = -50; m <= 50; m++) {
    const t = new Date(now.getTime() + m * 60000)
    try {
      const pv = satellite.propagate(sat.satrec, t)
      if (!pv?.position) continue
      const gd = satellite.eciToGeodetic(pv.position, satellite.gstime(t))
      points.push([satellite.degreesLong(gd.longitude), satellite.degreesLat(gd.latitude)])
    } catch (e) {}
  }
  const segments = []; let seg = []
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && Math.abs(points[i][0] - points[i-1][0]) > 180) { segments.push(seg); seg = [] }
    seg.push(points[i])
  }
  segments.push(seg)
  return segments.filter(s => s.length > 1)
}
