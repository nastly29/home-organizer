import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionModal from "../../components/ActionModal";
import TextField from "../../components/TextField";
import PasswordField from "../../components/auth/PasswordField";
import { validateEmail, validatePassword } from "./utils/validators";
import { apiLogin } from "../../firebase/authApi";

export default function LoginModal({ open, onClose, onOpenRegister, onOpenForgot }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setTouched({ email: false, password: false });
      setServerError("");
      setLoading(false);
    }
  }, [open]);

  const errors = useMemo(() => {
    return {
      email: touched.email ? validateEmail(email) : "",
      password: touched.password ? validatePassword(password) : "",
    };
  }, [email, password, touched]);

  async function submit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setServerError("");

    const e1 = validateEmail(email);
    const e2 = validatePassword(password);
    if (e1 || e2) return;

    try {
      setLoading(true);
      await apiLogin({ email: email.trim(), password });
      onClose?.();
      navigate("/dashboard");
    } catch (err) {
      setServerError("Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionModal
      open={open}
      title="Вхід"
      subtitle="Увійдіть, щоб перейти до ваших команд"
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        {serverError ? (
          <div className="alert alert-danger auth-alert">{serverError}</div>
        ) : null}

        <TextField
          id="loginEmail"
          label="Email"
          type="email"
          placeholder="name@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (serverError) setServerError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={errors.email}
          autoComplete="email"
        />

        <PasswordField
          id="loginPassword"
          label="Пароль"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (serverError) setServerError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="auth-row">
          <button type="button" className="auth-link" onClick={onOpenForgot}>
            Забули пароль?
          </button>
        </div>

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Вхід..." : "Увійти"}
        </button>

        <div className="auth-switch">
          Немає акаунта?{" "}
          <button type="button" className="auth-link" onClick={onOpenRegister}>
            Зареєструватися
          </button>
        </div>
      </form>
    </ActionModal>
  );
}
