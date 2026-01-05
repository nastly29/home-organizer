import { Link } from "react-router-dom";

export default function HomeCard({ title, icon, to, children, className = "" }) {
  return (
    <div className={`home-card ${className}`.trim()}>
      <div className="home-card__head">
        <div className="home-card__title">
          <i className={`bi ${icon}`} /> {title}
        </div>

        {to ? (
          <Link to={to} className="home-card__link">
            Перейти <i className="bi bi-chevron-right" />
          </Link>
        ) : null}
      </div>

      <div className="home-card__rows">{children}</div>
    </div>
  );
}
