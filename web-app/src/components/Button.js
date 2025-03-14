import React from "react";

const Button = ({ label, onClick, className }) => {
  return (
    <button className={`p-2 rounded ${className}`} onClick={onClick}>
      {label}
    </button>
  );
};

export default Button;
