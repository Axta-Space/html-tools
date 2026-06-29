import { useReducer } from 'react'
import { COLORS } from './lib/colors.js'
import { wrapLon, LAT_CLAMP } from './lib/geodesy.js'
import HomeNav from './components/HomeNav.jsx'
import GlobeCanvas from './components/GlobeCanvas.jsx'
import BeamList from './components/BeamList.jsx'
import InfoBar from './components/InfoBar.jsx'
import ControlPanel from './components/ControlPanel.jsx'

const MAX_BEAMS = 16

const initialState = {
  cfg:        { satLon: 33, minElev: 5 },
  beams:      [{ id: 1, boreLat: 20, boreLon: 33, major: 2.0, minor: 2.0, rot: 0, color: COLORS[0] }],
  selectedId: 1,
  nextId:     2,
}

function makeBeam(id, boreLat, boreLon, major, minor, rot) {
  return { id, boreLat, boreLon, major, minor, rot, color: COLORS[(id - 1) % COLORS.length] }
}

function reducer(state, action) {
  switch (action.type) {

    case 'ADD_BEAM': {
      if (state.beams.length >= MAX_BEAMS) return state
      const prev      = state.beams.at(-1)
      const id        = state.nextId
      const boreLon   = prev ? prev.boreLon : state.cfg.satLon
      const major     = prev ? prev.major   : 2.0
      const minor     = prev ? prev.minor   : 2.0
      const rot       = prev ? prev.rot     : 0
      const boreLat   = action.boreLat ?? 20
      const beam      = makeBeam(id, boreLat, boreLon, major, minor, rot)
      return { ...state, beams: [...state.beams, beam], selectedId: id, nextId: id + 1 }
    }

    case 'DELETE_BEAM': {
      const beams = state.beams.filter(b => b.id !== action.id)
      const selectedId = state.selectedId === action.id
        ? (beams.at(-1)?.id ?? null)
        : state.selectedId
      return { ...state, beams, selectedId }
    }

    case 'SELECT_BEAM':
      return { ...state, selectedId: action.id }

    case 'UPDATE_BEAM': {
      const beams = state.beams.map(b =>
        b.id === action.id ? { ...b, ...action.patch } : b
      )
      return { ...state, beams }
    }

    case 'SET_SAT_LON': {
      const delta  = action.value - state.cfg.satLon
      const beams  = state.beams.map(b => ({ ...b, boreLon: wrapLon(b.boreLon + delta) }))
      return { ...state, cfg: { ...state.cfg, satLon: action.value }, beams }
    }

    case 'SET_MIN_ELEV':
      return { ...state, cfg: { ...state.cfg, minElev: action.value } }

    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { cfg, beams, selectedId } = state
  const selectedBeam = beams.find(b => b.id === selectedId) ?? null

  function handleCfgChange(key, value) {
    if (key === 'satLon') dispatch({ type: 'SET_SAT_LON', value })
    else if (key === 'minElev') dispatch({ type: 'SET_MIN_ELEV', value })
  }

  function handleBeamChange(id, patch) {
    dispatch({ type: 'UPDATE_BEAM', id, patch })
  }

  function handleBeamDragEnd(id, boreLat, boreLon) {
    dispatch({ type: 'UPDATE_BEAM', id, patch: { boreLat, boreLon } })
  }

  return (
    <div id="app">
      <HomeNav />
      <header>
        <h1>GSO Beam Footprint</h1>
        <span className="sub">D3 · WGS-84 · Drag beams to repoint</span>
        <span className="ver">V2</span>
      </header>

      <GlobeCanvas
        cfg={cfg}
        beams={beams}
        selectedId={selectedId}
        onSelect={id => dispatch({ type: 'SELECT_BEAM', id })}
        onBeamDragEnd={handleBeamDragEnd}
        onUpdateCfgSatLon={v => dispatch({ type: 'SET_SAT_LON', value: v })}
      />

      <BeamList
        beams={beams}
        selectedId={selectedId}
        onSelect={id => dispatch({ type: 'SELECT_BEAM', id })}
        onAdd={() => dispatch({ type: 'ADD_BEAM' })}
        onDelete={id => dispatch({ type: 'DELETE_BEAM', id })}
      />

      <InfoBar cfg={cfg} selectedBeam={selectedBeam} />

      <ControlPanel
        cfg={cfg}
        selectedBeam={selectedBeam}
        onCfgChange={handleCfgChange}
        onBeamChange={handleBeamChange}
      />
    </div>
  )
}
