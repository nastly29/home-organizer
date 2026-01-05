import ActionModal from "../../components/ActionModal";

export default function ConfirmBuyModal({
  open,
  item,
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!open) return null;

  return (
    <ActionModal
      open={open}
      title="Підтвердити покупку"
      subtitle={item?.title ? `Куплено: ${item.title}` : "Підтвердіть дію"}
      onClose={() => (loading ? null : onClose?.())}
    >
      <div className="confirm-buy">
        <div className="confirm-buy__text">
          Після підтвердження позиція буде видалена зі списку.
        </div>

        <div className="confirm-buy__actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={onClose}
            disabled={loading}
          >
            Скасувати
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Зачекайте..." : "Підтвердити"}
          </button>
        </div>
      </div>
    </ActionModal>
  );
}
