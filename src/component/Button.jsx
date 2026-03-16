import './Button.css'

const Button = ({ children, onClick, className = '', type = 'button', ...props }) => {
  return (
    <button 
      type={type} 
      className={`Button ${className}`} 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button