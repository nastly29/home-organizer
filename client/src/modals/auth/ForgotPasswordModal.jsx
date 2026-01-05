import { useEffect, useMemo, useState } from "react";
import ActionModal from "../../components/ActionModal";
import TextField from "../../components/TextField";
import { validateEmail } from "./utils/validators";
import { apiForgotPassword } from "../../firebase/authApi";

export default function ForgotPasswordModal({ open, onClose, onOpenLogin }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [info, setInfo] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setTouched(false);
      setInfo("");
      setErrMsg("");
      setLoading(false);
    }
  }, [open]);

  const error = useMemo(() => (touched ? validateEmail(email) : ""), [email, touched]);

  async function submit(e) {
    e.preventDefault();
    setTouched(true);
    setInfo("");
    setErrMsg("");

    if (validateEmail(email)) return;

    try {
      setLoading(true);
      await apiForgotPassword(email.trim());
      setInfo("Лист для відновлення пароля надіслано. Перевірте пошту.");
    } catch (e2) {
      setErrMsg("Не вдалося надіслати лист. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionModal
      open={open}
      title="Відновлення пароля"
      subtitle="Введіть email — ми надішлемо посилання для скидання пароля"
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        {info ? <div className="alert alert-success auth-alert">{info}</div> : null}
        {errMsg ? <div className="alert alert-danger auth-alert">{errMsg}</div> : null}

        <TextField
          id="forgotEmail"
          label="Email"
          type="email"
          placeholder="name@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errMsg) setErrMsg("");
            if (info) setInfo("");
          }}
          onBlur={() => setTouched(true)}
          error={error}
          autoComplete="email"
        />

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Надсилання..." : "Надіслати лист"}
        </button>

        <div className="auth-switch">
          <button type="button" className="auth-link" onClick={onOpenLogin}>
            Повернутися до входу
          </button>
        </div>
      </form>
    </ActionModal>
  );
}
