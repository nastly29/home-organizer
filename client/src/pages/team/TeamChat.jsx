import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { apiGetTeam, apiGetTeamChatLink, apiUpdateTeamChatLink } from "../../firebase/authApi";
import ChatLinkModal from "../../modals/teams/ChatLinkModal";

export default function TeamChat() {
  const { teamId } = useParams();

  const [role, setRole] = useState("member"); 
  const [link, setLink] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = useMemo(() => role === "owner", [role]);
  const hasLink = useMemo(() => !!String(link || "").trim(), [link]);

  async function load() {
    if (!teamId) return;

    setLoading(true);
    setError("");

    try {
      const teamRes = await apiGetTeam(teamId);
      setRole(teamRes?.membership?.role || "member");

      const chatRes = await apiGetTeamChatLink(teamId);
      setLink(String(chatRes?.link || "").trim());
    } catch (e) {
      setError(e?.message || "INTERNAL_ERROR");
      setLink("");
      setRole("member");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  function openChat() {
    const url = String(link || "").trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openEdit() {
    setModalOpen(true);
  }

  async function handleSave(nextLink) {
    setBusy(true);
    setError("");

    try {
      const res = await apiUpdateTeamChatLink(teamId, nextLink);
      setLink(String(res?.link || "").trim());
      setModalOpen(false);
    } catch (e) {
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    const ok = window.confirm("Очистити посилання на чат для всієї команди?");
    if (!ok) return;

    setBusy(true);
    setError("");

    try {
      const res = await apiUpdateTeamChatLink(teamId, "");
      setLink(String(res?.link || "").trim());
    } catch (e) {
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    const url = String(link || "").trim();
    if (!url) return;

    setCopied(false);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (e) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
    } finally {
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="team-chat-page">
      <div className="team-chat-head">
        <div className="team-chat-head__left">
          <h2 className="team-chat-title">Чат</h2>
          <div className="team-chat-subtitle">
            Сторінка доступу до зовнішнього командного чату.
          </div>
        </div>
      </div>

      {error ? <div className="alert alert-danger chat-alert">{error}</div> : null}

      {loading ? (
        <div className="chat-state">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="chat-state__text">Завантаження...</div>
        </div>
      ) : hasLink ? (
        <div className="chat-center">
          <div className="chat-tile">
            <div className="chat-tile__label">Посилання на чат</div>

            <button type="button" className="btn btn-primary chat-tile__open" onClick={openChat} disabled={busy}>
              <i className="bi bi-chat-dots" /> Відкрити чат
            </button>

            <button type="button" className="chat-tile__copy" disabled={busy} onClick={copyLink}>
              <i className="bi bi-clipboard" /> {copied ? "Скопійовано" : "Скопіювати посилання"}
            </button>

            {isOwner ? (
              <div className="chat-tile__links">
                <button
                  type="button"
                  className="chat-tile__linkbtn"
                  onClick={openEdit}
                  disabled={loading || busy}
                >
                  Змінити
                </button>

                <span className="chat-tile__sep">•</span>

                <button
                  type="button"
                  className="chat-tile__linkbtn chat-tile__linkbtn--danger"
                  onClick={handleClear}
                  disabled={loading || busy}
                >
                  Очистити
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="chat-empty">
          <div className="chat-empty__title">Посилання ще не додано</div>
          <div className="chat-empty__text">
            {isOwner
              ? "Натисніть “Додати”, вставте запрошення на чат — після цього учасники зможуть відкривати чат одним кліком."
              : "Власник команди ще не додав посилання-запрошення. Зверніться до нього."}
          </div>

          {isOwner ? (
            <button type="button" className="btn btn-primary" onClick={openEdit} disabled={busy}>
              <i className="bi bi-plus-lg" /> Додати посилання
            </button>
          ) : null}
        </div>
      )}

      <ChatLinkModal
        open={modalOpen}
        submitting={busy}
        initialLink={link}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
