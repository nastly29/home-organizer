import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function PrivateHeader() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }

    function onEsc(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function onLogout() {
    await signOut(auth);
    navigate("/", { replace: true });
  }

  return (
    <header className="private-header">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/dashboard" className="brand">
          <span className="brand__icon" aria-hidden="true">
            <i className="bi bi-house-door-fill"></i>
          </span>
          <span className="brand__text">
            <span className="brand__top">HOME</span>
            <span className="brand__bottom">PLANNER</span>
          </span>
        </Link>

        <div className="d-flex align-items-center gap-2">
          <Link to="/dashboard" className="btn-my-teams">
            Мої команди
          </Link>

          <div className="profile-menu" ref={menuRef}>
            <button
              type="button"
              className="btn-profile"
              aria-label="Профіль"
              aria-haspopup="menu"
              aria-expanded={menuOpen ? "true" : "false"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <i className="bi bi-person" aria-hidden="true"></i>
            </button>

            <div className={`profile-dropdown ${menuOpen ? "is-open" : ""}`} role="menu">
              <Link className="profile-dropdown__item" to="/profile" onClick={() => setMenuOpen(false)}>
                <i className="bi bi-gear" aria-hidden="true"></i>
                Налаштування
              </Link>

              <div className="profile-dropdown__divider" />

              <button
                className="profile-dropdown__item profile-dropdown__item--danger"
                type="button"
                onClick={onLogout}
              >
                <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
                Вийти
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}