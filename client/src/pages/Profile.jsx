import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

import EditNameModal from "../modals/profile/EditNameModal";
import EditEmailModal from "../modals/profile/EditEmailModal";
import ChangePasswordModal from "../modals/profile/ChangePasswordModal";
import DeleteAccountModal from "../modals/profile/DeleteAccountModal";

function mapFirebaseError(err) {
  const code = err?.code || "";

  switch (code) {
    case "auth/email-already-exists":
      return "Такий email вже використовується іншим акаунтом.";
    case "auth/invalid-email":
      return "Некоректний формат email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Невірний поточний пароль.";
    case "auth/too-many-requests":
      return "Забагато спроб. Спробуйте пізніше.";
    case "auth/requires-recent-login":
      return "Потрібно повторно увійти. Вийдіть і зайдіть ще раз, потім повторіть дію.";
    case "auth/weak-password":
      return "Пароль занадто слабкий. Використайте щонайменше 6 символів.";
    case "auth/operation-not-allowed":
      return "Потрібно підтвердити новий email. Ми надішлемо лист із посиланням для підтвердження.";
    default:
      return err?.message || "Сталася помилка. Спробуйте ще раз.";
  }
}

export default function Profile() {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");

  const [pageInfo, setPageInfo] = useState("");

  const [openName, setOpenName] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    setDisplayEmail(user.email || "");
  }, [user]);

  useEffect(() => {
    if (!pageInfo) return;
  
    const timer = setTimeout(() => {
      setPageInfo("");
    }, 15000); 

    return () => clearTimeout(timer);
  }, [pageInfo]);
  

  return (
    <div className="container py-4 profile-page">
      <h1 className="page-title text-center">Налаштування профілю</h1>

      <div className="profile-wrap">
        {pageInfo ? <div className="alert alert-success profile-alert">{pageInfo}</div> : null}

        <div className="profile-card profile-card--single">
          <div className="profile-row">
            <div>
              <div className="profile-row__title">Імʼя</div>
              <div className="profile-row__value">{displayName || "—"}</div>
            </div>
            <button className="profile-action-btn" onClick={() => setOpenName(true)} aria-label="Редагувати імʼя">
              <i className="bi bi-pencil"></i>
            </button>
          </div>

          <div className="profile-row">
            <div>
              <div className="profile-row__title">Email</div>
              <div className="profile-row__value">{displayEmail || "—"}</div>
            </div>
            <button className="profile-action-btn" onClick={() => setOpenEmail(true)} aria-label="Редагувати email">
              <i className="bi bi-pencil"></i>
            </button>
          </div>

          <div className="profile-row">
            <div>
              <div className="profile-row__title">Пароль</div>
              <div className="profile-row__value">••••••••</div>
            </div>
            <button className="profile-action-btn" onClick={() => setOpenPassword(true)} aria-label="Змінити пароль">
              <i className="bi bi-lock"></i>
            </button>
          </div>

          <div className="profile-danger">
            <button className="profile-danger__link" onClick={() => setOpenDelete(true)}>
              <i className="bi bi-trash"></i>
              Видалити акаунт
            </button>
          </div>
        </div>
      </div>

      <EditNameModal
        open={openName}
        onClose={() => setOpenName(false)}
        initialName={displayName}
        mapError={mapFirebaseError}
        onSuccess={(newName) => {
          setDisplayName(newName);
          setPageInfo("Імʼя успішно оновлено.");
        }}
      />

      <EditEmailModal
        open={openEmail}
        onClose={() => setOpenEmail(false)}
        initialEmail={displayEmail}
        currentEmail={displayEmail} 
        mapError={mapFirebaseError}
        onInfo={(msg) => setPageInfo(msg)}
      />

      <ChangePasswordModal
        open={openPassword}
        onClose={() => setOpenPassword(false)}
        mapError={mapFirebaseError}
        onInfo={(msg) => setPageInfo(msg)}
      />

      <DeleteAccountModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        mapError={mapFirebaseError}
      />
    </div>
  );
}
