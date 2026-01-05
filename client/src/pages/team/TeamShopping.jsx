import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import {
  apiListTeamShopping,
  apiCreateTeamShopping,
  apiUpdateTeamShopping,
  apiConfirmTeamShoppingBuy,
  apiDeleteTeamShoppingItem,
} from "../../firebase/authApi";

import ShoppingItem from "../../components/shopping/ShoppingItem";
import ShoppingModal from "../../modals/teams/ShoppingModal";
import ConfirmBuyModal from "../../modals/teams/ConfirmBuyModal";

const CATEGORIES = [
  { key: "all", label: "Усі" },
  { key: "groceries", label: "Продукти" },
  { key: "household", label: "Побут" },
  { key: "home", label: "Для дому" },
  { key: "hygiene", label: "Гігієна" },
  { key: "pharmacy", label: "Аптека" },
  { key: "pets", label: "Для тварин" },
  { key: "other", label: "Інше" },
];

function categoryLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label || "";
}

export default function TeamShopping() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const meUid = user?.uid || "";

  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); 
  const [editingItem, setEditingItem] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const reqSeq = useRef(0);

  const categoriesForModal = useMemo(
    () => CATEGORIES.filter((c) => c.key !== "all"),
    []
  );

  async function loadShopping(nextFilter = filter) {
    const reqId = ++reqSeq.current;
    setLoading(true);
    setError("");

    try {
      const res = await apiListTeamShopping(teamId, nextFilter);
      if (reqId !== reqSeq.current) return;

      const list = (res?.items || []).map((x) => ({
        ...x,
        categoryLabel: categoryLabel(x.category),
      }));

      setItems(list);
    } catch (e) {
      if (reqId !== reqSeq.current) return;
      setItems([]);
      setError(e?.message || e?.error || "INTERNAL_ERROR");
    } finally {
      if (reqId !== reqSeq.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!teamId) return;
    loadShopping(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    loadShopping(filter);
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
      if (modalMode === "edit" && editingItem?.id) {
        await apiUpdateTeamShopping(teamId, editingItem.id, payload);
      } else {
        await apiCreateTeamShopping(teamId, payload);
      }

      setModalOpen(false);
      setEditingItem(null);
      await loadShopping(filter);
    } catch (e) {
      setError(e?.message || e?.error || "INTERNAL_ERROR");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  function openConfirmBuy(item) {
    if (!item?.id) return;
    setConfirmItem(item);
    setConfirmOpen(true);
  }

  async function handleConfirmBuy() {
    const item = confirmItem;
    if (!item?.id) return;

    setItems((prev) => prev.filter((x) => x.id !== item.id));

    setConfirmLoading(true);
    setError("");

    try {
      await apiConfirmTeamShoppingBuy(teamId, item.id);

      setConfirmOpen(false);
      setConfirmItem(null);

      await loadShopping(filter);
    } catch (e) {
      setError(e?.message || e?.error || "INTERNAL_ERROR");
      await loadShopping(filter);
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleDelete(item) {
    if (!item?.id) return;

    const ok = window.confirm(`Видалити "${item.title || "позицію"}"?`);
    if (!ok) return;

    setBusy(true);
    setError("");

    try {
      await apiDeleteTeamShoppingItem(teamId, item.id);
      await loadShopping(filter);
    } catch (e) {
      setError(e?.message || e?.error || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="team-shopping-page">
      <div className="team-shopping-head">
        <div>
          <h2 className="team-shopping-title">Покупки</h2>
          <div className="team-shopping-subtitle">
            Зручний список покупок для всієї команди.
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary shopping-add-btn"
          onClick={openCreate}
          disabled={busy || confirmLoading}
        >
          <i className="bi bi-plus-lg" /></button>
      </div>

      <div className="shopping-tabs-wrap">
        <div className="shopping-tabs">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`shopping-tab ${filter === c.key ? "is-active" : ""}`}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="alert alert-danger shopping-alert">{error}</div> : null}

      {loading ? (
        <div className="task-state">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="task-state__text">Завантаження...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="shopping-empty">
          <div className="shopping-empty__title">Список порожній</div>
          <div className="shopping-empty__text">
            Натисніть “Додати”, щоб створити позицію.
          </div>
        </div>
      ) : (
        <div className="shopping-list">
          {items.map((it) => (
            <ShoppingItem
              key={it.id}
              item={it}
              meUid={meUid}
              disabled={busy || confirmLoading}
              onConfirmBuy={openConfirmBuy}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ShoppingModal
        open={modalOpen}
        mode={modalMode}
        item={editingItem}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        submitting={busy}
        categories={categoriesForModal}
      />

      <ConfirmBuyModal
        open={confirmOpen}
        item={confirmItem}
        loading={confirmLoading}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmItem(null);
        }}
        onConfirm={handleConfirmBuy}
      />
    </div>
  );
}
