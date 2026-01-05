import heroImage from "../../assets/photo/photo.png";

export default function Hero() {
    return (
      <section className="hero">
        <div className="container">
          <div className="row align-items-center">
  
            <div className="col-12 col-lg-6 hero-content">
              <h1>
                HomePlanner — просте рішення для спільного життя!
              </h1>
  
              <p>
                Плануйте справи, покупки, витрати та події разом з тими, з ким ви живете. Все необхідне — в одному місці, без зайвого хаосу.
              </p>
  
              <a href="#features" className="btn btn-primary hero-cta">
                Дізнатись детальніше
              </a>
            </div>
  
            <div className="col-12 col-lg-6 hero-image-wrap">
              <img
                src={heroImage}
                alt="Людина працює з завданнями"
                className="hero-image"
              />
            </div>
  
          </div>
        </div>
      </section>
    );
  }
  