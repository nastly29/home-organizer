import { useMemo } from "react";

function formatQty(qtyValue, qtyUnit) {
  const v = String(qtyValue ?? "").trim();
  const u = String(qtyUnit ?? "").trim();
  if (!v && !u) return "";
  if (v && u) return `${v} ${u}`;
  return v || u;
}

export default function ShoppingItem({
  item,
  meUid,
  onConfirmBuy,
  onEdit,
  onDelete,
  disabled = false,
}) {
  const qtyText = useMemo(
    () => formatQty(item?.qtyValue, item?.qtyUnit),
    [item]
  );

  const isAuthor = item?.createdBy && meUid && item.createdBy === meUid;

  return (
    <div className="shopping-card">
      <div className="shopping-card__left">
        <input
          type="checkbox"
          className="form-check-input shopping-card__check"
          checked={false}
          disabled={disabled}
          title="Позначити як куплено"
          onChange={() => onConfirmBuy?.(item)}
        />

        <div className="shopping-card__meta">
       
          <div className="shopping-card__title">
            {item?.title || "Без назви"}
            {qtyText ? <span className="shopping-card__qty-inline"> ({qtyText})</span> : null}
          </div>

          {item?.categoryLabel ? (
            <div className="shopping-card__row">
              <span className="shopping-card__category">
                <i className="bi bi-tag" /> {item.categoryLabel}
              </span>
            </div>
          ) : null}

          {item?.note ? (
            <div className="shopping-card__row">
              <span className="shopping-card__note">
                <i className="bi bi-chat-left-text" /> {item.note}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shopping-card__actions">
        {isAuthor ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => onEdit?.(item)}
              disabled={disabled}
              title="Редагувати"
            >
              <i className="bi bi-pencil" /></button>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onDelete?.(item)}
              disabled={disabled}
              title="Видалити"
            >
              <i className="bi bi-trash" /></button>
          </>
        ) : null}
      </div>
    </div>
  );
}
