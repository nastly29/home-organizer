const FEATURES = [
  {
    icon: "bi-check2-square",
    title: "Завдання",
    desc: "Розподіляйте обовʼязки між учасниками групи та легко відстежуйте виконання кожної справи."
  },
  {
    icon: "bi-cart3",
    title: "Покупки",
    desc: "Користуйтесь спільним списком покупок — нічого не загубиться і не купиться двічі."
  },
  {
    icon: "bi-cash-coin",
    title: "Витрати",
    desc: "Записуйте свої витрати, щоб розуміти, на що йдуть кошти."
  },
  {
    icon: "bi-calendar-event",
    title: "Події",
    desc: "Плануйте важливі дати чи спільні справи."
  },
  {
    icon: "bi-grid",
    title: "Дашборд",
    desc: "Переглядайте коротку статистику команди."
  },
  {
    icon: "bi-chat-dots",
    title: "Чат",
    desc: "Додавайте посилання-запрошення на чат в месенджері та відкривайте його одним кліком."
  }
];   
  
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div className="card h-100 feature-card">
        <div className="card-body feature-card-content">
          
          <i
            className={`bi ${icon} feature-icon`}
            aria-hidden="true"
          ></i>

          <div className="feature-text">
            <div className="title">{title}</div>
            <p className="desc">{desc}</p>
          </div>

        </div>
      </div>
    </div>
  );
}  
  
export default function FeatureGrid() {
  return (
  <section className="features" id="features">
    <div className="container text-center">
      <h2>Що ви отримуєте?</h2>
        <p className="subtitle mx-auto">Все, що потрібно для комфортного спільного життя, зібрано в одному місці</p>
      
        <div className="row g-3 justify-content-center">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
} 