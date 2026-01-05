import { useEffect, useMemo, useState } from "react";

export default function EventModal({
  open = false,
  mode = "create", 
  event = null,
  defaultDate = "",
  submitting = false,
  onClose,
  onSubmit,
  onDelete,
}) {
  const isEdit = mode === "edit";

  const initialDate = useMemo(() => {
    if (isEdit && event?.date) return event.date;
    if (defaultDate) return defaultDate;
    return "";
  }, [isEdit, event, defaultDate]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(isEdit ? (event?.title || "") : "");
    setDate(initialDate);
    setTime(isEdit ? (event?.time || "") : "");
    setPlace(isEdit ? (event?.place || "") : "");
    setNote(isEdit ? (event?.note || "") : "");
  }, [open, isEdit, event, initialDate]);

  if (!open) return null;

  const canSubmit = title.trim().length >= 2 && String(date || "").trim().length > 0 && !submitting;

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit?.({
      title: title.trim(),
      date: String(date || "").trim(),
      time: String(time || "").trim(), 
      place: place.trim(),
      note: note.trim(),
    });
  }

  return (
    <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
      <div className="auth-modal event-modal">
        <div className="event-modal__head">
          <div className="event-modal__title">{isEdit ? "Редагування події" : "Нова подія"}</div>

          <button type="button" className="event-modal__close" onClick={onClose} disabled={submitting}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="auth-modal__body">
          <form onSubmit={submit}>
            <div className="event-modal__field">
              <label className="event-modal__label">Назва(мінімум 2 символи)</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Наприклад, зустріч з командою"
                disabled={submitting}
                required
              />
            </div>

            <div className="event-modal__row">
              <div className="event-modal__field">
                <label className="event-modal__label">Дата</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="event-modal__field">
                <label className="event-modal__label">Час (необов’язково)</label>
                <input
                  type="time"
                  className="form-control"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="event-modal__field">
              <label className="event-modal__label">Місце (необов’язково)</label>
              <input
                className="form-control"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Наприклад, Офіс / Кав’ярня"
                disabled={submitting}
              />
            </div>

            <div className="event-modal__field">
              <label className="event-modal__label">Нотатка (необов’язково)</label>
              <textarea
                className="form-control"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Короткі деталі події"
                disabled={submitting}
                rows={1}
              />
            </div>

            <div className="event-modal__actions">
              {isEdit ? (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={submitting}
                  onClick={() => onDelete?.(event)}
                  title="Видалити подію"
                >
                  <i className="bi bi-trash" /> Видалити
                </button>
              ) : null}

              <button type="button" className="btn btn-outline-primary" onClick={onClose} disabled={submitting}>
                Скасувати
              </button>

              <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                {submitting ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
