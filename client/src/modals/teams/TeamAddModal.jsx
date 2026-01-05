import { useEffect, useMemo, useState } from "react";
import ActionModal from "../../components/ActionModal";

export default function TeamAddModal({
  open,
  onClose,
  onCreate,
  onJoin,
  loadingCreate,
  loadingJoin,
}) {
  const [tab, setTab] = useState("create"); 
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setTab("create");
      setTeamName("");
      setTeamId("");
      setError("");
    }
  }, [open]);

  const createDisabled = useMemo(() => loadingCreate || teamName.trim().length < 2, [loadingCreate, teamName]);
  const joinDisabled = useMemo(() => loadingJoin || teamId.trim().length === 0, [loadingJoin, teamId]);

  async function submitCreate(e) {
    e.preventDefault();
    setError("");

    const name = teamName.trim();
    if (name.length < 2) {
      setError("Назва команди має містити мінімум 2 символи.");
      return;
    }

    try {
      await onCreate(name);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Не вдалося створити команду");
    }
  }

  async function submitJoin(e) {
    e.preventDefault();
    setError("");

    const id = teamId.trim();
    if (!id) {
      setError("Введіть код команди.");
      return;
    }

    try {
      await onJoin(id);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Не вдалося приєднатися до команди");
    }
  }

  return (
    <ActionModal
      open={open}
      title="Додати команду"
      onClose={onClose}
    >
      <div className="team-modal">
        <div className="team-modal__tabs">
          <button
            type="button"
            className={`team-tab ${tab === "create" ? "is-active" : ""}`}
            onClick={() => setTab("create")}
          >
            Створити
          </button>
          <button
            type="button"
            className={`team-tab ${tab === "join" ? "is-active" : ""}`}
            onClick={() => setTab("join")}
          >
            Приєднатися
          </button>
        </div>

        {error ? <div className="alert alert-danger auth-alert">{error}</div> : null}

        {tab === "create" ? (
          <form onSubmit={submitCreate} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="teamName">
                Назва команди
              </label>
              <input
                id="teamName"
                className="form-control"
                placeholder="Наприклад, Family Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={loadingCreate}
              />
              <div className="form-text">
                Після створення ви зможете поділитися кодом команди з іншими.
              </div>
            </div>

            <button className="btn btn-primary w-100" disabled={createDisabled}>
              {loadingCreate ? "Створення..." : "Створити команду"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitJoin} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="teamId">
                Код команди
              </label>
              <input
                id="teamId"
                className="form-control"
                placeholder="Введіть код"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={loadingJoin}
              />
              <div className="form-text">
                Кодом з вашими можуть поділитися інші учасники.
              </div>
            </div>

            <button className="btn btn-primary w-100" disabled={joinDisabled}>
              {loadingJoin ? "Приєднання..." : "Приєднатися"}
            </button>
          </form>
        )}
      </div>
    </ActionModal>
  );
}
