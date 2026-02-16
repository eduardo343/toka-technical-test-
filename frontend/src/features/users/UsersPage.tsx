import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearUsersMessages,
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  type UserItem,
} from "../../state/usersSlice";
import { logout } from "../../state/authSlice";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getUserId(user: UserItem): string | null {
  return user.id ?? user._id ?? null;
}

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { items, loading, creating, updating, deleting, error, success } = useAppSelector(
    (s) => s.users
  );

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [createSubmitted, setCreateSubmitted] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editSubmitted, setEditSubmitted] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const isBusy = loading || creating || updating || deleting;

  const createEmailValid = useMemo(() => emailRegex.test(newEmail.trim()), [newEmail]);
  const createNameValid = useMemo(() => newName.trim().length >= 2, [newName]);
  const createFormValid = createEmailValid && createNameValid;

  const editEmailValid = useMemo(() => emailRegex.test(editingEmail.trim()), [editingEmail]);
  const editNameValid = useMemo(() => editingName.trim().length >= 2, [editingName]);
  const editFormValid = editEmailValid && editNameValid;

  const onFieldChange = () => {
    if (error || success) {
      dispatch(clearUsersMessages());
    }
  };

  const onRefresh = () => {
    dispatch(fetchUsers());
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitted(true);

    if (!createFormValid) {
      return;
    }

    const result = await dispatch(
      createUser({ email: newEmail.trim().toLowerCase(), name: newName.trim() })
    );

    if (createUser.fulfilled.match(result)) {
      setNewEmail("");
      setNewName("");
      setCreateSubmitted(false);
    }
  };

  const startEdit = (user: UserItem) => {
    const userId = getUserId(user);
    if (!userId) {
      return;
    }

    setEditingUserId(userId);
    setEditingEmail((user.email ?? "").trim());
    setEditingName((user.name ?? user.fullName ?? "").trim());
    setEditSubmitted(false);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditingEmail("");
    setEditingName("");
    setEditSubmitted(false);
  };

  const saveEdit = async () => {
    setEditSubmitted(true);
    if (!editingUserId || !editFormValid) {
      return;
    }

    const result = await dispatch(
      updateUser({
        id: editingUserId,
        email: editingEmail.trim().toLowerCase(),
        name: editingName.trim(),
      })
    );

    if (updateUser.fulfilled.match(result)) {
      cancelEdit();
    }
  };

  const onDelete = async (user: UserItem) => {
    const userId = getUserId(user);
    if (!userId) {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar usuario ${user.email ?? userId}?`);
    if (!confirmed) {
      return;
    }

    await dispatch(deleteUser({ id: userId }));
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Users</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onRefresh} disabled={isBusy}>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
          <button onClick={() => dispatch(logout())} disabled={isBusy}>
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={onCreateSubmit} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <h3>Crear usuario</h3>
        <input
          placeholder="email"
          type="email"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            onFieldChange();
          }}
          disabled={isBusy}
        />
        {createSubmitted && !createEmailValid ? (
          <small style={{ color: "crimson" }}>Ingresa un email válido</small>
        ) : null}
        <input
          placeholder="nombre"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            onFieldChange();
          }}
          disabled={isBusy}
        />
        {createSubmitted && !createNameValid ? (
          <small style={{ color: "crimson" }}>El nombre debe tener al menos 2 caracteres</small>
        ) : null}
        <button type="submit" disabled={isBusy}>
          {creating ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      {loading ? <p aria-live="polite">Cargando usuarios...</p> : null}
      {error ? (
        <div>
          <p style={{ color: "crimson" }}>{error}</p>
          <button onClick={onRefresh} disabled={isBusy}>
            Reintentar
          </button>
        </div>
      ) : null}
      {success ? <p style={{ color: "green" }}>{success}</p> : null}
      {!loading && !error && items.length === 0 ? <p>No hay usuarios para mostrar.</p> : null}

      <ul>
        {items.map((u) => (
          <li
            key={u.id ?? u._id ?? u.email}
            style={{ display: "grid", gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #ddd" }}
          >
            {editingUserId === getUserId(u) ? (
              <>
                <input
                  value={editingEmail}
                  type="email"
                  onChange={(e) => {
                    setEditingEmail(e.target.value);
                    onFieldChange();
                  }}
                  disabled={isBusy}
                />
                {editSubmitted && !editEmailValid ? (
                  <small style={{ color: "crimson" }}>Ingresa un email válido</small>
                ) : null}
                <input
                  value={editingName}
                  onChange={(e) => {
                    setEditingName(e.target.value);
                    onFieldChange();
                  }}
                  disabled={isBusy}
                />
                {editSubmitted && !editNameValid ? (
                  <small style={{ color: "crimson" }}>El nombre debe tener al menos 2 caracteres</small>
                ) : null}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveEdit} disabled={isBusy}>
                    {updating ? "Guardando..." : "Guardar"}
                  </button>
                  <button onClick={cancelEdit} disabled={isBusy}>
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span>
                  {u.name ?? u.fullName ?? "(sin nombre)"} — {u.email ?? ""}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(u)} disabled={isBusy || !getUserId(u)}>
                    Editar
                  </button>
                  <button onClick={() => onDelete(u)} disabled={isBusy || !getUserId(u)}>
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
