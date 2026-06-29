import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { getSatPos, orbitProgress, computeGroundTrackSegments } from '../lib/satMath'
import { formatLocalTime } from '../lib/timezones'

const GROUPS_ORDER = ['starlink', 'oneweb', 'weather', 'station', 'iss']
const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export default function GlobeCanvas({
  satellites, selectedSat, hiddenGroups, minAltKm,
  autoRotate, selectedTz, onSelectSat, onAutoRotateOff,
}) {
  const containerRef = useRef(null)
  const d3s = useRef(null)
  const stateRef = useRef({})
  const cbRef = useRef({})

  stateRef.current = { satellites, selectedSat, hiddenGroups, minAltKm, autoRotate, selectedTz }
  cbRef.current = { onSelectSat, onAutoRotateOff }

  useEffect(() => {
    const container = containerRef.current
    const state = {
      projection: d3.geoOrthographic().rotate([0, -20, 0]).clipAngle(90),
      pathGen: null,
      svg: null,
      satLayers: {},
      issHaloEl: null,
      W: 0, H: 0, R: 0,
      worldData: null,
      dragging: false,
      rafId: null,
      prevSelectedSat: null,
    }
    d3s.current = state

    const svgEl = container.querySelector('#globe-svg')
    const svg = d3.select(svgEl)
    state.svg = svg

    const globeGroup = svg.append('g')
    globeGroup.append('circle').attr('class', 'globe-ocean')
    globeGroup.append('path').attr('class', 'globe-outline')
    globeGroup.append('path').attr('class', 'graticule')
    globeGroup.append('g').attr('class', 'land-g')
    globeGroup.append('path').attr('class', 'ground-track')
    GROUPS_ORDER.forEach(g => {
      state.satLayers[g] = globeGroup.append('g').attr('class', `sat-layer-${g}`)
    })
    state.issHaloEl = globeGroup.append('circle').attr('class', 'iss-halo').attr('r', 0)

    svg.call(d3.drag()
      .on('start', (e) => {
        state.dragging = true
        cbRef.current.onAutoRotateOff()
        svg._lp = [e.x, e.y]
      })
      .on('drag', (e) => {
        if (!svg._lp) return
        const r = state.projection.rotate()
        state.projection.rotate([r[0] + (e.x - svg._lp[0]) * 0.3, r[1] - (e.y - svg._lp[1]) * 0.3])
        svg._lp = [e.x, e.y]
        redrawGlobe()
        updateSatDots()
      })
      .on('end', () => { state.dragging = false; svg._lp = null })
    )

    function redrawGlobe() {
      if (!state.pathGen) return
      const { selectedSat } = stateRef.current
      svg.select('.globe-ocean').attr('cx', state.W / 2).attr('cy', state.H / 2).attr('r', state.R)
      svg.select('.globe-outline').datum({ type: 'Sphere' }).attr('d', state.pathGen)
      svg.select('.graticule').datum(d3.geoGraticule()()).attr('d', state.pathGen)
      if (state.worldData) {
        svg.select('.land-g').selectAll('path').data(state.worldData).join('path')
          .attr('class', 'land').attr('d', state.pathGen)
      }
      if (selectedSat && (selectedSat.group === 'iss' || selectedSat.group === 'station')) {
        const segments = computeGroundTrackSegments(selectedSat)
        svg.select('.ground-track')
          .datum({ type: 'GeometryCollection', geometries: segments.map(s => ({ type: 'LineString', coordinates: s })) })
          .attr('d', state.pathGen)
          .attr('stroke', selectedSat.color)
          .attr('stroke-width', 1.2)
      } else {
        svg.select('.ground-track').attr('d', null)
      }
    }

    function updateSatDots() {
      if (!state.pathGen) return
      const { satellites, hiddenGroups, minAltKm, selectedSat } = stateRef.current
      const now = new Date()
      const rr = state.projection.rotate()
      const center = [-rr[0], -rr[1]]

      const byGroup = {}
      GROUPS_ORDER.forEach(g => { byGroup[g] = [] })
      const allVisible = []

      satellites.forEach(sat => {
        if (hiddenGroups.has(sat.group)) return
        const pos = getSatPos(sat.satrec, now)
        if (!pos) return
        sat.currentPos = pos
        if (pos.alt < minAltKm) return
        if (d3.geoDistance([pos.lon, pos.lat], center) > Math.PI / 2) return
        const proj = state.projection([pos.lon, pos.lat])
        if (!proj) return
        sat.sx = proj[0]; sat.sy = proj[1]
        if (byGroup[sat.group]) byGroup[sat.group].push(sat)
        allVisible.push(sat)
      })

      GROUPS_ORDER.forEach(g => {
        const layer = state.satLayers[g]
        if (!layer) return
        const isSmall = g === 'starlink' || g === 'oneweb'

        layer.selectAll('.sat-dot')
          .data(byGroup[g], d => d.name)
          .join(
            enter => enter.append('circle')
              .attr('class', 'sat-dot')
              .attr('opacity', isSmall ? 0.72 : 1)
              .on('click', (e, d) => { e.stopPropagation(); cbRef.current.onSelectSat(d) })
              .on('touchstart', function(e) {
                const t = e.touches[0]
                this._tapOrigin = { x: t.clientX, y: t.clientY }
              }, { passive: true })
              .on('touchend', function(e, d) {
                if (!this._tapOrigin) return
                const t = e.changedTouches[0]
                const moved = Math.hypot(t.clientX - this._tapOrigin.x, t.clientY - this._tapOrigin.y)
                this._tapOrigin = null
                if (moved < 12) {
                  e.preventDefault()
                  e.stopPropagation()
                  cbRef.current.onSelectSat(d)
                }
              }, { passive: false })
              .on('mouseenter', (e, d) => {
                if (d !== stateRef.current.selectedSat)
                  d3.select(e.currentTarget).attr('r', Math.max(d.size * 2.2, 7))
              })
              .on('mouseleave', (e, d) => {
                d3.select(e.currentTarget).attr('r', d.size)
              }),
            update => update,
            exit => exit.remove()
          )
          .attr('r', d => d.size)
          .attr('cx', d => d.sx)
          .attr('cy', d => d.sy)
          .attr('fill', d => d.color)
          .attr('stroke', d => d === stateRef.current.selectedSat ? '#1c2b3a' : 'none')
          .attr('stroke-width', 2)
      })

      const iss = byGroup['iss']?.[0]
      if (iss) {
        state.issHaloEl.attr('cx', iss.sx).attr('cy', iss.sy).attr('r', iss.size + 6)
      } else {
        state.issHaloEl.attr('r', 0)
      }

      updateSatList(allVisible, stateRef.current.selectedSat)
    }

    function updateSatList(allVisible, selectedSat) {
      const list = document.getElementById('sat-list')
      if (!list) return
      list.innerHTML = ''
      allVisible.slice(0, 30).forEach(sat => {
        const item = document.createElement('div')
        item.className = 'sat-list-item' + (sat === selectedSat ? ' active' : '')
        const dot = document.createElement('div')
        dot.className = 'sat-list-dot'
        dot.style.background = sat.color
        item.appendChild(dot)
        item.appendChild(document.createTextNode(sat.name))
        item.onclick = () => cbRef.current.onSelectSat(sat)
        list.appendChild(item)
      })
    }

    function updateLegendCounts() {
      const { satellites } = stateRef.current
      const rr = state.projection.rotate()
      const center = [-rr[0], -rr[1]]
      const visibleByGroup = {}
      satellites.forEach(sat => {
        if (!visibleByGroup[sat.group]) visibleByGroup[sat.group] = 0
        const pos = sat.currentPos
        if (pos && d3.geoDistance([pos.lon, pos.lat], center) <= Math.PI / 2) {
          visibleByGroup[sat.group]++
        }
      })
      ;['iss', 'starlink', 'oneweb', 'weather', 'station'].forEach(g => {
        const el = document.getElementById(`cnt-${g}`)
        if (el) el.textContent = visibleByGroup[g] != null ? visibleByGroup[g] : '—'
      })
    }

    function updateInfoLive(sat) {
      const pos = sat.currentPos
      if (!pos) return
      const latEl = document.getElementById('i-lat')
      const lonEl = document.getElementById('i-lon')
      const altEl = document.getElementById('i-alt')
      const fillEl = document.getElementById('i-orbit-fill')
      const pctEl = document.getElementById('i-orbit-pct')
      if (latEl) latEl.textContent = pos.lat != null ? pos.lat.toFixed(3) + '°' : '—'
      if (lonEl) lonEl.textContent = pos.lon != null ? pos.lon.toFixed(3) + '°' : '—'
      if (altEl) altEl.textContent = pos.alt != null ? pos.alt.toFixed(0) + ' km' : '—'
      const prog = orbitProgress(sat)
      if (fillEl) fillEl.style.width = prog != null ? `${(prog * 100).toFixed(1)}%` : '0%'
      if (pctEl) pctEl.textContent = prog != null ? `${(prog * 100).toFixed(1)}%` : '—'
    }

    function updateClock(selectedTz) {
      const now = new Date()
      const utcEl = document.getElementById('utc-clock')
      const localEl = document.getElementById('local-clock')
      if (utcEl) utcEl.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' Z'
      if (localEl) localEl.textContent = formatLocalTime(now, selectedTz)
    }

    function animate() {
      const { autoRotate, selectedSat, selectedTz } = stateRef.current

      if (autoRotate && !state.dragging) {
        const r = state.projection.rotate()
        state.projection.rotate([r[0] + 0.04, r[1]])
        redrawGlobe()
      } else if (selectedSat !== state.prevSelectedSat) {
        redrawGlobe()
      }
      state.prevSelectedSat = selectedSat

      updateSatDots()
      updateLegendCounts()
      if (selectedSat) updateInfoLive(selectedSat)
      updateClock(selectedTz)

      state.rafId = requestAnimationFrame(animate)
    }

    function resize() {
      state.W = container.clientWidth
      state.H = container.clientHeight
      state.R = Math.min(state.W, state.H) * 0.44
      svg.attr('width', state.W).attr('height', state.H)
      state.projection.translate([state.W / 2, state.H / 2]).scale(state.R)
      state.pathGen = d3.geoPath().projection(state.projection)
      redrawGlobe()
    }

    resize()
    window.addEventListener('resize', resize)
    if (window.innerWidth <= 640) setTimeout(resize, 150)

    d3.json(WORLD_ATLAS_URL).then(world => {
      state.worldData = topojson.feature(world, world.objects.countries).features
      redrawGlobe()
    }).catch(() => {})

    state.rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      if (state.rafId) cancelAnimationFrame(state.rafId)
    }
  }, [])

  return (
    <div id="globe-container" ref={containerRef}>
      <svg id="globe-svg" />
      <div className="drag-hint">DRAG TO ROTATE · CLICK SATELLITE FOR DETAILS</div>
    </div>
  )
}
