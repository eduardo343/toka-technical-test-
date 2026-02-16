import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { login } from "../../state/authSlice";

export default function Login() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(login({ email, password }));
    if (login.fulfilled.match(res)) nav("/users");
  };

  return (
    <div style={{ maxWidth: 360, margin: "48px auto" }}>
      <h2>Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
        />
        <button disabled={loading} type="submit">
          {loading ? "..." : "Entrar"}
        </button>
        {error ? <small style={{ color: "crimson" }}>{error}</small> : null}
      </form>
    </div>
  );
}
