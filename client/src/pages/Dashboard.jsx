import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  apiCreateTeam,
  apiEnsureMe,
  apiJoinTeam,
  apiListTeams,
} from "../firebase/authApi";

import TeamFilters from "../components/teams/TeamFilters";
import TeamCard from "../components/teams/TeamCard";
import TeamAddModal from "../modals/teams/TeamAddModal";

function mapJoinError(e) {
  const msg = e?.message || "";
  if (msg.includes("TEAM_NOT_FOUND")) return "Команди з таким кодом не знайдено.";
  if (msg.includes("TEAM_ID_REQUIRED")) return "Введіть код команди.";
  return "Не вдалося приєднатися до команди. Спробуйте ще раз.";
}

function mapCreateError(e) {
  const msg = e?.message || "";
  return msg || "Не вдалося створити команду. Спробуйте ще раз.";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      await apiEnsureMe(user.displayName || "");
      const { teams: list } = await apiListTeams();
      setTeams(list || []);
    } catch (e) {
      setError(e?.message || "Не вдалося завантажити дані");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function handleCreate(name) {
    setCreating(true);
    try {
      await apiCreateTeam(name);
      await load();
    } catch (e) {
      throw new Error(mapCreateError(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(teamId) {
    setJoining(true);
    try {
      await apiJoinTeam(teamId);
      await load();
    } catch (e) {
      throw new Error(mapJoinError(e));
    } finally {
      setJoining(false);
    }
  }

  const filteredTeams = useMemo(() => {
    if (filter === "all") return teams;
    if (filter === "admin") return teams.filter((t) => t.role === "owner" || t.role === "admin");
    return teams.filter((t) => t.role === "member");
  }, [teams, filter]);

  return (
    <div className="container py-4 teams-page">
      <div className="teams-layout">
        <h1 className="page-title text-center">Команди</h1>

        <p className="page-subtitle text-center">
          Об'єднуйтесь та керуйте спільними справами в одному місці
        </p>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="teams-toolbar">
          <TeamFilters value={filter} onChange={setFilter} />

          <button
            className="team-plus"
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Додати команду"
          >
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
          </button>
        </div>

        {loading ? (
        <div className="team-members-state">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="team-members-state__text">Завантаження...</div>
        </div>
        ) : filteredTeams.length === 0 ? (
          <div className="teams-empty">Не знайдено команд.</div>
        ) : (
          <div className="teams-grid">
            {filteredTeams.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                onClick={() => navigate(`/teams/${t.id}`)}
              />
            ))}
          </div>
        )}

        <TeamAddModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreate={handleCreate}
          onJoin={handleJoin}
          loadingCreate={creating}
          loadingJoin={joining}
        />
      </div>
    </div>
  );
}
