import "./Navbar.css"

const Navbar = ({ lat, long }) => {
  return (
    <div className="Navbar">
      LOCATION: {lat}, {long}
    </div>
  )
}

export default Navbar