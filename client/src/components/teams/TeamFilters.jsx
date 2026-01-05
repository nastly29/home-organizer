export default function TeamFilters({ value, onChange }) {
    return (
      <div className="teams-filters">
        <button
          type="button"
          className={`btn ${value === "all" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => onChange("all")}
        >
          Всі команди
        </button>
  
        <button
          type="button"
          className={`btn ${value === "member" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => onChange("member")}
        >
          Учасник
        </button>
  
        <button
          type="button"
          className={`btn ${value === "admin" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => onChange("admin")}
        >
          Власник
        </button>
      </div>
    );
  }
  