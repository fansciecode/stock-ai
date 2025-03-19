import React from "react";

const Profile = ({ user }) => {
  return (
    <div className="profile">
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
    </div>
  );
};

export default Profile;
