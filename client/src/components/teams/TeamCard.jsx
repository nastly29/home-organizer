import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function TeamCard({ team }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const membersCount = team.membersCount ?? 0;

  async function handleCopy(e) {
    e.stopPropagation(); 

    try {
      await navigator.clipboard.writeText(team.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Скопіюйте код команди:", team.id);
    }
  }

  function handleOpen() {
    navigate(`/teams/${team.id}`);
  }

  return (
    <div
      className="team-card"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpen();
      }}
    >

      <div className="team-card__left">
        <div className="team-card__title">{team.name}</div>

        <div className="team-card__members">
          <i className="bi bi-people" aria-hidden="true"></i>
          <span>{membersCount} учасників</span>
        </div>
      </div>

      <div className="team-card__right">
        <button
          type="button"
          className="team-card__copy"
          onClick={handleCopy}
        >
          <i className="bi bi-clipboard"></i>
          {copied ? "Скопійовано" : "Код команди"}
        </button>
      </div>
    </div>
  );
}
