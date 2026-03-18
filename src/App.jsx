import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import './index.css'
import { useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import Navbar from './component/Navbar'
import Button from './component/Button'
import Sidebar from './component/Sidebar'
import InfoCard from './component/InfoCard'
// import ramcoLocationsText from './assets/ramco_locations.geojson?raw'
// import ramcoLocationsText from './assets/combined_network.geojson?raw' 
import ramcoLocationsText from './assets/ramco_with_global_customers.geojson?raw' 
import { FaLocationCrosshairs } from "react-icons/fa6";

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

function App() {
  const [location, setLocation] = useState(null)
  const [place, setPlace] = useState('')
  const [selectedType, setSelectedType] = useState(null)  
  const [showMyLocation, setShowMyLocation] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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
            <MapFlyTo target={flyTarget} onDone={() => setFlyTarget(null)} />

            {showMyLocation && location && (
              <Marker position={location}>
                <Popup>{place}</Popup>
              </Marker>
            )}

            {visibleLocations.flatMap((feature) => {
              const positions = getPositions(feature)
              return positions.map((position, index) => (
                <Marker
                  key={`${feature.properties.entity_id}-${index}`}
                  position={position}
                  eventHandlers={{ click: () => setSelectedFeature(feature.properties) }}
                />
              ))
            })}
          </MapContainer>

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