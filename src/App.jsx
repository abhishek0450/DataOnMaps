import './index.css'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import Navbar from './component/Navbar'
import Button from './component/Button'

function App() {


  const [location, setLocation] = useState(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) =>
      setLocation([pos.coords.latitude, pos.coords.longitude])
    )
  }, [])

  const refreshPosition = () => {
    setLocation(null)
    navigator.geolocation.getCurrentPosition((pos) =>
      setLocation([pos.coords.latitude, pos.coords.longitude])
    )
  }

  if (!location) return <p>Locating...</p>

  return (
  <div className='main-container'>
    <Navbar long={location[1]} lat={location[0]} />
    <MapContainer center={location} zoom={20} style={{ height: '100vh' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={location} />
    </MapContainer>
    <Button onClick={refreshPosition} />
  </div>
    
  )
}

export default App
