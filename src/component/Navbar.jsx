import "./Navbar.css"
import { GiHamburgerMenu } from "react-icons/gi";

const Navbar = ({ lat, long, place, onMenuClick }) => {
  const coordinateText = lat && long
    ? `${Number(lat).toFixed(4)}, ${Number(long).toFixed(4)}`
    : "Awaiting selection";

  const placeText = place || "Select a point on the map or use current location";

  return (
    <div className="Navbar">
      <div className="nav-primary">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Toggle sidebar">
          <GiHamburgerMenu />
        </button>

        <div className="nav-brand">
          {/* <span className="nav-eyebrow">Ramco</span> */}
          {/* <h1>Enterprise GIS Console</h1> */}
          <h1>GIS Console</h1>
        </div>
      </div>

      <div className="nav-status">
        <div className="status-block">
          <span className="status-label">Coordinates</span>
          <span className="status-value">{coordinateText}</span>
        </div>

        <div className="status-block status-block-place">
          <span className="status-label">Selected Place</span>
          <span className="status-value">{placeText}</span>
        </div>
      </div>
    </div>
  )
}

export default Navbar