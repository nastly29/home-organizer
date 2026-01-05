import { useEffect, useState } from "react";
import ActionModal from "../../components/ActionModal";
import TextField from "../../components/TextField";
import { apiUpdateDisplayName } from "../../firebase/authApi";

export default function EditNameModal({
  open,
  onClose,
  initialName = "",
  mapError,
  onSuccess,
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName || "");
    setError("");
    setLoading(false);
  }, [open, initialName]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Імʼя має містити мінімум 2 символи.");
      return;
    }

    try {
      setLoading(true);
      await apiUpdateDisplayName(trimmed);
      onSuccess?.(trimmed);
      onClose?.();
    } catch (err) {
      setError(mapError ? mapError(err) : err?.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionModal open={open} title="Змінити імʼя" onClose={onClose}>
      {error ? <div className="alert alert-danger auth-alert">{error}</div> : null}

      <form onSubmit={submit} noValidate>
        <TextField
          id="modalName"
          label="Імʼя користувача"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Збереження..." : "Зберегти"}
        </button>
      </form>
    </ActionModal>
  );
}
