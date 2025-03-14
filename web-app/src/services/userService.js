const API_URL = process.env.REACT_APP_API_URL;

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response.ok;
  } catch (error) {
    console.error("Registration error:", error);
    return false;
  }
};

// const API_URL = "/api/users";

export const getUser = async () => {
  const response = await fetch(`${API_URL}/me`, { credentials: "include" });
  return response.json();
};

export const updateUser = async (userData) => {
  const response = await fetch(`${API_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return response.json();
};
