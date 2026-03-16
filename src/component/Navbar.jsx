import "./Navbar.css"

const Navbar = ({ lat, long, place }) => {
  return (
    <div className="Navbar">
      LOCATION: {lat||"Unknown"}, {long||"Unknown"} <br /> 
      Place: {place || "Fetching location..."}
    </div>
  )
}

export default Navbar