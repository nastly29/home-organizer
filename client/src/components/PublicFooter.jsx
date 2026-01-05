export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container footer-content">

        <div className="footer-brand">
          <div className="footer-title">HomePlanner</div>
          <p className="footer-desc">
            Сервіс для зручної організації спільного побуту.
          </p>
        </div>

        <div className="footer-contacts">
          <div>homeplanner.app@gmail.com</div>

          <div className="footer-socials">
            <i className="bi bi-instagram"></i>
            <i className="bi bi-facebook"></i>
            <i className="bi bi-twitter"></i>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} HomePlanner. Усі права захищені.
      </div>
    </footer>
  );
}