export const WGS84     = { a: 6378137.0, b: 6356752.3142 };
export const GSO_ALT_M = 35786000;
export const D2R       = Math.PI / 180;
export const R2D       = 180 / Math.PI;
export const LAT_CLAMP = 85;
export const N_VERTS   = 360;

// ── Vector math ───────────────────────────────────────────────────────────────
export const norm  = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
export const dot   = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
export const cross = (a, b) => [
  a[1]*b[2] - a[2]*b[1],
  a[2]*b[0] - a[0]*b[2],
  a[0]*b[1] - a[1]*b[0],
];

export function lla2ecef(lat, lon, alt = 0) {
  const { a, b } = WGS84, a2 = a*a, b2 = b*b;
  const φ = lat * D2R, λ = lon * D2R;
  const N = a2 / Math.sqrt(a2 * Math.cos(φ)**2 + b2 * Math.sin(φ)**2);
  return [
    (N + alt) * Math.cos(φ) * Math.cos(λ),
    (N + alt) * Math.cos(φ) * Math.sin(λ),
    (b2/a2 * N + alt) * Math.sin(φ),
  ];
}

export function ecef2lla(x, y, z) {
  const { a, b } = WGS84, a2 = a*a, b2 = b*b;
  const e2 = (a2 - b2) / a2, ep2 = (a2 - b2) / b2;
  const p  = Math.hypot(x, y);
  const θ  = Math.atan2(z * a, p * b);
  const lat = Math.atan2(
    z  + ep2 * b * Math.sin(θ)**3,
    p  - e2  * a * Math.cos(θ)**3,
  );
  const N = a2 / Math.sqrt(a2 * Math.cos(lat)**2 + b2 * Math.sin(lat)**2);
  return [lat * R2D, Math.atan2(y, x) * R2D, p / Math.cos(lat) - N];
}

// Nearest positive-t ray–WGS84-ellipsoid intersection, or null
export function rayEllipsoid(O, D) {
  const { a, b } = WGS84, a2 = a*a, b2 = b*b;
  const [ox, oy, oz] = O, [dx, dy, dz] = D;
  const A =  dx*dx/a2 + dy*dy/a2 + dz*dz/b2;
  const B = 2*(ox*dx/a2 + oy*dy/a2 + oz*dz/b2);
  const C =  ox*ox/a2 + oy*oy/a2 + oz*oz/b2 - 1;
  const disc = B*B - 4*A*C;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-B - sq) / (2*A), t2 = (-B + sq) / (2*A);
  const t  = t1 > 0 ? t1 : t2 > 0 ? t2 : null;
  if (t === null) return null;
  return [ox + t*dx, oy + t*dy, oz + t*dz];
}

// Rodrigues' rotation: rotate v around unit axis k by angle θ (radians)
export function rodrigues(v, k, θ) {
  const c = Math.cos(θ), s = Math.sin(θ), d = dot(v, k), cr = cross(k, v);
  return v.map((_, i) => v[i]*c + cr[i]*s + k[i]*d*(1 - c));
}

export function elevAtLatLon(satE, lat, lon) {
  const G     = lla2ecef(lat, lon, 0);
  const toSat = norm(satE.map((v, i) => v - G[i]));
  const φ = lat * D2R, λ = lon * D2R;
  const up = [Math.cos(φ)*Math.cos(λ), Math.cos(φ)*Math.sin(λ), Math.sin(φ)];
  return Math.asin(Math.max(-1, Math.min(1, dot(toSat, up)))) * R2D;
}

export function elevSlant(satLon, lat, lon) {
  const S     = lla2ecef(0, satLon, GSO_ALT_M);
  const G     = lla2ecef(lat, lon, 0);
  const toSat = S.map((v, i) => v - G[i]);
  const φ = lat * D2R, λ = lon * D2R;
  const up = [Math.cos(φ)*Math.cos(λ), Math.cos(φ)*Math.sin(λ), Math.sin(φ)];
  return {
    elev:    Math.asin(Math.max(-1, Math.min(1, dot(norm(toSat), up)))) * R2D,
    slantKm: Math.hypot(...toSat) / 1000,
  };
}

