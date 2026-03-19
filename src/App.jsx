import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import './index.css'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import Navbar from './component/Navbar'
import Button from './component/Button'
import Sidebar from './component/Sidebar'
import InfoCard from './component/InfoCard'
// import ramcoLocationsText from './assets/ramco_locations.geojson?raw'
// import ramcoLocationsText from './assets/combined_network.geojson?raw' 
import ramcoLocationsText from './assets/ramco_with_global_customers.geojson?raw' 
// import ramcoLocationsText from './assets/ramco_with_3000_customers.geojson?raw'

import { FaLocationCrosshairs } from "react-icons/fa6";
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

const ramcoLocations = JSON.parse(ramcoLocationsText)

async function getPlaceName(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'User-Agent': 'react-leaflet-app' }})
    const data = await res.json()
    return data.display_name
    
  } catch {
    return 'Unable to fetch location name'
  }
}
function isPlant(feature) {
  const type = feature.properties.facility_type
  return type === 'Integrated Cement Plant' || type === 'Grinding Unit'
}

function isMine(feature) {
  return feature.properties.facility_type === 'Captive Mine'
}

function isCustomer(feature) {
  const type = feature.properties.facility_type
  return type === 'Customer Cluster' || type === 'Distribution Hub' ||type === 'Customer'
}

function getPositions(feature) {
  const geometry = feature.geometry
  if (!geometry) return []

  if (geometry.type === 'Point') {
    const [lon, lat] = geometry.coordinates
    return [[lat, lon]]
  }

  if (geometry.type === 'MultiPoint') {
    return geometry.coordinates.map(([lon, lat]) => [lat, lon])
  }

  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0] || []
    if (ring.length === 0) return []

    let totalLat = 0
    let totalLon = 0
    for (const [lon, lat] of ring) {
      totalLat += lat
      totalLon += lon
    }
    return [[totalLat / ring.length, totalLon / ring.length]]
  }

  return []
}

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat
      const lon = e.latlng.lng
      const name = await getPlaceName(lat, lon)
      onLocationChange([lat, lon], name)
    },
  })
  return null
}

function MapFlyTo({ target, onDone }) {
  const map = useMap()
  if (target) {
    map.flyTo(target, 18, { animate: true, duration: 1 })
    onDone()
  }
  return null
}

const DEFAULT_CENTER = [20.5937, 78.9629]
const DEFAULT_ZOOM = 5
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY

function formatDistance(km) {
  return `${km.toFixed(1)} km`
}

function formatDuration(mins) {
  if (mins < 60) return `${Math.round(mins)} min`
  const hours = Math.floor(mins / 60)
  const remMins = Math.round(mins % 60)
  return `${hours}h ${remMins}m`
}

function MapContextMenuHandler({ onContextMenuOpen, onMapInteraction }) {
  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault()
      onContextMenuOpen({
        latlng: [e.latlng.lat, e.latlng.lng],
        point: [e.containerPoint.x, e.containerPoint.y],
      })
    },
    click() {
      onMapInteraction()
    },
    dragstart() {
      onMapInteraction()
    },
    zoomstart() {
      onMapInteraction()
    },
  })
  return null
}

function App() {
  const [location, setLocation] = useState(null)
  const [place, setPlace] = useState('')
  const [selectedType, setSelectedType] = useState(null)  
  const [showMyLocation, setShowMyLocation] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [routeStart, setRouteStart] = useState(null)
  const [routeEnd, setRouteEnd] = useState(null)
  const [routePath, setRoutePath] = useState([])
  const [routeStats, setRouteStats] = useState(null)
  const [routeError, setRouteError] = useState('')
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    point: null,
    latlng: null,
  })

  const [startName, setStartName] = useState('')
  const [endName, setEndName] = useState('')

  async function handleMyLocationClick() {
    if (showMyLocation) {
      setShowMyLocation(false)
      setLocation(null)
      setPlace('')
      return
    }

    setPlace('unknown')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const name = await getPlaceName(lat, lon)
        const coords = [lat, lon]
        setLocation(coords)
        setPlace(name)
        setShowMyLocation(true)
        setFlyTarget(coords)  
      },
      () => {
        setPlace('Location access denied')
      }
    )
  }

  function handleLocationChange(coords, name) {
    setLocation(coords)
    setPlace(name)
    setShowMyLocation(true)
    setFlyTarget(null)
  }

  function handleSelectType(type) {
    setSelectedType(prev => prev === type ? null : type)
  }

  function handleSidebarToggle() {
    setIsSidebarOpen(prev => !prev)
  }
  function closeContextMenu() {
    setContextMenu({ isOpen: false, point: null, latlng: null })
  }

  function handleContextMenuOpen(menuData) {
    setContextMenu({ isOpen: true, ...menuData })
  }

  function setRoutePoint(type) {
    if (!contextMenu.latlng) return
    if (type === 'start') setRouteStart(contextMenu.latlng)
    if (type === 'end') setRouteEnd(contextMenu.latlng)
    closeContextMenu()
  }

  useEffect(() => {
    if (!routeStart || !routeEnd) {
      setRoutePath([])
      setRouteStats(null)
      setRouteError('')
      setIsRouteLoading(false)
      return
    }

    if (!ORS_API_KEY) {
      setRoutePath([])
      setRouteStats(null)
      setRouteError('API_KEY not set.')
      setIsRouteLoading(false)
      return
    }

    let cancelled = false

    async function fetchRoute() {
      setIsRouteLoading(true)
      setRouteError('')

      try {
        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
          method: 'POST',
          headers: {
            Authorization: ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [routeStart[1], routeStart[0]],
              [routeEnd[1], routeEnd[0]],
            ],
          }),
        })

        const data = await response.json()
        console.log('ORS response:', data)

        if (!response.ok) {
          const message = data?.error?.message || data?.message || 'Unable to calculate route'
          throw new Error(message)
        }

        const feature = data?.features?.[0]
        const coords = feature?.geometry?.coordinates
        const summary = feature?.properties?.summary

        if (!coords || coords.length === 0 || !summary) {
          throw new Error('No route returned for selected points')
        }

        if (cancelled) return

        setRoutePath(coords.map(([lon, lat]) => [lat, lon]))
        setRouteStats({
          distanceKm: summary.distance / 1000,
          durationMins: summary.duration / 60,
        })
      } catch (error) {
        if (cancelled) return
        setRoutePath([])
        setRouteStats(null)
        setRouteError(error.message || 'Unable to calculate route')
      } finally {
        if (!cancelled) setIsRouteLoading(false)
      }
    }

    fetchRoute()
    return () => {
      cancelled = true
    }
  }, [routeStart, routeEnd])

  useEffect(() => {
  if (routeStart) {
    getPlaceName(routeStart[0], routeStart[1]).then(setStartName)
  }
}, [routeStart])

