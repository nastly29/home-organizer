export default function TodayList({ titles = [] }) {
    const list = Array.isArray(titles) ? titles : [];
  
    return (
      <div className="home-today">
        <div className="home-today__title">Сьогодні</div>
  
        {list.length ? (
          <div className="home-today__list">
            {list.slice(0, 6).map((t, idx) => (
              <div key={`${t}-${idx}`} className="home-today__item" title={t}>
                {t}
              </div>
            ))}
  
            {list.length > 6 ? <div className="home-today__more">+ ще {list.length - 6}</div> : null}
          </div>
        ) : (
          <div className="home-today__empty">Немає подій на сьогодні</div>
        )}
      </div>
    );
  }
  