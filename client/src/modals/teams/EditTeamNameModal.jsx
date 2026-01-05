import { useEffect, useMemo, useState } from "react";
import ActionModal from "../../components/ActionModal";
import TextField from "../../components/TextField";

export default function EditTeamNameModal({
  open,
  onClose,
  initialName = "",
  onSave,
  loading = false,
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialName || "");
    setError("");
  }, [open, initialName]);

  const nameError = useMemo(() => {
    const v = (name || "").trim();
    if (v.length === 0) return "Введіть назву команди.";
    if (v.length < 2) return "Назва має бути мінімум 2 символи.";
    return "";
  }, [name]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (nameError) {
      setError(nameError);
      return;
    }

    try {
      await onSave?.(name.trim());
      onClose?.();
    } catch (err) {
      setError(err?.message || "Не вдалося оновити назву");
    }
  }

  return (
    <ActionModal open={open} title="Змінити назву команди" onClose={onClose}>
      {error ? <div className="alert alert-danger auth-alert">{error}</div> : null}

      <form onSubmit={submit} noValidate>
        <TextField
          id="teamName"
          label="Назва команди"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError && name ? nameError : ""} 
        />

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Збереження..." : "Зберегти"}
        </button>
      </form>
    </ActionModal>
  );
}
