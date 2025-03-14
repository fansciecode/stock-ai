import React, { useEffect, useState } from "react";
import Profile from "../components/Profile";
import authService from "../services/authService";

const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    authService.getCurrentUser().then(setUser);
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>Profile</h2>
      <Profile user={user} />
    </div>
  );
};

export default UserProfile;
