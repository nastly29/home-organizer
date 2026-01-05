import { Link } from "react-router-dom";

export default function PublicHeader({ onLoginClick, onRegisterClick }) {
  return (
    <header className="public-header">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className="brand">
          <span className="brand__icon" aria-hidden="true">
            <i className="bi bi-house-door-fill"></i>
          </span>

          <span className="brand__text">
            <span className="brand__top">HOME</span>
            <span className="brand__bottom">PLANNER</span>
          </span>
        </Link>

        <div className="nav-actions d-flex gap-2">
          <button type="button" className="btn btn-outline-primary" onClick={onLoginClick}>
            Увійти
          </button>
          <button type="button" className="btn btn-primary" onClick={onRegisterClick}>
            Реєстрація
          </button>
        </div>
      </div>
    </header>
  );
}
