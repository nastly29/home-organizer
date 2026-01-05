import { useMemo } from "react";

function formatMoneyUAH(amount) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return "0 ₴";
  return `${n.toFixed(2).replace(/\.00$/, "")} ₴`;
}

function formatDate(spentDate) {
  const d = String(spentDate || "").trim();
  if (!d) return "";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export default function FinanceItem({ item, meUid, membersMap, onEdit, onDelete }) {
  const canEdit = item?.spenderUid === meUid;
  const canDelete = item?.spenderUid === meUid;

  const spenderLabel = useMemo(() => {
    const u = membersMap?.get(item?.spenderUid);
    return u?.displayName || u?.email || "Без імені";
  }, [item, membersMap]);

  const note = String(item?.note || "").trim();
  const dateText = item?.spentDate ? formatDate(item.spentDate) : "";
  const amountText = formatMoneyUAH(item?.amount);

  return (
    <div className="finance-card">
      <div className="finance-card__main">
       
        <div className="finance-card__top">
          <div className="finance-card__name-badge">{spenderLabel}</div>
          <div className="finance-card__amount">- {amountText}</div>
        </div>

        {dateText ? (
          <div className="finance-card__date">
            <i className="bi bi-calendar3" aria-hidden="true" />
            <span>{dateText}</span>
          </div>
        ) : null}

        {note ? (
          <div className="finance-card__note">
            <i className="bi bi-chat-left-text" aria-hidden="true" />
            <span>{note}</span>
          </div>
        ) : null}
      </div>

      <div className="finance-card__actions">
        {canEdit ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onEdit?.(item)}
              title="Редагувати"
            >
              <i className="bi bi-pencil" /></button>

            {canDelete ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => onDelete?.(item)}
                title="Видалити"
              >
                <i className="bi bi-trash" /></button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
