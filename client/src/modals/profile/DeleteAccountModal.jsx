import { useEffect, useState } from "react";
import ActionModal from "../../components/ActionModal";
import PasswordField from "../../components/auth/PasswordField";
import { apiReauthWithPassword, apiDeleteAccount } from "../../firebase/authApi";

export default function DeleteAccountModal({ open, onClose, mapError }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setModalError("");
    setPasswordError("");
    setTouched(false);
    setLoading(false);
  }, [open]);

  function validate() {
    if (!currentPassword) {
      setPasswordError("Введіть поточний пароль для підтвердження.");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function submit(e) {
    e.preventDefault();
    setModalError("");
    setTouched(true);

    const okField = validate();
    if (!okField) return;

    const ok = window.confirm("Ви впевнені? Цю дію неможливо скасувати.");
    if (!ok) return;

    try {
      setLoading(true);
      await apiReauthWithPassword(currentPassword);
      await apiDeleteAccount();
    } catch (err) {
      setModalError(mapError ? mapError(err) : err?.message || "Сталася помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionModal open={open} title="Видалити акаунт" onClose={onClose}>
      {modalError ? <div className="alert alert-danger auth-alert">{modalError}</div> : null}

      <form onSubmit={submit} noValidate>
        <div className="profile-modal__danger">
          Ця дія незворотна. Підтвердіть поточним паролем.
        </div>

        <PasswordField
          id="modalDeletePw"
          label="Пароль"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            if (passwordError) setPasswordError("");
          }}
          onBlur={() => {
            setTouched(true);
            validate();
          }}
          error={touched ? passwordError : ""}
        />

        <button className="btn btn-danger w-100" disabled={loading}>
          {loading ? "Видалення..." : "Видалити"}
        </button>
      </form>
    </ActionModal>
  );
}
