import { useRef, useEffect } from 'react'

function NumberInput({ label, value, min, max, step, onChange }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.value = value
    }
  }, [value])

  function commit(raw) {
    const v = Math.max(min, Math.min(max, +raw))
    onChange(v)
  }

  return (
    <div className="ctrl">
      <span className="lbl">{label}</span>
      <input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        defaultValue={value}
        onInput={e => commit(e.target.value)}
        onChange={e => commit(e.target.value)}
      />
    </div>
  )
}

export default function ControlPanel({ cfg, selectedBeam, onCfgChange, onBeamChange }) {
  const sel = selectedBeam

  return (
    <div id="controls">
      <NumberInput
        label="Sat Lon"
        value={cfg.satLon}
        min={-180} max={180} step={1}
        onChange={v => onCfgChange('satLon', v)}
      />
      <NumberInput
        label="Major °"
        value={sel ? sel.major : 2.0}
        min={0.1} max={20} step={0.1}
        onChange={v => sel && onBeamChange(sel.id, { major: v })}
      />
      <NumberInput
        label="Minor °"
        value={sel ? sel.minor : 2.0}
        min={0.1} max={20} step={0.1}
        onChange={v => sel && onBeamChange(sel.id, { minor: v })}
      />
      <NumberInput
        label="Rot °"
        value={sel ? sel.rot : 0}
        min={-180} max={180} step={1}
        onChange={v => sel && onBeamChange(sel.id, { rot: v })}
      />
      <NumberInput
        label="Min Elev °"
        value={cfg.minElev}
        min={0} max={30} step={1}
        onChange={v => onCfgChange('minElev', v)}
      />
    </div>
  )
}
