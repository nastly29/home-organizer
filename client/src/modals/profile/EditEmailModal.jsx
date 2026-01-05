import { useEffect, useMemo, useState } from "react";
import ActionModal from "../../components/ActionModal";
import TextField from "../../components/TextField";
import PasswordField from "../../components/auth/PasswordField";
import { validateEmail } from "../auth/utils/validators";
import { apiReauthWithPassword, apiUpdateEmail,apiEmailExists } from "../../firebase/authApi";

export default function EditEmailModal({
  open,
  onClose,
  initialEmail = "",
  currentEmail = "",
  mapError,
  onInfo,
}) {
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);

  const emailErrorLive = useMemo(() => validateEmail(email), [email]);

  useEffect(() => {
    if (!open) return;
    setEmail(initialEmail || "");
    setCurrentPassword("");

    setModalError("");
    setFieldErrors({ email: "", password: "" });
    setTouched({ email: false, password: false });
    setLoading(false);
  }, [open, initialEmail]);

  function normalizeEmail(v) {
    return (v || "").trim().toLowerCase();
  }

  function validateAll() {
    const next = { email: "", password: "" };

    const emErr = validateEmail(email);
    if (emErr) next.email = emErr;

    if (!next.email && normalizeEmail(email) === normalizeEmail(currentEmail)) {
      next.email = "Це ваш поточний email. Введіть інший.";
    }

    if (!currentPassword) next.password = "Введіть поточний пароль для підтвердження.";

    setFieldErrors(next);
    return !(next.email || next.password);
  }

  async function submit(e) {
    e.preventDefault();
    setModalError("");
    setTouched({ email: true, password: true });

    const { exists } = await apiEmailExists(email.trim());
    if (exists) {
      setTouched((t) => ({ ...t, email: true }));
      setFieldErrors((s) => ({ ...s, email: "Такий email вже використовується іншим акаунтом." }));
      setLoading(false);
      return;
    }

    const ok = validateAll();
    if (!ok) return;

    try {
      setLoading(true);
      await apiReauthWithPassword(currentPassword);
      await apiUpdateEmail(email.trim());

      onClose?.();
      onInfo?.(
        `Лист для підтвердження надіслано на: ${email.trim()}.
        Перейдіть за посиланням у листі, щоб завершити зміну.
        Після підтвердження вам потрібно буде знову увійти в акаунт, використовуючи нову email-адресу.`
      );      
    } catch (err) {
      setModalError(mapError ? mapError(err) : err?.message || "Сталася помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionModal open={open} title="Змінити email" onClose={onClose}>
      {modalError ? <div className="alert alert-danger auth-alert">{modalError}</div> : null}

      <form onSubmit={submit} noValidate>
        <TextField
          id="modalEmail"
          label="Електронна пошта"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((s) => ({ ...s, email: "" }));
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, email: true }));
            const err = validateEmail(email);
            setFieldErrors((s) => ({ ...s, email: err || "" }));
          }}
          error={touched.email ? (fieldErrors.email || emailErrorLive) : ""}
        />

        <PasswordField
          id="modalEmailPw"
          label="Пароль"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setFieldErrors((s) => ({ ...s, password: "" }));
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, password: true }));
            if (!currentPassword) {
              setFieldErrors((s) => ({
                ...s,
                password: "Введіть поточний пароль для підтвердження.",
              }));
            }
          }}
          error={touched.password ? fieldErrors.password : ""}
        />

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Надсилання..." : "Зберегти"}
        </button>
      </form>
    </ActionModal>
  );
}
