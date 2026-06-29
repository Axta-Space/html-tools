const LEGEND_ITEMS = [
  { group: 'iss',      label: 'ISS',           color: 'var(--c-iss)' },
  { group: 'starlink', label: 'Starlink',       color: 'var(--c-starlink)' },
  { group: 'oneweb',   label: 'OneWeb',         color: 'var(--c-oneweb)' },
  { group: 'weather',  label: 'Weather (GOES)', color: 'var(--c-goes)' },
  { group: 'station',  label: 'Space Stations', color: 'var(--c-stations)' },
]

export default function LegendSection({ hiddenGroups, onToggle }) {
  return (
    <div className="sidebar-section">
      <div className="section-title">Groups — tap to toggle</div>
      <div className="legend-row">
        {LEGEND_ITEMS.map(({ group, label, color }) => (
          <button
            key={group}
            className={`legend-item${hiddenGroups.has(group) ? ' hidden-group' : ''}`}
            data-group={group}
            onClick={() => onToggle(group)}
          >
            <div className="legend-dot" style={{ background: color }} />
            <span>{label}</span>
            <span className="legend-count" id={`cnt-${group}`}>—</span>
          </button>
        ))}
      </div>
    </div>
  )
}
