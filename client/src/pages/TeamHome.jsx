import { useEffect, useMemo, useState } from "react";
import { useParams} from "react-router-dom";

import { apiGetTeamDashboard } from "../firebase/authApi";

import HomeCard from "../components/teamHome/HomeCard";
import MetricRow from "../components/teamHome/MetricRow";
import TodayList from "../components/teamHome/TodayList";

function formatMoneyUAH(amount) {
  const n = Number(amount ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toFixed(0)} грн`;
}

export default function TeamHome() {
  const { teamId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!teamId) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiGetTeamDashboard(teamId);
      setData(res || null);
    } catch (e) {
      setData(null);
      setError(e?.message || "INTERNAL_ERROR");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const todayTitles = useMemo(() => data?.events?.todayTitles || [], [data]);

  return (
    <div className="team-home-page">
      
      <div className="team-home-head">
        <div className="team-home-head__left">
          <h2 className="team-home-title">Головна</h2>
          <div className="team-home-subtitle">Коротка статистика команди.</div>
        </div>

        <div className="team-home-head__right">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={load}
            disabled={loading}
            title="Оновити статистику"
          >
            <i className="bi bi-arrow-repeat" /></button>
        </div>
      </div>

      {error ? <div className="alert alert-danger team-home-alert">{error}</div> : null}

      {loading ? (
        <div className="team-home-state">
          <div className="spinner-border" role="status" aria-hidden="true" />
          <div className="team-home-state__text">Завантаження...</div>
        </div>
      ) : (
        <>
          <div className="team-home-grid">
          
            <HomeCard title="Завдання" icon="bi-check2-square" to={`/teams/${teamId}/tasks`}>
              <MetricRow label="Невиконані на тиждень" value={data?.tasks?.weekOpenTotal ?? 0} />
              <MetricRow label="Мої невиконані на тиждень" value={data?.tasks?.weekOpenMine ?? 0} />
              <MetricRow label="Прострочені" value={data?.tasks?.overdueOpen ?? 0} danger />
            </HomeCard>

    
            <HomeCard title="Покупки" icon="bi-bag" to={`/teams/${teamId}/shopping`}>
              <MetricRow label="Потрібно купити" value={data?.shopping?.openCount ?? 0} />
            </HomeCard>

           
            <HomeCard title="Витрати" icon="bi-cash-coin" to={`/teams/${teamId}/finances`}>
              <MetricRow
                label="Загалом за місяць"
                value={formatMoneyUAH(data?.finances?.monthTotal)}
                money
              />
              <MetricRow label="Мої за місяць" value={formatMoneyUAH(data?.finances?.monthMine)} money />
            </HomeCard>

          
            <HomeCard
              title="Події"
              icon="bi-calendar-event"
              to={`/teams/${teamId}/calendar`}
              className="home-card--events"
            >
              <MetricRow label="Подій на тиждень" value={data?.events?.weekCount ?? 0} />
              <TodayList titles={todayTitles} />
            </HomeCard>
          </div>
        </>
      )}
    </div>
  );
}
