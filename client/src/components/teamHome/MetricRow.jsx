export default function MetricRow({ label, value, danger = false, money = false }) {
    return (
      <div className={`home-metric ${danger ? "is-danger" : ""}`.trim()}>
        <div className="home-metric__label">{label}</div>
        <div className={`home-metric__value ${money ? "is-money" : ""}`.trim()}>{value}</div>
      </div>
    );
  }
  