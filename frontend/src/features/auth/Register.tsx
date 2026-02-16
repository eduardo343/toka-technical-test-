import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { clearAuthMessages, register } from "../../state/authSlice";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { registerLoading, registerError, registerSuccess } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailValid = emailRegex.test(email.trim());
  const passwordValid = password.trim().length >= 6;
  const formValid = emailValid && passwordValid;

  useEffect(() => {
    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formValid) {
      return;
    }

    const result = await dispatch(register({ email, password }));
    if (register.fulfilled.match(result)) {
      navigate("/users");
    }
  };

  const clearMessages = () => {
    if (registerError || registerSuccess) {
      dispatch(clearAuthMessages());
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "48px auto" }}>
      <h2>Register</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearMessages();
          }}
          placeholder="email"
          type="email"
          autoComplete="email"
          aria-label="Email"
          disabled={registerLoading}
        />
        {submitted && !emailValid ? (
          <small style={{ color: "crimson" }}>Ingresa un email válido</small>
        ) : null}
        <input
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearMessages();
          }}
          placeholder="password"
          type="password"
          autoComplete="new-password"
          aria-label="Password"
          disabled={registerLoading}
        />
        {submitted && !passwordValid ? (
          <small style={{ color: "crimson" }}>La contraseña debe tener al menos 6 caracteres</small>
        ) : null}
        <button disabled={registerLoading} type="submit">
          {registerLoading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
        {registerError ? <small style={{ color: "crimson" }}>{registerError}</small> : null}
        {registerSuccess ? <small style={{ color: "green" }}>{registerSuccess}</small> : null}
        <small>
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </small>
      </form>
    </div>
  );
}
