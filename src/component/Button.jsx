import './Button.css'

const Button = ({ onClick }) => {
  return (
    <button className="Button" onClick={onClick}> @Refresh</button>
  )
}

export default Button