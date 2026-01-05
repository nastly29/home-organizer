import { useEffect, useState } from "react";
import ActionModal from "../../components/ActionModal";

export default function DeleteTeamModal({ open, onClose, teamName = "команду", onDelete, loading }) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    const ok = window.confirm(
      `Ви впевнені, що хочете видалити "${teamName}"? Це назавжди видалить команду та дані.`
    );
    if (!ok) return;

    try {
      await onDelete?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Не вдалося видалити команду");
    }
  }

  return (
    <ActionModal open={open} title="Видалити групу" onClose={onClose}>
      {error ? <div className="alert alert-danger auth-alert">{error}</div> : null}

      <form onSubmit={submit} noValidate>
        <p>
          Ви збираєтесь назавжди видалити групу <strong>«{teamName}»</strong>.
        </p>

        <button className="btn btn-danger w-100" disabled={loading}>
          {loading ? "Видалення..." : "Видалити"}
        </button>

        <div className="modal-danger-text">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>Цю дію неможливо скасувати.</span>
        </div>
      </form>
    </ActionModal>
  );
}
