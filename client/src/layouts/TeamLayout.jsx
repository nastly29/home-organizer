import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";

import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  apiGetTeam,
  apiLeaveTeam,
  apiListTeamMembers,
  apiTransferTeamOwner,
  apiDeleteTeam,
  apiUpdateTeamName,
} from "../firebase/authApi";

import EditTeamNameModal from "../modals/teams/EditTeamNameModal";
import TransferOwnerModal from "../modals/teams/TransferOwnerModal";
import DeleteTeamNameModal from "../modals/teams/DeleteTeamNameModal";

function mapTeamError(e) {
  const msg = e?.message || "";

  if (msg.includes("OWNER_CANT_LEAVE")) {
    return "Власник не може покинути групу без передачі прав іншому учаснику.";
  }
  if (msg.includes("NOT_FOUND")) return "Групу не знайдено.";
  if (msg.includes("FORBIDDEN")) return "Недостатньо прав для виконання дії.";
  if (msg.includes("Request failed")) return "Не вдалося виконати запит. Спробуйте ще раз.";

  return msg || "Сталася помилка. Спробуйте ще раз.";
}

export default function TeamLayout() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [membership, setMembership] = useState(null);
  const [error, setError] = useState("");

  const myUid = user?.uid || "";
  const isOwner = useMemo(() => membership?.role === "owner", [membership]);

  const storageKey = useMemo(() => `team_sidebar_collapsed_${teamId}`, [teamId]);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, storageKey]);

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false);
  const [transferOwnerOpen, setTransferOwnerOpen] = useState(false);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [savingName, setSavingName] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError("");
      try {
        const data = await apiGetTeam(teamId);
        if (!mounted) return;
        setTeam(data.team);
        setMembership(data.membership);
      } catch (e) {
        setError(e?.message || "Не вдалося завантажити команду");
      }
    }

    if (teamId) load();

    return () => {
      mounted = false;
    };
  }, [teamId]);

  async function ensureMembersLoaded() {
    setMembersLoading(true);
    try {
      const data = await apiListTeamMembers(teamId);
      const list = data?.members || [];
      setMembers(list);
      return list;
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleLeave() {
    const ok = window.confirm("Ви справді хочете покинути групу?");
    if (!ok) return;

    try {
      if (!isOwner) {
        await apiLeaveTeam(teamId);
        navigate("/dashboard");
        return;
      }
      const list = await ensureMembersLoaded();
      if (list.length <= 1) {
        const ok2 = window.confirm(
          "Ви єдиний учасник. Якщо вийти — група буде видалена. Продовжити?"
        );
        if (!ok2) return;

        await apiDeleteTeam(teamId);
        navigate("/dashboard");
        return;
      }
      setTransferOwnerOpen(true);
    } catch (e) {
      alert(mapTeamError(e));
    }
  }

  async function handleTransferAndLeave(newOwnerUid) {
    try {
      setTransferLoading(true);
      await apiTransferTeamOwner(teamId, newOwnerUid);
      await apiLeaveTeam(teamId);
      navigate("/dashboard");
    } catch (e) {
      throw new Error(mapTeamError(e));
    } finally {
      setTransferLoading(false);
    }
  }

  async function handleSaveTeamName(newName) {
    try {
      setSavingName(true);
      const updated = await apiUpdateTeamName(teamId, newName);
      setTeam(updated?.team || updated);
    } catch (e) {
      throw new Error(mapTeamError(e));
    } finally {
      setSavingName(false);
    }
  }

  async function handleDeleteTeam() {
    try {
      setDeletingTeam(true);
      await apiDeleteTeam(teamId);
      navigate("/dashboard");
    } catch (e) {
      throw new Error(mapTeamError(e));
    } finally {
      setDeletingTeam(false);
    }
  }

  return (
    <div className="container py-4 team-layout">
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className={`team-layout__grid ${collapsed ? "is-collapsed" : ""}`}>
        <main className="team-layout__content">
          <Outlet context={{ team, membership }} />
        </main>

        <aside className="team-layout__sidebar">
          <div className={`team-side ${collapsed ? "is-collapsed" : ""}`}>
            <div className="team-side__top">
              <div className="team-side__title-row">
                <div className="team-side__title" title={team?.name || "Команда"}>
                  {team?.name || "Команда"}
                  
                  {isOwner && !collapsed ? (
                    <button
                      type="button"
                      className="team-side__icon-btn"
                      onClick={() => setEditNameOpen(true)}
                      aria-label="Редагувати назву"
                      title="Редагувати назву"
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                <div className="team-side__title-actions">

                  <button
                    type="button"
                    className="team-side__toggle"
                    onClick={() => setCollapsed((s) => !s)}
                    aria-label={collapsed ? "Розгорнути меню" : "Згорнути меню"}
                    title={collapsed ? "Розгорнути" : "Згорнути"}
                  >
                    <i
                      className={`bi ${collapsed ? "bi-chevron-left" : "bi-chevron-right"}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              <NavLink
                to={`/teams/${teamId}/members`}
                className="team-side__members"
                title="Переглянути учасників"
              >
                <i className="bi bi-people" aria-hidden="true"></i>
                {!collapsed ? <span className="team-side__members-text">Учасники</span> : null}
              </NavLink>
            </div>

            <div className="team-side__nav">
              <NavLink end to={`/teams/${teamId}`} className="team-nav__item" title="Головна">
                <i className="bi bi-grid" aria-hidden="true"></i>
                {!collapsed ? <span>Головна</span> : null}
              </NavLink>

              <NavLink to={`/teams/${teamId}/tasks`} className="team-nav__item" title="Завдання">
                <i className="bi bi-check2-square" aria-hidden="true"></i>
                {!collapsed ? <span>Завдання</span> : null}
              </NavLink>

              <NavLink to={`/teams/${teamId}/shopping`} className="team-nav__item" title="Покупки">
                <i className="bi bi-cart3" aria-hidden="true"></i>
                {!collapsed ? <span>Покупки</span> : null}
              </NavLink>

              <NavLink to={`/teams/${teamId}/finances`} className="team-nav__item" title="Витрати">
                <i className="bi bi-cash-coin" aria-hidden="true"></i>
                {!collapsed ? <span>Витрати</span> : null}
              </NavLink>

              <NavLink to={`/teams/${teamId}/calendar`} className="team-nav__item" title="Події">
                <i className="bi bi-calendar-event" aria-hidden="true"></i>
                {!collapsed ? <span>Події</span> : null}
              </NavLink>

              <NavLink to={`/teams/${teamId}/chat`} className="team-nav__item" title="Чат">
                <i className="bi bi-chat-dots" aria-hidden="true"></i>
                {!collapsed ? <span>Чат</span> : null}
              </NavLink>
            </div>

            <div className="team-side__footer">
              <button
                type="button"
                className="team-leave"
                onClick={handleLeave}
                title="Покинути групу"
              >
                <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
                {!collapsed ? <span>Покинути групу</span> : null}
              </button>

              {isOwner ? (
                <button
                  type="button"
                  className="team-delete"
                  onClick={() => setDeleteTeamOpen(true)}
                  title="Видалити групу"
                >
                  <i className="bi bi-trash" aria-hidden="true"></i>
                  {!collapsed ? <span>Видалити групу</span> : null}
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      <EditTeamNameModal
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        initialName={team?.name || ""}
        loading={savingName}
        onSave={handleSaveTeamName}
      />

      <DeleteTeamNameModal
        open={deleteTeamOpen}
        onClose={() => setDeleteTeamOpen(false)}
        teamName={team?.name || ""}
        loading={deletingTeam}
        onDelete={handleDeleteTeam}
      />

      <TransferOwnerModal
        open={transferOwnerOpen}
        onClose={() => setTransferOwnerOpen(false)}
        members={members}
        myUid={myUid}
        loading={transferLoading || membersLoading}
        onTransferAndLeave={handleTransferAndLeave}
      />
    </div>
  );
}
