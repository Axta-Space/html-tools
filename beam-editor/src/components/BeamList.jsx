import { MAX_BEAMS } from '../App.jsx'

export default function BeamList({ beams, selectedId, onSelect, onAdd, onDelete }) {
  const full = beams.length >= MAX_BEAMS

  return (
    <div id="beam-list">
      {beams.map(beam => (
        <div
          key={beam.id}
          className={`beam-tab${beam.id === selectedId ? ' active' : ''}`}
          onClick={() => onSelect(beam.id)}
        >
          <div className="swatch" style={{ background: beam.color }} />
          <span>B{beam.id}</span>
          <span
            className="del-btn"
            onClick={e => { e.stopPropagation(); onDelete(beam.id) }}
            onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); onDelete(beam.id) }}
          >
            ×
          </span>
        </div>
      ))}
      <div
        id="add-beam-btn"
        className={full ? 'disabled' : ''}
        onClick={full ? undefined : onAdd}
        title="Add beam"
      >
        {full ? String(MAX_BEAMS) : '+'}
      </div>
    </div>
  )
}
