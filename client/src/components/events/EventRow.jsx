import { useMemo } from "react";

function formatTime(time) {
  const t = String(time || "").trim();
  if (!t) return "";
  return t;
}

export default function EventRow({ event, onClick }) {
  const time = useMemo(() => formatTime(event?.time), [event]);

  return (
    <button type="button" className="event-row" onClick={onClick}>
      <div className="event-row__left">
        <div className="event-row__title">
          {event?.title || "Без назви"}
        </div>

        {time && (
          <div className="event-row__time">
            <i className="bi bi-clock" />
            <span>{time}</span>
          </div>
        )}

        <div className="event-row__meta">
          {event?.place ? (
            <span className="event-row__chip">
              <i className="bi bi-geo-alt" /> {event.place}
            </span>
          ) : null}

          {event?.note ? (
            <span className="event-row__note">
              <i className="bi bi-card-text" /> {event.note}
            </span>
          ) : null}
        </div>
      </div>

      <div className="event-row__right">
        <i className="bi bi-chevron-right" />
      </div>
    </button>
  );
}
