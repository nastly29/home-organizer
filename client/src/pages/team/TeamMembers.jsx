import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apiGetTeam, apiRemoveTeamMember, apiListTeamMembers } from "../../firebase/authApi";

import TeamMemberRow from "../../components/teams/TeamMemberRow";

export default function TeamMembers() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const myUid = user?.uid || "";

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingUid, setRemovingUid] = useState("");
  const [error, setError] = useState("");

  const ownerUid = useMemo(() => {
    if (team?.ownerId) return team.ownerId;
    const owner = (members || []).find((m) => m.role === "owner");
    return owner?.uid || "";
  }, [team, members]);

  const isOwnerViewer = !!myUid && !!ownerUid && myUid === ownerUid;

  const sortedMembers = useMemo(() => {
    const list = [...(members || [])];

    list.sort((a, b) => {
      const aOwner = a?.uid === ownerUid || a?.role === "owner";
      const bOwner = b?.uid === ownerUid || b?.role === "owner";

      if (aOwner && !bOwner) return -1;
      if (!aOwner && bOwner) return 1;
      return 0;
    });

    return list;
  }, [members, ownerUid]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [teamRes, membersRes] = await Promise.all([
        apiGetTeam(teamId),
        apiListTeamMembers(teamId),
      ]);

      setTeam(teamRes?.team || null);
      setMembers(membersRes?.members || []);
    } catch (e) {
      setError("Не вдалося завантажити учасників команди.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!teamId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function handleRemove(member) {
    if (!isOwnerViewer) return;
    if (member?.role === "owner" || member?.uid === ownerUid) return;

    const label = member?.displayName || member?.email || "користувача";
    const ok = window.confirm(`Видалити ${label} з команди?`);
    if (!ok) return;

    setRemovingUid(member.uid);

    try {
      await apiRemoveTeamMember(teamId, member.uid);
      setMembers((prev) => prev.filter((m) => m.uid !== member.uid));
    } catch (e) {
      alert("Не вдалося видалити учасника. Спробуйте ще раз.");
    } finally {
      setRemovingUid("");
    }
  }

  return (
    <div className="team-members-page">
      <div className="team-members-header d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div className="team-members-header__left flex-grow-1">
          <h2 className="team-members-title mb-1">Учасники</h2>
          {team?.name ? (
            <div className="team-members-subtitle">Команда «{team.name}»</div>
          ) : null}
        </div>
  
        <div className="team-members-header__right">
          <div className="team-members-meta d-flex gap-3">
            <div className="team-members-meta__item text-center">
              <div className="team-members-meta__label small text-muted">Учасників</div>
              <div className="team-members-meta__value fw-bold">{members.length}</div>
            </div>
  
            <div className="team-members-meta__item text-center">
              <div className="team-members-meta__label small text-muted">Ваш статус</div>
              <div className="team-members-meta__value fw-bold">
                {isOwnerViewer ? "Власник" : "Учасник"}
              </div>
            </div>
          </div>
        </div>
      </div>
  
      {error ? <div className="alert alert-danger mb-0">{error}</div> : null}
  
      {loading ? (
        <div className="team-members-state text-center">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="team-members-state__text mt-2">Завантаження...</div>
        </div>
      ) : sortedMembers.length === 0 ? (
        <div className="team-members-empty text-center">
          <div className="team-members-empty__icon mb-2">
            <i className="bi bi-people" aria-hidden="true" />
          </div>
          <div className="team-members-empty__title fw-bold">Список порожній</div>
          <div className="team-members-empty__text text-muted">
            Наразі у команді немає учасників.
          </div>
        </div>
      ) : (
        <div className="team-members-list">
          {sortedMembers.map((m) => (
            <TeamMemberRow
              key={m.uid}
              member={m}
              myUid={myUid}
              isOwnerViewer={isOwnerViewer}
              removing={removingUid === m.uid}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}  