import { useReducer, useEffect } from 'react'
import HomeNav from './components/HomeNav'
import Header from './components/Header'
import GlobeCanvas from './components/GlobeCanvas'
import LegendSection from './components/LegendSection'
import InfoPanel from './components/InfoPanel'
import SatListSection from './components/SatListSection'
import CacheBanner from './components/CacheBanner'
import StatusBar from './components/StatusBar'
import { GROUPS_CFG, loadGroup, clearCache } from './lib/tleLoader'

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

const initialState = {
  satellites: [],
  selectedSat: null,
  hiddenGroups: new Set(),
  minAltKm: 0,
  autoRotate: true,
  selectedTz: LOCAL_TZ,
  satCount: 0,
  status: { msg: 'Initializing…', state: 'loading' },
  logLines: [],
  cacheBanner: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_SATS':
      return {
        ...state,
        satellites: [...state.satellites, ...action.sats],
        satCount: state.satCount + action.sats.length,
      }
    case 'SELECT_SAT':
      return { ...state, selectedSat: action.sat }
    case 'TOGGLE_GROUP': {
      const hiddenGroups = new Set(state.hiddenGroups)
      if (hiddenGroups.has(action.group)) hiddenGroups.delete(action.group)
      else hiddenGroups.add(action.group)
      return { ...state, hiddenGroups }
    }
    case 'SET_MIN_ALT':
      return { ...state, minAltKm: action.km }
    case 'TOGGLE_ROTATE':
      return { ...state, autoRotate: !state.autoRotate }
    case 'SET_AUTO_ROTATE_OFF':
      return state.autoRotate ? { ...state, autoRotate: false } : state
    case 'SET_TZ':
      return { ...state, selectedTz: action.tz }
    case 'SET_STATUS':
      return { ...state, status: { msg: action.msg, state: action.state } }
    case 'ADD_LOG':
      return { ...state, logLines: [...state.logLines, { text: action.text, type: action.logType }] }
    case 'SET_CACHE_BANNER':
      return { ...state, cacheBanner: { text: action.text } }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {
    satellites, selectedSat, hiddenGroups, minAltKm, autoRotate,
    selectedTz, satCount, status, logLines, cacheBanner,
  } = state

  useEffect(() => {
    function log(msg, type = 'info') {
      const ts = new Date().toISOString().substring(11, 19)
      dispatch({ type: 'ADD_LOG', text: `[${ts}] ${msg}`, logType: type })
    }
    function setStatus(msg, s = 'loading') {
      dispatch({ type: 'SET_STATUS', msg, state: s })
    }

    log('FORMAT=TLE · satellite.js twoline2satrec() · CelesTrak GP API', 'info')
    log('CelesTrak rate-limit: 1 fetch per ~2hr. Cached in localStorage.', 'info')

    let total = 0, anyCached = false, oldestTs = Infinity, firstIssSelected = false

    async function loadAll() {
      for (const src of GROUPS_CFG) {
        setStatus(`Loading ${src.label}…`, 'loading')
        try {
          const { sats, fromCache, cacheTs } = await loadGroup(src, { log })
          dispatch({ type: 'ADD_SATS', sats })
          total += sats.length
          if (fromCache && cacheTs) {
            anyCached = true
            if (cacheTs < oldestTs) oldestTs = cacheTs
          }
          if (src.group === 'iss' && sats.length > 0 && !firstIssSelected) {
            firstIssSelected = true
            dispatch({ type: 'SELECT_SAT', sat: sats[0] })
            log(`Auto-selected: ${sats[0].name}`, 'info')
          }
        } catch (e) {
          log(`FAILED [${src.label}]: ${e.message}`, 'error')
        }
      }

      if (anyCached) {
        const ageMin = Math.round((Date.now() - oldestTs) / 60000)
        dispatch({
          type: 'SET_CACHE_BANNER',
          text: `⚑ Cached TLE (${ageMin} min old) — CelesTrak allows 1 fetch per ~2hr`,
        })
      }

      if (total === 0) {
        setStatus('No data — check log', 'error')
        log('─── TROUBLESHOOTING ───', 'error')
        log('1. Open browser DevTools → Network tab, reload, check celestrak.org rows', 'info')
        log('2. 403 "GP data has not updated" → rate-limited, wait ~2hr or click "clear & refetch"', 'info')
        log('3. Network error → check internet / VPN / browser security settings', 'info')
      } else {
        setStatus(
          `${anyCached ? 'Cached' : 'Live'} · ${total.toLocaleString()} satellites`,
          anyCached ? 'cached' : 'ok'
        )
        log(`Complete: ${total.toLocaleString()} satellites loaded.`, 'ok')
      }
    }

    loadAll()
  }, [])

  function handleClearCache() {
    clearCache()
    const ts = new Date().toISOString().substring(11, 19)
    dispatch({ type: 'ADD_LOG', text: `[${ts}] Cache cleared — reloading…`, logType: 'info' })
    setTimeout(() => location.reload(), 600)
  }

  return (
    <>
      <HomeNav />
      <Header
        minAltKm={minAltKm}
        autoRotate={autoRotate}
        selectedTz={selectedTz}
        satCount={satCount}
        onAltChange={km => dispatch({ type: 'SET_MIN_ALT', km })}
        onRotateToggle={() => dispatch({ type: 'TOGGLE_ROTATE' })}
        onTzChange={tz => dispatch({ type: 'SET_TZ', tz })}
      />
      <div className="main">
        <GlobeCanvas
          satellites={satellites}
          selectedSat={selectedSat}
          hiddenGroups={hiddenGroups}
          minAltKm={minAltKm}
          autoRotate={autoRotate}
          selectedTz={selectedTz}
          onSelectSat={sat => dispatch({ type: 'SELECT_SAT', sat })}
          onAutoRotateOff={() => dispatch({ type: 'SET_AUTO_ROTATE_OFF' })}
        />
        <div id="sidebar">
          <LegendSection
            hiddenGroups={hiddenGroups}
            onToggle={group => dispatch({ type: 'TOGGLE_GROUP', group })}
          />
          <InfoPanel selectedSat={selectedSat} />
          <SatListSection />
          <CacheBanner banner={cacheBanner} onClear={handleClearCache} />
          <StatusBar status={status} logLines={logLines} />
        </div>
      </div>
    </>
  )
}
