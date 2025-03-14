const Navbar = () => {
    return (
      <nav>
        <h2>Admin Panel</h2>
        <Link to="/">Dashboard</Link>
        <Link to="/events">Events</Link>
        <Link to="/subscriptions">Subscriptions</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>
    );
  };
  
  export default Navbar;
  