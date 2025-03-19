import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-500 p-4 flex justify-between items-center">
      <h1 className="text-white text-lg">MyApp</h1>
      <div className="space-x-4">
        <Link className="text-white" to="/dashboard">Dashboard</Link>
        <Link className="text-white" to="/profile">Profile</Link>
      </div>
    </nav>
  );
};

export default Navbar;
