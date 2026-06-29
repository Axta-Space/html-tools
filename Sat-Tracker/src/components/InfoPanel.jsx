export default function InfoPanel({ selectedSat }) {
  return (
    <div className="sidebar-section info-section">
      <div className="section-title">Selected Satellite</div>
      <div id="info-panel">
        {!selectedSat ? (
          <div className="info-placeholder">Click a satellite on the globe to view orbital data.</div>
        ) : (
          <InfoContent sat={selectedSat} />
        )}
      </div>
    </div>
  )
}

function InfoContent({ sat }) {
  const mm     = parseFloat(sat.tle2.substring(52, 63))
  const incl   = parseFloat(sat.tle2.substring(8, 16)).toFixed(2)
  const ecc    = parseFloat('0.' + sat.tle2.substring(26, 33)).toExponential(2)
  const period = mm > 0 ? (1440 / mm).toFixed(1) : '—'

  return (
    <>
      <div className="info-name">{sat.name}</div>
      {/* live-updated by rAF loop */}
      <div className="info-row"><span className="info-key">LAT</span><span className="info-val blue" id="i-lat">—</span></div>
      <div className="info-row"><span className="info-key">LON</span><span className="info-val blue" id="i-lon">—</span></div>
      <div className="info-row"><span className="info-key">ALT</span><span className="info-val orange" id="i-alt">—</span></div>
      {/* static orbital params */}
      <div className="info-row"><span className="info-key">INCL</span><span className="info-val">{incl}°</span></div>
      <div className="info-row"><span className="info-key">PERIOD</span><span className="info-val">{period} min</span></div>
      <div className="info-row"><span className="info-key">ECC</span><span className="info-val">{ecc}</span></div>
      <div className="info-row"><span className="info-key">GROUP</span><span className="info-val green">{sat.group.toUpperCase()}</span></div>
      <div style={{ marginTop: '8px' }}>
        <div className="orbit-label">ORBIT PROGRESS</div>
        <div className="orbit-bar"><div className="orbit-fill" id="i-orbit-fill" style={{ width: '0%' }} /></div>
        <div className="orbit-label" id="i-orbit-pct">—</div>
      </div>
    </>
  )
}
