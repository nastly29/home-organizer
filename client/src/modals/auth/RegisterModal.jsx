import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionModal from "../../components/ActionModal";
import TextField from "../../components/TextField";
import PasswordField from "../../components/auth/PasswordField";
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from "./utils/validators";
import { apiRegister } from "../../firebase/authApi";

export default function RegisterModal({ open, onClose, onOpenLogin }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    pw: false,
    confirm: false,
  });

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPw("");
      setConfirm("");
      setTouched({ name: false, email: false, pw: false, confirm: false });
      setServerError("");
      setLoading(false);
    }
  }, [open]);

  const errors = useMemo(() => {
    return {
      name: touched.name && !name.trim() ? "Вкажіть імʼя" : "",
      email: touched.email ? validateEmail(email) : "",
      pw: touched.pw ? validatePassword(pw) : "",
      confirm: touched.confirm ? validateConfirmPassword(pw, confirm) : "",
    };
  }, [name, email, pw, confirm, touched]);

  async function submit(e) {
    e.preventDefault();

    setTouched({ name: true, email: true, pw: true, confirm: true });
    setServerError("");

    if (!name.trim()) return;
    if (validateEmail(email)) return;
    if (validatePassword(pw)) return;
    if (validateConfirmPassword(pw, confirm)) return;

    try {
      setLoading(true);
      await apiRegister({ email: email.trim(), password: pw, displayName: name.trim() });
      onClose?.();
      navigate("/dashboard");
    } catch (err) {
      setServerError("Не вдалося створити акаунт");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionModal
      open={open}
      title="Реєстрація"
      subtitle="Створіть акаунт, щоб почати користуватися сервісом"
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        {serverError ? (
          <div className="alert alert-danger auth-alert">{serverError}</div>
        ) : null}

        <TextField
          id="regName"
          label="Імʼя"
          placeholder="Наприклад, Анастасія"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (serverError) setServerError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={errors.name}
          autoComplete="name"
        />

        <TextField
          id="regEmail"
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
          id="regPw"
          label="Пароль"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            if (serverError) setServerError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
          error={errors.pw}
          autoComplete="new-password"
        />

        <PasswordField
          id="regConfirm"
          label="Повторіть пароль"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (serverError) setServerError("");
          }}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Створення..." : "Створити акаунт"}
        </button>

        <div className="auth-switch">
          Уже є акаунт?{" "}
          <button type="button" className="auth-link" onClick={onOpenLogin}>
            Увійти
          </button>
        </div>
      </form>
    </ActionModal>
  );
}