export function beamFrame(satLon, boreLat, boreLon) {
  const satE    = lla2ecef(0, satLon, GSO_ALT_M);
  const boreE   = lla2ecef(boreLat, boreLon, 0);
  const boreDir = norm(boreE.map((v, i) => v - satE[i]));

  const worldZ = [0, 0, 1];
  let northRaw = worldZ.map((v, i) => v - dot(worldZ, boreDir) * boreDir[i]);
  if (Math.hypot(...northRaw) < 1e-6) {
    const worldY = [0, 1, 0];
    northRaw = worldY.map((v, i) => v - dot(worldY, boreDir) * boreDir[i]);
  }

  const north_hat = norm(northRaw);
  const east_hat  = norm(cross(north_hat, boreDir));
  return { satE, boreDir, north_hat, east_hat };
}

// Shared setup for computeBeam / computeAxisTips / computeBeamAndTips
function beamAxes(satLon, boreLat, boreLon, majorDeg, minorDeg, rotDeg) {
  const { satE, boreDir, north_hat, east_hat } = beamFrame(satLon, boreLat, boreLon);
  const rotR = rotDeg * D2R, cosR = Math.cos(rotR), sinR = Math.sin(rotR);
  const major_hat = east_hat.map((_, i) =>  cosR * east_hat[i] + sinR * north_hat[i]);
  const minor_hat = east_hat.map((_, i) => -sinR * east_hat[i] + cosR * north_hat[i]);
  return { satE, boreDir, major_hat, minor_hat, a: majorDeg / 2 * D2R, b: minorDeg / 2 * D2R };
}

function buildCoords(satE, boreDir, major_hat, minor_hat, a, b, minElev) {
  const raw = [];
  for (let i = 0; i < N_VERTS; i++) {
    const phi = 2 * Math.PI * i / N_VERTS;
    const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
    const r = (a * b) / Math.sqrt((b*cosPhi)**2 + (a*sinPhi)**2);
    const sweepDir = norm(major_hat.map((_, j) => cosPhi*major_hat[j] + sinPhi*minor_hat[j]));
    const ray = norm(rodrigues(boreDir, sweepDir, r));
    const hit = rayEllipsoid(satE, ray);
    if (!hit) { raw.push(null); continue; }
    const [lat, lon] = ecef2lla(...hit);
    raw.push(elevAtLatLon(satE, lat, lon) >= minElev ? [lon, lat] : null);
  }
  if (raw.every(v => v === null)) return null;
  const coords = [];
  for (let i = 0; i < N_VERTS; i++) {
    const cur  = raw[i];
    const next = raw[(i + 1) % N_VERTS];
    if (cur  !== null) coords.push(cur);
    if (cur  === null && next !== null) coords.push(next);
  }
  if (coords.length < 3) return null;
  coords.push(coords[0]);
  return coords;
}

function buildTips(satE, boreDir, major_hat, minor_hat, a, b, minElev) {
  return [
    [major_hat,              a],
    [major_hat.map(v => -v), a],
    [minor_hat,              b],
    [minor_hat.map(v => -v), b],
  ].map(([dir, r]) => {
    const ray = norm(rodrigues(boreDir, norm(dir), r));
    const hit = rayEllipsoid(satE, ray);
    if (!hit) return null;
    const [lat, lon] = ecef2lla(...hit);
    return elevAtLatLon(satE, lat, lon) >= minElev ? [lon, lat] : null;
  });
}

export function computeBeam(satLon, boreLat, boreLon, majorDeg, minorDeg, rotDeg, minElev) {
  const { satE, boreDir, major_hat, minor_hat, a, b } = beamAxes(satLon, boreLat, boreLon, majorDeg, minorDeg, rotDeg);
  return buildCoords(satE, boreDir, major_hat, minor_hat, a, b, minElev);
}

export function computeAxisTips(satLon, boreLat, boreLon, majorDeg, minorDeg, rotDeg, minElev) {
  const { satE, boreDir, major_hat, minor_hat, a, b } = beamAxes(satLon, boreLat, boreLon, majorDeg, minorDeg, rotDeg);
  return buildTips(satE, boreDir, major_hat, minor_hat, a, b, minElev);
}

export function computeBeamAndTips(satLon, boreLat, boreLon, majorDeg, minorDeg, rotDeg, minElev) {
  const { satE, boreDir, major_hat, minor_hat, a, b } = beamAxes(satLon, boreLat, boreLon, majorDeg, minorDeg, rotDeg);
  return {
    coords: buildCoords(satE, boreDir, major_hat, minor_hat, a, b, minElev),
    tips:   buildTips(satE, boreDir, major_hat, minor_hat, a, b, minElev),
  };
}

export function wrapLon(lon) {
  lon = lon % 360;
  if (lon >  180) lon -= 360;
  if (lon < -180) lon += 360;
  return lon;
}
