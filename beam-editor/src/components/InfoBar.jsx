import { elevSlant } from '../lib/geodesy.js'

export default function InfoBar({ cfg, selectedBeam }) {
  let bore = '—', elev = '—', slant = '—'

  if (selectedBeam) {
    const { satLon } = cfg
    const { elev: e, slantKm } = elevSlant(satLon, selectedBeam.boreLat, selectedBeam.boreLon)
    const { boreLat, boreLon } = selectedBeam
    const latStr = Math.abs(boreLat).toFixed(1) + '°' + (boreLat >= 0 ? 'N' : 'S')
    const lonStr = Math.abs(boreLon).toFixed(1) + '°' + (boreLon >= 0 ? 'E' : 'W')
    bore  = `${latStr} ${lonStr}`
    elev  = `${e.toFixed(1)}°`
    slant = `${slantKm.toFixed(0)} km`
  }

  return (
    <div id="info">
      <div className="info-cell">
        <span className="lbl">Boresight</span>
        <span className="val">{bore}</span>
      </div>
      <div className="info-cell">
        <span className="lbl">Elevation</span>
        <span className="val red">{elev}</span>
      </div>
      <div className="info-cell">
        <span className="lbl">Slant Range</span>
        <span className="val red">{slant}</span>
      </div>
    </div>
  )
}
