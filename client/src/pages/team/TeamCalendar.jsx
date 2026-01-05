import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  apiListTeamEvents,
  apiCreateTeamEvent,
  apiUpdateTeamEvent,
  apiDeleteTeamEvent,
} from "../../firebase/authApi";

import MonthCalendar from "../../components/events/MonthCalendar";
import EventRow from "../../components/events/EventRow";
import EventModal from "../../modals/teams/EventModal";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function monthKeyFromDate(d) {
  const yy = d.getFullYear();
  const mm = d.getMonth() + 1;
  return `${yy}-${pad2(mm)}`;
}

function isoDateLocal(d) {
  const yy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}

function firstDayOfMonthKey(monthKey) {
  // "YYYY-MM" -> "YYYY-MM-01"
  return `${monthKey}-01`;
}

export default function TeamCalendar() {
  const { teamId } = useParams();

  const [activeMonth, setActiveMonth] = useState(() => monthKeyFromDate(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => isoDateLocal(new Date()));

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [editingEvent, setEditingEvent] = useState(null);

  const requestSeq = useRef(0);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const k = ev?.date || "";
      if (!k) continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(ev);
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    const list = eventsByDate.get(selectedDate) || [];
    return [...list].sort((a, b) => {
      const at = (a.time || "").trim();
      const bt = (b.time || "").trim();
      if (!at && bt) return -1;
      if (at && !bt) return 1;
      return at.localeCompare(bt);
    });
  }, [eventsByDate, selectedDate]);

  // ✅ Дата, яку показуємо в заголовку списку (завжди синхронна зі списком)
  const displayDate = useMemo(() => selectedDate, [selectedDate]);

  async function loadMonth(month) {
    if (!teamId) return;

    const seq = ++requestSeq.current;
    setLoading(true);
    setError("");

    try {
      const res = await apiListTeamEvents(teamId, month);
      if (seq !== requestSeq.current) return;
      setEvents(res?.events || []);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setEvents([]);
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadMonth(activeMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, activeMonth]);

  // ✅ Опційно, але корисно:
  // якщо користувач перегорнув місяць, а selectedDate лишилась з іншого місяця —
  // автоматично переведемо selectedDate на перший день активного місяця.
  useEffect(() => {
    if (!selectedDate || !activeMonth) return;
    if (!String(selectedDate).startsWith(activeMonth)) {
      setSelectedDate(firstDayOfMonthKey(activeMonth));
    }
  }, [activeMonth, selectedDate]);

  function openCreate() {
    setModalMode("create");
    setEditingEvent(null);
    setModalOpen(true);
  }

  function openEdit(ev) {
    setModalMode("edit");
    setEditingEvent(ev);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    setBusy(true);
    setError("");

    try {
      if (modalMode === "edit" && editingEvent?.id) {
        await apiUpdateTeamEvent(teamId, editingEvent.id, payload);
      } else {
        await apiCreateTeamEvent(teamId, payload);
      }

      setModalOpen(false);
      setEditingEvent(null);

      // ✅ якщо подію створили/оновили на іншу дату — можна одразу перейти на неї
      // (щоб заголовок "Список подій на" точно відповідав тому, що юзер зробив)
      const nextDate = String(payload?.date || "").trim();
      if (nextDate) setSelectedDate(nextDate);

      await loadMonth(activeMonth);
    } catch (e) {
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteFromModal(ev) {
    const ok = window.confirm(`Видалити подію "${ev?.title || "без назви"}"?`);
    if (!ok) return;

    setBusy(true);
    setError("");

    try {
      await apiDeleteTeamEvent(teamId, ev.id);
      setModalOpen(false);
      setEditingEvent(null);
      await loadMonth(activeMonth);
    } catch (e) {
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="team-calendar-page">
      <div className="team-calendar-head">
        <div>
          <h2 className="team-calendar-title">Події</h2>
          <div className="team-calendar-subtitle">
            Плануйте спільні справи — події відображаються в календарі.
          </div>
        </div>

        <button type="button" className="btn btn-outline-primary" onClick={openCreate} disabled={busy}>
          <i className="bi bi-plus-lg" />
        </button>
      </div>

      {error ? <div className="alert alert-danger calendar-alert">{error}</div> : null}

      <div className="calendar-wrap">
        <MonthCalendar
          month={activeMonth}
          selectedDate={selectedDate}
          eventsByDate={eventsByDate}
          loading={loading}
          onMonthChange={setActiveMonth}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className="calendar-list">
        <div className="calendar-list__head">
          <div className="calendar-list__title">
            Список подій на <span className="calendar-list__date">{displayDate}</span>
          </div>
        </div>

        {loading ? (
          <div className="team-members-state">
            <div className="spinner-border" role="status" aria-hidden="true" />
            <div className="team-members-state__text">Завантаження...</div>
          </div>
        ) : selectedEvents.length === 0 ? (
          <div className="calendar-empty">
            <div className="calendar-empty__title">Немає подій</div>
            <div className="calendar-empty__text">Натисніть “Додати”, щоб створити подію на обраний день.</div>
          </div>
        ) : (
          <div className="event-list">
            {selectedEvents.map((ev) => (
              <EventRow key={ev.id} event={ev} onClick={() => openEdit(ev)} />
            ))}
          </div>
        )}
      </div>

      <EventModal
        open={modalOpen}
        mode={modalMode}
        event={editingEvent}
        defaultDate={selectedDate}
        submitting={busy}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDeleteFromModal}
      />
    </div>
  );
}
