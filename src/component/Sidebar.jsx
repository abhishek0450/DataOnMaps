import Button from "./Button"
import "./Sidebar.css"
const Sidebar = ({ activeType, onSelectType, isOpen }) => {
  return (
    <div className={`Sidebar-main ${isOpen ? 'open' : 'closed'}`}>
        <div className="Sidebar-inner">
            <div className="sidebar-header">
              <p className="sidebar-kicker">Layer Controls</p>
              <h2 className="sidebar-title">Operational Assets</h2>
              <p className="sidebar-copy">Filter visible sites by facility group.</p>
            </div>

            <div className="sidebar-actions">
            <Button
              className={activeType === 'plant' ? 'sidebar-btn active' : 'sidebar-btn'}
              onClick={() => onSelectType('plant')}
            >
              <span className="sidebar-btn-label">Plants</span>
              <span className="sidebar-btn-meta">Integrated plants and grinding units</span>
            </Button>
            <Button
              className={activeType === 'mine' ? 'sidebar-btn active' : 'sidebar-btn'}
              onClick={() => onSelectType('mine')}
            >
              <span className="sidebar-btn-label">Mines</span>
              <span className="sidebar-btn-meta">Captive mining locations</span>
            </Button>
            <Button
              className={activeType === 'customer' ? 'sidebar-btn active' : 'sidebar-btn'}
              onClick={() => onSelectType('customer')}
            >
              <span className="sidebar-btn-label">Customers</span>
              <span className="sidebar-btn-meta">Clusters and distribution hubs</span>
            </Button>
            </div>
        </div>
    </div>
  )
}

export default Sidebar