import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsersStart, fetchUsersSuccess, fetchUsersFail } from "../store/userSlice.js";
import axios from "axios";

const Users = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);

  useEffect(() => {
    const fetchUsers = async () => {
      dispatch(fetchUsersStart());
      try {
        const res = await axios.get("/api/admin/users");
        dispatch(fetchUsersSuccess(res.data));
      } catch (error) {
        dispatch(fetchUsersFail());
      }
    };

    fetchUsers();
  }, [dispatch]);

  return (
    <div>
      <h2>Users</h2>
      {loading ? <p>Loading...</p> : users.map((user) => <p key={user.id}>{user.name}</p>)}
    </div>
  );
};

export default Users;
