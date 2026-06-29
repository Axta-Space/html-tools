import { buildTzOptions } from '../lib/timezones'

const TZ_OPTIONS = buildTzOptions()

export default function Header({ minAltKm, autoRotate, selectedTz, satCount, onAltChange, onRotateToggle, onTzChange }) {
  return (
    <header>
      <div className="logo">ORBITAL<span>LIVE SATELLITE TRACKER</span></div>

      <div className="header-controls">
        <div className="filter-group">
          <label>MIN ALT</label>
          <input
            type="range" id="alt-slider"
            min="0" max="40000" step="100"
            value={minAltKm}
            onChange={e => onAltChange(parseInt(e.target.value))}
          />
          <span id="alt-val">{minAltKm === 0 ? 'all' : `${minAltKm.toLocaleString()} km`}</span>
        </div>

        <button
          id="rotate-btn"
          className={autoRotate ? 'active' : ''}
          onClick={onRotateToggle}
        >
          &#x27F3; {autoRotate ? 'AUTO-ROTATE' : 'PAUSED'}
        </button>

        <div className="tz-group">
          <label>TIME</label>
          <select id="tz-select" value={selectedTz} onChange={e => onTzChange(e.target.value)}>
            {TZ_OPTIONS.map(t => (
              <option key={t.tz} value={t.tz}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-stats">
        <div className="stat">
          <div className="stat-label">TRACKING</div>
          <div className="stat-value" id="sat-count">{satCount > 0 ? satCount.toLocaleString() : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">LOCAL</div>
          <div id="local-clock">—</div>
        </div>
        <div className="stat">
          <div className="stat-label">UTC</div>
          <div id="utc-clock" className="utc-clock-val">—</div>
        </div>
      </div>
    </header>
  )
}
