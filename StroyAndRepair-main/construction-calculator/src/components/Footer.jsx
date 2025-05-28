import './Footer.scss';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <p>© 2025 СтройПодсчет. Все права защищены</p>
          <div className="footer__contacts">
            <a href="tel:+79991234567">+7 (908) 518-11-76</a>
            <a href="mailto:info@buildcalc.ru">alexa234a@yandex.ru</a>
          </div>
        </div>
      </div>
    </footer>
  );
}