import { useEffect, useMemo, useState } from "react";

export default function TaskModal({
  open,
  mode = "create",
  task,
  members = [],
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [assignees, setAssignees] = useState([]);

  useEffect(() => {
    if (!open) return;

    setTitle(task?.title || "");
    setDueDate(task?.dueDate || "");
    setDueTime(task?.dueTime || "");
    setAssignees(Array.isArray(task?.assignees) ? task.assignees : []);
  }, [open, task]);

  const sortedMembers = useMemo(() => {
    const arr = [...members];
    arr.sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      return 0;
    });
    return arr;
  }, [members]);

  function toggleAssignee(uid) {
    setAssignees((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      title: title.trim(),
      dueDate: (dueDate || "").trim(),
      dueTime: (dueTime || "").trim(),
      assignees,
    };

    onSubmit?.(payload);
  }

  if (!open) return null;

  return (
    <div className="task-modal__backdrop" role="dialog" aria-modal="true">
      <div className="task-modal">
        <div className="task-modal__head">
          <div className="task-modal__title">
            {mode === "edit" ? "Редагування завдання" : "Створити завдання"}
          </div>

          <button
            type="button"
            className="task-modal__close"
            onClick={onClose}
            disabled={submitting}
            title="Закрити"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form className="task-modal__form" onSubmit={handleSubmit}>
          <div className="task-modal__field">
            <label className="task-modal__label">Назва(мінімум 2 символи)</label>
            <input
              className="form-control"
              value={title}
              placeholder="Наприклад, прибрати в кімнатах"
              onChange={(e) => setTitle(e.target.value)}
              minLength={2}
              required
              disabled={submitting}
            />
          </div>

          <div className="task-modal__grid">
            <div className="task-modal__field">
              <label className="task-modal__label">Дата виконання (необов’язково)</label>
              <input
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="task-modal__field">
              <label className="task-modal__label">Час виконання (необов’язково)</label>
              <input
                type="time"
                className="form-control"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={submitting || !dueDate}
                title={!dueDate ? "Спочатку виберіть дату" : ""}
              />
              <div className="task-modal__hint">Без часу — дедлайн в кінці дня (23:59:59).</div>
            </div>
          </div>

          <div className="task-modal__field">
            <label className="task-modal__label">Виконавці (1 або більше)</label>

            <div className="task-modal__members">
              {sortedMembers.map((m) => {
                const checked = assignees.includes(m.uid);
                const label = m.displayName || m.email || "Без імені";

                return (
                  <label key={m.uid} className={`task-modal__member ${checked ? "is-checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAssignee(m.uid)}
                      disabled={submitting}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>

            {assignees.length === 0 ? (
              <div className="task-modal__error">Оберіть хоча б одного виконавця.</div>
            ) : null}
          </div>

          <div className="task-modal__actions">
            <button type="button" className="btn btn-outline-primary" onClick={onClose} disabled={submitting}>
              Скасувати
            </button>

            <button type="submit" className="btn btn-primary" disabled={submitting || assignees.length === 0}>
              {submitting ? "Збереження..." : mode === "edit" ? "Зберегти" : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
