import { useEffect, useMemo, useState } from "react";

export default function ChatLinkModal({
  open = false,
  submitting = false,
  initialLink = "",
  onClose,
  onSave,
}) {
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!open) return;
    setLink(String(initialLink || ""));
  }, [open, initialLink]);

  const trimmed = useMemo(() => String(link || "").trim(), [link]);
  const canSave = useMemo(() => !submitting, [submitting]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    onSave?.(trimmed);
  }

  return (
    <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
      <div className="auth-modal chat-link-modal">
        <div className="chat-link-modal__head">
          <div className="chat-link-modal__title">Посилання на чат</div>

          <button type="button" className="chat-link-modal__close" onClick={onClose} disabled={submitting}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="auth-modal__body">
          <form onSubmit={submit}>
            <div className="chat-link-modal__field">
              <label className="chat-link-modal__label">Вставте запрошення</label>
              <input
                className="form-control"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Наприклад, https://t.me/назва_групи"
                disabled={submitting}
              />
              <div className="chat-link-modal__hint">
                Порада: найкраще вставляти саме invite-link (щоб учасники могли перейти без пошуку).
              </div>
            </div>

            <div className="chat-link-modal__actions">
              <button type="button" className="btn btn-outline-primary" onClick={onClose} disabled={submitting}>
                Скасувати
              </button>

              <button type="submit" className="btn btn-primary" disabled={!canSave}>
                {submitting ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
