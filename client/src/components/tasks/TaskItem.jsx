import { useMemo } from "react";

function formatDeadline(dueDate, dueTime) {
  const d = (dueDate || "").trim();
  const t = (dueTime || "").trim();
  if (!d && !t) return "";
  if (d && t) return `${d} · ${t}`;
  if (d) return d;
  return t;
}

export default function TaskItem({
  task,
  meUid,
  membersMap = new Map(), 
  onToggleComplete,
  onEdit,
  onDelete,
}) {
  const isAssignee = useMemo(() => {
    const a = Array.isArray(task?.assignees) ? task.assignees : [];
    return a.includes(meUid);
  }, [task, meUid]);

  const isAuthor = task?.createdBy === meUid;

  const assigneeLabels = useMemo(() => {
    const a = Array.isArray(task?.assignees) ? task.assignees : [];
    return a
      .map((uid) => membersMap.get(uid))
      .filter(Boolean)
      .map((m) => m.displayName || m.email || "Без імені");
  }, [task, membersMap]);

  return (
    <div className={`task-card ${task?.completed ? "is-completed" : ""}`}>
      <div className="task-card__left">
        <input
          type="checkbox"
          className="form-check-input task-card__check"
          checked={!!task?.completed}
          disabled={!isAssignee}
          title={isAssignee ? "Позначити виконаним" : "Лише відповідальні можуть позначати виконання"}
          onChange={() => onToggleComplete?.(task)}
        />

        <div className="task-card__meta">
          <div className="task-card__title">{task?.title || "Без назви"}</div>

          <div className="task-card__sub">
          {formatDeadline(task?.dueDate, task?.dueTime) ? (
            <span className="task-card__deadline">
              <i className="bi bi-clock" />
              {formatDeadline(task?.dueDate, task?.dueTime)}
            </span>
          ) : null}

            {assigneeLabels.length ? (
              <div className="task-card__assignees">
                <i className="bi bi-people-fill task-card__assignees-icon" />

                <div className="task-card__assignees-list">
                  {assigneeLabels.map((name) => (
                    <span key={name} className="task-card__assignee">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="task-card__actions">
        {isAuthor ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onEdit?.(task)}
              title="Редагувати"
            >
              <i className="bi bi-pencil" /> </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onDelete?.(task)}
              title="Видалити"
            >
              <i className="bi bi-trash" /></button>
          </>
        ) : null}
      </div>
    </div>
  );
}
