import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import {
  apiListTeamMembers,
  apiListTeamFinances,
  apiCreateTeamFinance,
  apiUpdateTeamFinance,
  apiDeleteTeamFinance,
} from "../../firebase/authApi";

import FinanceItem from "../../components/finances/FinanceItem";
import FinanceModal from "../../modals/teams/FinanceModal";

export default function TeamFinances() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const meUid = user?.uid || "";

  const [filter, setFilter] = useState("all"); 
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);

  const membersMap = useMemo(() => new Map((members || []).map((m) => [m.uid, m])), [members]);

  const reqSeq = useRef(0);

  async function loadMembers() {
    const res = await apiListTeamMembers(teamId);
    setMembers(res?.members || []);
  }

  async function loadItems(nextFilter = filter) {
    const mySeq = ++reqSeq.current;
    setLoading(true);
    setError("");

    try {
      const res = await apiListTeamFinances(teamId, nextFilter);
      if (mySeq !== reqSeq.current) return; 
      setItems(res?.items || []);
    } catch (e) {
      if (mySeq !== reqSeq.current) return;
      setItems([]);
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      if (mySeq === reqSeq.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!teamId) return;

    (async () => {
      try {
        await loadMembers();
        await loadItems(filter);
      } catch (e) {
        setError(e?.message || "INTERNAL_ERROR");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    loadItems(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function openCreate() {
    setModalMode("create");
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setModalMode("edit");
    setEditingItem(item);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    setBusy(true);
    setError("");

    try {
      if (modalMode === "edit" && editingItem) {
        await apiUpdateTeamFinance(teamId, editingItem.id, payload);
      } else {
        await apiCreateTeamFinance(teamId, payload);
      }

      setModalOpen(false);
      setEditingItem(null);
      await loadItems(filter);
    } catch (e) {
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item) {
    const who = membersMap.get(item?.spenderUid)?.displayName || "витрату";
    const ok = window.confirm(`Видалити цю витрату (${who})?`);
    if (!ok) return;

    setBusy(true);
    setError("");

    try {
      await apiDeleteTeamFinance(teamId, item.id);
      await loadItems(filter);
    } catch (e) {
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="team-finances-page">
      <div className="team-finances-head">
        <div>
          <h2 className="team-finances-title">Витрати</h2>
          <div className="team-finances-subtitle">
            Зручний список витрат для спільного користування.
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={openCreate}
          disabled={busy}
        >
          <i className="bi bi-plus-lg" /></button>
      </div>

      <div className="finance-tabs-wrap">
        <div className="finance-tabs">
          <button
            type="button"
            className={`finance-tab ${filter === "all" ? "is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Усі
          </button>

          <button
            type="button"
            className={`finance-tab ${filter === "mine" ? "is-active" : ""}`}
            onClick={() => setFilter("mine")}
          >
            Мої витрати
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-danger finance-alert">{error}</div> : null}

      {loading ? (
        <div className="team-members-state">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="team-members-state__text">Завантаження...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="finance-empty">
          <div className="finance-empty__title">Немає витрат</div>
          <div className="finance-empty__text">Спробуйте додати першу витрату або змінити фільтр.</div>
        </div>
      ) : (
        <div className="finance-list">
          {items.map((it) => (
            <FinanceItem
              key={it.id}
              item={it}
              meUid={meUid}
              membersMap={membersMap}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <FinanceModal
        open={modalOpen}
        mode={modalMode}
        item={editingItem}
        members={members}
        meUid={meUid}
        submitting={busy}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
