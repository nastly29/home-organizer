import { useEffect, useMemo, useState } from "react";
import ActionModal from "../../components/ActionModal";

export default function TransferOwnerModal({
  open,
  onClose,
  members = [],
  myUid = "",               
  onTransferAndLeave,         
  loading = false,
}) {
  const [selectedUid, setSelectedUid] = useState("");
  const [error, setError] = useState("");

  const options = useMemo(() => {
    const list = Array.isArray(members) ? members : [];
    return list.filter((m) => m?.uid && m.uid !== myUid); 
  }, [members, myUid]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSelectedUid(options[0]?.uid || "");
  }, [open, options]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!selectedUid) {
      setError("Оберіть учасника, якому передати права власника.");
      return;
    }

    try {
      await onTransferAndLeave?.(selectedUid);  
      onClose?.();
    } catch (err) {
      setError(err?.message || "Не вдалося передати права власника");
    }
  }

  return (
    <ActionModal open={open} title="Передати права власника" onClose={onClose}>
      {error ? <div className="alert alert-danger auth-alert">{error}</div> : null}

      <form onSubmit={submit} noValidate>
        <div className="modal-warning">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>Щоб покинути групу, потрібно призначити нового власника.</span>
        </div>

        <div className="member-list">
          {options.length === 0 ? (
            <div className="text-muted">Немає інших учасників для передачі прав.</div>
          ) : (
            options.map((m) => {
              const selected = selectedUid === m.uid;
              return (
                <label
                  key={m.uid}
                  className={`member-card ${selected ? "is-selected" : ""}`}
                >
                  <input
                    className="member-card__radio"
                    type="radio"
                    name="newOwner"
                    value={m.uid}
                    checked={selected}
                    onChange={() => setSelectedUid(m.uid)}
                  />

                  <span className="member-card__text">
                    <span className="member-card__name">{m.displayName || "Без імені"}</span>
                    <span className="member-card__email">{m.email || ""}</span>
                  </span>
                </label>
              );
            })
          )}
        </div>

        <button className="btn btn-primary w-100" disabled={loading || options.length === 0}>
          {loading ? "Збереження..." : "Передати і вийти"}
        </button>
      </form>
    </ActionModal>
  );
}
