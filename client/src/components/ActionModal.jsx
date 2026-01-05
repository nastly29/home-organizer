export default function ActionModal({
  open,
  title,
  subtitle,
  onClose,
  onAfterClose,
  children,
}) {
  if (!open) return null;

  function handleClose() {
    onClose?.();
    onAfterClose?.();
  }

  return (
    <div className="modal-backdrop-custom" onMouseDown={handleClose}>
      <div
        className="auth-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="auth-modal__header">
          <div className="auth-modal__headertext">
            <h3 className="auth-modal__title">{title}</h3>
            {subtitle ? <p className="auth-modal__subtitle">{subtitle}</p> : null}
          </div>

          <button
            className="auth-modal__close"
            type="button"
            onClick={handleClose}
            aria-label="Закрити"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="auth-modal__body">
          <div className="action-modal">{children}</div>
        </div>
      </div>
    </div>
  );
}
