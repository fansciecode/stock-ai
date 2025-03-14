const Button = ({ children, onClick, className }) => {
    return (
      <button className={`btn ${className}`} onClick={onClick}>
        {children}
      </button>
    );
  };
  
  export default Button;
  