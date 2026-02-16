import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchUsers } from "../../state/usersSlice";
import { logout } from "../../state/authSlice";

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div style={{ maxWidth: 720, margin: "24px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Users</h2>
        <button onClick={() => dispatch(logout())}>Logout</button>
      </div>

      {loading ? <p>Cargando...</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <ul>
        {items.map((u) => (
          <li key={u.id ?? u._id ?? u.email}>
            {u.name ?? u.fullName ?? "(sin nombre)"} — {u.email ?? ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
