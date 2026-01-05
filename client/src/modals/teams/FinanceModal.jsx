import { useEffect, useMemo, useState } from "react";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function FinanceModal({
  open,
  mode = "create",
  item = null,
  members = [],
  meUid = "",
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [spenderUid, setSpenderUid] = useState(meUid || "");
  const [spentDate, setSpentDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");

  const title = mode === "edit" ? "Редагувати витрату" : "Додати витрату";

  const sortedMembers = useMemo(() => {
    const list = Array.isArray(members) ? [...members] : [];
    list.sort((a, b) => (a.uid === meUid ? -1 : b.uid === meUid ? 1 : 0));
    return list;
  }, [members, meUid]);

  useEffect(() => {
    if (!open) return;

    setLocalError("");

    if (mode === "edit" && item) {
      setSpenderUid(item.spenderUid || meUid || "");
      setSpentDate(item.spentDate || todayISO());
      setAmount(item.amount != null ? String(item.amount) : "");
      setNote(item.note || "");
    } else {
      setSpenderUid(meUid || "");
      setSpentDate(todayISO());
      setAmount("");
      setNote("");
    }
  }, [open, mode, item, meUid]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError("");

    const sp = String(spenderUid || "").trim();
    const d = String(spentDate || "").trim();
    const n = Number(String(amount || "").replace(",", "."));

    if (!sp) return setLocalError("Оберіть, чия це витрата.");
    if (!d) return setLocalError("Оберіть дату витрати.");
    if (!Number.isFinite(n) || n <= 0) return setLocalError("Введіть коректну суму (більше 0).");

    if (mode === "create") {
      onSubmit?.({
        spenderUid: sp,
        spentDate: d,
        amount: n,
        note: String(note || "").trim(),
      });
      return;
    }
    
    onSubmit?.({
      spentDate: d,
      amount: n,
      note: String(note || "").trim(),
    });
    
  }

  return (
    <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
      <div className="auth-modal finance-modal">
        <div className="task-modal__head">
          <div className="task-modal__title">{title}</div>

          <button type="button" className="task-modal__close" onClick={onClose} disabled={submitting} aria-label="Закрити">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <div className="auth-modal__body">
          {localError ? <div className="alert alert-danger">{localError}</div> : null}

          <form onSubmit={handleSubmit}>
            <div className="finance-modal__field">
                {mode === "create" ? (
                  <div className="finance-modal__field">
                    <label className="finance-modal__label">Оплатив(ла)</label>
                    <select
                      className="form-select"
                      value={spenderUid}
                      onChange={(e) => setSpenderUid(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="">— Оберіть —</option>
                      {sortedMembers.map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {(m.displayName || m.email || "Без імені") + (m.uid === meUid ? " (Ви)" : "")}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
            </div>

            <div className="finance-modal__row">
              <div className="finance-modal__field">
                <label className="finance-modal__label">Дата витрати</label>
                <input
                  type="date"
                  className="form-control"
                  value={spentDate}
                  onChange={(e) => setSpentDate(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="finance-modal__field">
                <label className="finance-modal__label">Сума (грн)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="finance-modal__field">
              <label className="finance-modal__label">Нотатка</label>
              <textarea
                className="form-control"
                rows={1}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Наприклад: продукти, ліки, побутова хімія..."
                disabled={submitting}
              />
            </div>

            <div className="finance-modal__actions">
              <button type="button" className="btn btn-outline-primary" onClick={onClose} disabled={submitting}>
                Скасувати
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {mode === "edit" ? "Зберегти" : "Створити"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
