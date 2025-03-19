import axios from "axios";

export const getUsers = async () => {
  const res = await axios.get("/api/admin/users");
  return res.data;
};
