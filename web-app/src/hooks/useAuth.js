import { useState, useEffect } from "react";
import { getUser } from "../services/userService";

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUser();
        setUser(data);
      } catch (error) {
        console.error("Authentication error:", error);
      }
    };
    fetchUser();
  }, []);

  return user;
};

export default useAuth;
