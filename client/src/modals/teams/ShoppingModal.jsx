import { useEffect, useMemo, useState } from "react";
import ActionModal from "../../components/ActionModal";

const UNITS = ["шт", "кг", "г", "л", "мл", "пач", "уп"];

export default function ShoppingModal({
  open,
  mode = "create", 
  item = null,
  onClose,
  onSubmit,
  submitting = false,
  categories = [],
}) {
  const [title, setTitle] = useState("");
  const [qtyValue, setQtyValue] = useState("");
  const [qtyUnit, setQtyUnit] = useState("шт");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("groceries");
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => title.trim().length >= 2 && !submitting,
    [title, submitting]
  );

  useEffect(() => {
    if (!open) return;

    setError("");

    if (mode === "edit" && item) {
      setTitle(item?.title || "");
      setQtyValue(
        item?.qtyValue === null || item?.qtyValue === undefined ? "" : String(item.qtyValue)
      );
      setQtyUnit(item?.qtyUnit || "шт");
      setNote(item?.note || "");
      setCategory(item?.category || "groceries");
    } else {
      setTitle("");
      setQtyValue("");
      setQtyUnit("шт");
      setNote("");
      setCategory("groceries");
    }
  }, [open, mode, item]);

  function handleClose() {
    if (submitting) return;
    onClose?.();
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError("");

    const t = title.trim();
    if (t.length < 2) {
      setError("Вкажіть назву (мінімум 2 символи).");
      return;
    }

    let qtyNum = null;
    const q = String(qtyValue ?? "").trim();
    if (q) {
      const parsed = Number(q.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError("Кількість має бути додатнім числом.");
        return;
      }
      qtyNum = parsed;
    }

    const payload = {
      title: t,
      qtyValue: qtyNum,
      qtyUnit: qtyNum ? String(qtyUnit || "").trim() : "",
      note: String(note || "").trim(),
      category: String(category || "").trim() || "other",
    };

    try {
      await onSubmit?.(payload);
    } catch (err) {
      setError(err?.message || "INTERNAL_ERROR");
    }
  }

  return (
    <ActionModal
      open={open}
      title={mode === "edit" ? "Редагувати покупку" : "Додати покупку"}
      onClose={handleClose}
    >
      <form className="shopping-modal" onSubmit={handleSubmit}>
        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="shopping-modal__field">
          <label className="shopping-modal__label">Назва(мінімум 2 символи)</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Наприклад, молоко"
            disabled={submitting}
          />
        </div>

        <div className="shopping-modal__row">
          <div className="shopping-modal__field">
            <label className="shopping-modal__label">Кількість (необовʼязково)</label>
            <input
              className="form-control"
              value={qtyValue}
              onChange={(e) => setQtyValue(e.target.value)}
              placeholder="Наприклад, 2"
              disabled={submitting}
              inputMode="decimal"
            />
          </div>

          <div className="shopping-modal__field">
            <label className="shopping-modal__label">Одиниця</label>
            <select
              className="form-select"
              value={qtyUnit}
              onChange={(e) => setQtyUnit(e.target.value)}
              disabled={submitting}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="shopping-modal__field">
          <label className="shopping-modal__label">Категорія</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="shopping-modal__field">
          <label className="shopping-modal__label">Примітка (необовʼязково)</label>
          <textarea
            className="form-control"
            rows={1}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Наприклад, без цукру / по акції"
            disabled={submitting}
          />
        </div>

        <div className="shopping-modal__actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleClose}
            disabled={submitting}
          >
            Скасувати
          </button>

          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            {submitting ? "Збереження..." : mode === "edit" ? "Зберегти" : "Додати"}
          </button>
        </div>
      </form>
    </ActionModal>
  );
}