useEffect(() => {
  if (routeEnd) {
    getPlaceName(routeEnd[0], routeEnd[1]).then(setEndName)
  }
}, [routeEnd])

  function handleRouteDragEnd(type, event) {
    const marker = event.target
    const { lat, lng } = marker.getLatLng()
    if (type === 'start') setRouteStart([lat, lng])
    if (type === 'end') setRouteEnd([lat, lng])
  }

  function clearRoute() {
    setRouteStart(null)
    setRouteEnd(null)
    setRoutePath([])
    setRouteStats(null)
    setRouteError('')
    setIsRouteLoading(false)
    closeContextMenu()
  }

  const visibleLocations = selectedType
    ? ramcoLocations.features.filter((feature) => {
        if (selectedType === 'plant') return isPlant(feature)
        if (selectedType === 'mine') return isMine(feature)
        if (selectedType === 'customer') return isCustomer(feature)
        return false
      })
    : []

  return (
    <div className='main-container'>
      <Navbar lat={location?.[0]} long={location?.[1]} place={place} onMenuClick={handleSidebarToggle}/>

      <div className='app-content'>
        <Sidebar activeType={selectedType} onSelectType={handleSelectType} isOpen={isSidebarOpen}/>

        <div className='map-stage'>
          <MapContainer className='map-view' center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} doubleClickZoom={true} >
            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
            <MapClickHandler onLocationChange={handleLocationChange} />
            <MapContextMenuHandler onContextMenuOpen={handleContextMenuOpen} onMapInteraction={closeContextMenu} />
            <MapFlyTo target={flyTarget} onDone={() => setFlyTarget(null)} />

            {showMyLocation && location && (
              <Marker position={location}>
                <Popup>{place}</Popup>
              </Marker>
            )}

            {routeStart && (
              <Marker position={routeStart} draggable eventHandlers={{ dragend: (e) => handleRouteDragEnd('start', e) }} >
                <Popup>Start point</Popup>
              </Marker>
            )}

            {routeEnd && (
              <Marker position={routeEnd} draggable eventHandlers={{ dragend: (e) => handleRouteDragEnd('end', e) }}>
                <Popup>End point</Popup>
              </Marker>
            )}

            {routePath.length > 0 && (
              <Polyline positions={routePath} pathOptions={{ color: '#0d6bda', weight: 5, opacity: 0.82 }} />
            )}

            <MarkerClusterGroup>
            {visibleLocations.flatMap((feature) => {
              const positions = getPositions(feature)
              return positions.map((position, index) => (
                <Marker key={`${feature.properties.entity_id}-${index}`} position={position} eventHandlers={{ click: () => setSelectedFeature(feature.properties) }}/>
              ))
            })}
            </MarkerClusterGroup>
          </MapContainer>

          {contextMenu.isOpen && contextMenu.point && (
            <div
              className='route-context-menu'
              style={{ left: `${contextMenu.point[0]}px`, top: `${contextMenu.point[1]}px` }}
            >
              <button onClick={() => setRoutePoint('start')}>Mark as Start</button>
              <button onClick={() => setRoutePoint('end')}>Mark as End</button>
              <button className='danger' onClick={clearRoute}>Clear Route</button>
            </div>
          )}

          {(routeStart || routeEnd) && (
            <div className='route-status-card'>
              {/* <strong>Route Planner</strong> */}
              {/* {routeStart && routeEnd && isRouteLoading && <p>Calculating route...</p>} */}
              {routeStart && routeEnd && routeError && <p className='error'>{routeError}</p>}
              {routeStart && routeEnd && routeStats && (
                <>
                <p className='startName'>
                Start:</p> <p>{startName || `${routeStart[0].toFixed(4)}, ${routeStart[1].toFixed(4)}`} </p>
                
                <p className='endName'>
                End:</p> 
                <p> {endName || `${routeEnd[0].toFixed(4)}, ${routeEnd[1].toFixed(4)}`}</p>
                
                <h6>
                  Distance: {formatDistance(routeStats.distanceKm)} <br></br> Duration: {formatDuration(routeStats.durationMins)}
                </h6>
                </>
              )}
              {/* <p className='hint'>Drag markers to recalculate.</p> */}
            </div>
          )}

          <InfoCard data={selectedFeature} onClose={() => setSelectedFeature(null)} />
        </div>
      </div>

      
      <Button
        className={`fab ${showMyLocation ? 'active' : ''}`}
        onClick={handleMyLocationClick}
      >
        <FaLocationCrosshairs size={22} />
      </Button>
    </div>
  )
}

export default App