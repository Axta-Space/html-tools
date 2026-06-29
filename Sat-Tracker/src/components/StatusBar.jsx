import { useState, useRef, useEffect } from 'react'

export default function StatusBar({ status, logLines }) {
  const [open, setOpen] = useState(false)
  const logRef = useRef(null)

  useEffect(() => {
    if (status.state === 'error') setOpen(true)
  }, [status.state])

  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logLines, open])

  function copyLog() {
    navigator.clipboard?.writeText(logLines.map(l => l.text).join('\n'))
  }

  return (
    <div id="status-bar">
      <div id="status-line">
        <span>
          <span className={`pulse ${status.state}`} id="pulse-dot" />
          <span id="status-text">{status.msg}</span>
        </span>
        <div className="log-controls">
          <span className="log-btn" id="diag-toggle" onClick={() => setOpen(o => !o)}>
            {open ? '▼' : '▶'} log
          </span>
          <span className="log-btn" onClick={copyLog}>copy</span>
        </div>
      </div>
      {open && (
        <div id="diag-log" ref={logRef}>
          {logLines.map((line, i) => (
            <div key={i} className={`log-${line.type}`}>{line.text}</div>
          ))}
        </div>
      )}
    </div>
  )
}
