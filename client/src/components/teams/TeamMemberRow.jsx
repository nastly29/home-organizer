export default function TeamMemberRow({
  member,
  myUid = "",
  isOwnerViewer = false,
  removing = false,
  onRemove,
}) {
  const isMe = member?.uid === myUid;

  const isOwnerMember = member?.role === "owner";
  const ownerLabel = isOwnerMember ? (isMe ? "(Ви)" : "(Власник)") : "";

  const canRemove =
    isOwnerViewer &&
    !isOwnerMember &&
    !isMe &&
    typeof onRemove === "function";

  return (
    <div className="team-member-row">
      <div className="team-member-row__left">
        <div className="team-member-row__name">
          {member?.displayName || "Без імені"}{" "}
          {ownerLabel ? (
            <span className="team-member-row__badge">{ownerLabel}</span>
          ) : null}
        </div>

        <div className="team-member-row__email">{member?.email || "—"}</div>
      </div>

      <div className="team-member-row__right">
        {canRemove ? (
          <button
            type="button"
            className="team-member-remove"
            disabled={removing}
            onClick={() => onRemove(member)}
            title="Видалити учасника"
          >
            {removing ? "Видалення..." : "Видалити"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
