import { useMemo } from "react";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const MONTHS_UA = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseMonthKey(monthKey) {
  const [yy, mm] = String(monthKey).split("-").map((x) => Number(x));
  return { yy, mm };
}

function toIsoDate(yy, mm, dd) {
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}

function getTodayKey() {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export default function MonthCalendar({
  month,
  selectedDate,
  eventsByDate,
  loading = false,
  onMonthChange,
  onSelectDate,
}) {
  const { yy, mm } = useMemo(() => parseMonthKey(month), [month]);
  const todayKey = useMemo(() => getTodayKey(), []);

  const grid = useMemo(() => {
    const first = new Date(yy, mm - 1, 1);
    const daysInMonth = new Date(yy, mm, 0).getDate();

    const jsDow = first.getDay(); 
    const offset = (jsDow + 6) % 7; 

    const cells = [];
    const total = 42;

    for (let i = 0; i < total; i++) {
      const dayNum = i - offset + 1;
      const inMonth = dayNum >= 1 && dayNum <= daysInMonth;

      const iso = inMonth ? toIsoDate(yy, mm, dayNum) : "";

      const dayEvents = inMonth ? eventsByDate?.get(iso) : null;
      const count = dayEvents ? dayEvents.length : 0;
      const hasEvents = count > 0;

      cells.push({
        key: `${month}-${i}`,
        inMonth,
        dayNum: inMonth ? dayNum : null,
        iso,
        hasEvents,
        count,
        isSelected: inMonth && iso === selectedDate,
        isToday: inMonth && iso === todayKey,
      });
    }

    return cells;
  }, [yy, mm, month, selectedDate, eventsByDate, todayKey]);

  function prevMonth() {
    const d = new Date(yy, mm - 2, 1);
    onMonthChange?.(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }

  function nextMonth() {
    const d = new Date(yy, mm, 1);
    onMonthChange?.(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }

  const monthLabel = `${MONTHS_UA[mm - 1]} ${yy}`;

  return (
    <div className="month-calendar">
      <div className="month-calendar__head">
        <button
          type="button"
          className="month-calendar__nav"
          onClick={prevMonth}
          disabled={loading}
        >
          <i className="bi bi-chevron-left" />
        </button>

        <div className="month-calendar__title">{monthLabel}</div>

        <button
          type="button"
          className="month-calendar__nav"
          onClick={nextMonth}
          disabled={loading}
        >
          <i className="bi bi-chevron-right" />
        </button>
      </div>

      <div className="month-calendar__weekdays">
        {WEEKDAYS.map((d) => (
          <div key={d} className="month-calendar__weekday">
            {d}
          </div>
        ))}
      </div>

      <div className={`month-calendar__grid ${loading ? "is-loading" : ""}`}>
        {grid.map((c) => (
          <button
            type="button"
            key={c.key}
            className={`month-day ${c.inMonth ? "" : "is-out"} ${c.isSelected ? "is-selected" : ""} ${
              c.isToday ? "is-today" : ""
            }`}
            onClick={() => c.inMonth && onSelectDate?.(c.iso)}
            disabled={!c.inMonth || loading}
            title={c.inMonth ? c.iso : ""}
          >
            <div className="month-day__top">
              <div className="month-day__num">{c.dayNum ?? ""}</div>

              {c.hasEvents ? (
                <div className="month-day__dots" aria-hidden="true">
                  <span className="month-day__dot" />
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
