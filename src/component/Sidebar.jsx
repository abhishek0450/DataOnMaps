import Button from "./Button"
import "./Sidebar.css"
const Sidebar = ({ activeType, onSelectType }) => {
  return (
    <div className="Sidebar-main">
        <div className="Sidebar-inner">
            <Button
              className={activeType === 'plant' ? 'sidebar-btn active' : 'sidebar-btn'}
              onClick={() => onSelectType('plant')}
            >
              Plants
            </Button>
            <Button
              className={activeType === 'mine' ? 'sidebar-btn active' : 'sidebar-btn'}
              onClick={() => onSelectType('mine')}
            >
              Mines
            </Button>
            <Button
              className={activeType === 'customer' ? 'sidebar-btn active' : 'sidebar-btn'}
              onClick={() => onSelectType('customer')}
            >
              Customers
            </Button>
        </div>
    </div>
  )
}

export default Sidebar