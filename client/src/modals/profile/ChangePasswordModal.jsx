import { useEffect, useState } from "react";
import ActionModal from "../../components/ActionModal";
import PasswordField from "../../components/auth/PasswordField";
import { validatePassword, validateConfirmPassword } from "../auth/utils/validators";
import { apiReauthWithPassword, apiUpdatePassword } from "../../firebase/authApi";

export default function ChangePasswordModal({ open, onClose, mapError, onInfo }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [fieldErrors, setFieldErrors] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [modalError, setModalError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setTouched({ current: false, new: false, confirm: false });
    setFieldErrors({ current: "", new: "", confirm: "" });
    setModalError("");
    setLoading(false);
  }, [open]);

  function validateAll() {
    const next = { current: "", new: "", confirm: "" };

    if (!currentPassword) {
      next.current = "Введіть поточний пароль.";
    }

    const npwErr = newPassword ? validatePassword(newPassword) : "Введіть новий пароль.";
    if (npwErr) next.new = npwErr;

    const cpwErr = validateConfirmPassword(newPassword, confirmNewPassword);
    if (cpwErr) next.confirm = cpwErr;

    setFieldErrors(next);

    return !(next.current || next.new || next.confirm);
  }

  async function submit(e) {
    e.preventDefault();
    setModalError("");
    setTouched({ current: true, new: true, confirm: true });

    const ok = validateAll();
    if (!ok) return;

    try {
      setLoading(true);
      await apiReauthWithPassword(currentPassword);
      await apiUpdatePassword(newPassword);

      onClose?.();
      onInfo?.("Пароль успішно змінено.");
    } catch (err) {
      setModalError(mapError ? mapError(err) : err?.message || "Помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionModal open={open} title="Змінити пароль" onClose={onClose}>
      {modalError ? <div className="alert alert-danger auth-alert">{modalError}</div> : null}

      <form onSubmit={submit} noValidate>
        <PasswordField
          id="modalCurrentPw"
          label="Поточний пароль"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setFieldErrors((s) => ({ ...s, current: "" }));
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, current: true }));
            if (!currentPassword) {
              setFieldErrors((s) => ({ ...s, current: "Введіть поточний пароль." }));
            }
          }}
          error={touched.current ? fieldErrors.current : ""}
        />

        <PasswordField
          id="modalNewPw"
          label="Новий пароль"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setFieldErrors((s) => ({ ...s, new: "" }));
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, new: true }));
            const err = newPassword ? validatePassword(newPassword) : "Введіть новий пароль.";
            setFieldErrors((s) => ({ ...s, new: err || "" }));
          }}
          error={touched.new ? fieldErrors.new : ""}
        />

        <PasswordField
          id="modalConfirmPw"
          label="Повторіть новий пароль"
          value={confirmNewPassword}
          onChange={(e) => {
            setConfirmNewPassword(e.target.value);
            setFieldErrors((s) => ({ ...s, confirm: "" }));
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, confirm: true }));
            const err = validateConfirmPassword(newPassword, confirmNewPassword);
            setFieldErrors((s) => ({ ...s, confirm: err || "" }));
          }}
          error={touched.confirm ? fieldErrors.confirm : ""}
        />

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Збереження..." : "Змінити"}
        </button>
      </form>
    </ActionModal>
  );
}
