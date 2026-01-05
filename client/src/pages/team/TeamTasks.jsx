import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import {
  apiListTeamMembers,
  apiListTeamTasks,
  apiCreateTeamTask,
  apiUpdateTeamTask,
  apiDeleteTeamTask,
  apiToggleTeamTaskComplete,
} from "../../firebase/authApi";

import TaskItem from "../../components/tasks/TaskItem";
import TaskModal from "../../modals/teams/TaskModal";


export default function TeamTasks() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const meUid = user?.uid || "";

  const [filter, setFilter] = useState("all");
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingTask, setEditingTask] = useState(null);

  const firstFilterRun = useRef(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const initRef = useRef({ teamId: null, started: false });

  const tasksReqSeq = useRef(0);
  const currentFilterRef = useRef(filter);

  useEffect(() => {
    currentFilterRef.current = filter;
  }, [filter]);

  const membersMap = useMemo(() => {
    return new Map((members || []).map((m) => [m.uid, m]));
  }, [members]);

  async function loadMembers() {
    setMembersLoading(true);
    const res = await apiListTeamMembers(teamId);
    setMembers(res?.members || []);
    setMembersLoading(false);
  }

  async function loadTasks(nextFilter = filter) {
    const reqId = ++tasksReqSeq.current;
  
    setLoading(true);
    setError("");
  
    try {
      const res = await apiListTeamTasks(teamId, nextFilter);

      if (reqId !== tasksReqSeq.current) return;
  
      setTasks(res?.tasks || []);
    } catch (e) {
      if (reqId !== tasksReqSeq.current) return;
      setTasks([]);
      setError(e?.error || "INTERNAL_ERROR");
    } finally {
      if (reqId !== tasksReqSeq.current) return;
      setLoading(false);
    }
  }
  
  useEffect(() => {
    if (!teamId) return;
  
    if (initRef.current.teamId === teamId && initRef.current.started) return;
    initRef.current = { teamId, started: true };
  
    (async () => {
      try {
        await loadMembers();
        await loadTasks(filter);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);
  
  useEffect(() => {
    if (!teamId) return;
  
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return; 
    }
  
    loadTasks(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function openCreate() {
    setModalMode("create");
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEdit(task) {
    setModalMode("edit");
    setEditingTask(task);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    setBusy(true);
    setError("");

    try {
      if (modalMode === "edit" && editingTask) {
        await apiUpdateTeamTask(teamId, editingTask.id, payload);
      } else {
        await apiCreateTeamTask(teamId, payload);
      }

      setModalOpen(false);
      setEditingTask(null);
      await loadTasks(filter);
    } catch (e) {
      setError(e?.error || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(task) {
    const ok = window.confirm(`Видалити завдання "${task.title}"?`);
    if (!ok) return;

    setBusy(true);
    setError("");

    try {
      await apiDeleteTeamTask(teamId, task.id);
      await loadTasks(filter);
    } catch (e) {
      setError(e?.error || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleComplete(task) {
    if (busy) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed, completedAt: new Date() } : t
      )
    );
  
    setBusy(true);
    setError("");
  
    try {
      await apiToggleTeamTaskComplete(teamId, task.id);
      setTimeout(() => {
        loadTasks(currentFilterRef.current);
      }, 350);
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      setError(e?.error || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }
  

  return (
    <div className="team-tasks-page">
      <div className="team-tasks-head">
        <div>
          <h2 className="team-tasks-title">Завдання</h2>
          <div className="team-tasks-subtitle">
            Створюйте завдання, призначайте відповідальних та відстежуйте виконання.
          </div>
        </div>

        <button type="button" className="btn btn-outline-primary" onClick={openCreate} disabled={busy}>
          <i className="bi bi-plus-lg" /></button>
      </div>

      <div className="task-tabs">
        <button
          type="button"
          className={`task-tab ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Усі
        </button>

        <button
          type="button"
          className={`task-tab ${filter === "mine" ? "is-active" : ""}`}
          onClick={() => setFilter("mine")}
        >
          Мої
        </button>

        <button
          type="button"
          className={`task-tab ${filter === "overdue" ? "is-active" : ""}`}
          onClick={() => setFilter("overdue")}
        >
          Прострочені
        </button>

        <button
          type="button"
          className={`task-tab ${filter === "completed" ? "is-active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Виконані
        </button>
      </div>

      {error ? <div className="alert alert-danger task-alert">{error}</div> : null}

      {loading || membersLoading ? (
        <div className="task-state">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="task-state__text">Завантаження...</div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="task-empty">
          <div className="task-empty__title">Немає завдань</div>
          <div className="task-empty__text">Спробуйте створити нове завдання або змінити фільтр.</div>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              meUid={meUid}
              membersMap={membersMap}
              onToggleComplete={handleToggleComplete}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        mode={modalMode}
        task={editingTask}
        members={members}
        submitting={busy}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
