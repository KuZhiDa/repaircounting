import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scrollToSection } from '../utils/scrollHelpers';
import './Header.scss';

const Header = () => {
  const { isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scrollToSection(sectionId), 300);
    } else {
      scrollToSection(sectionId);
    }
  };

  const getHeaderStyle = () => {
    if (location.pathname === '/account') return 'account';
    return location.pathname === '/' ? 'home' : 'default';
  };

  if (loading) return null;

  return (
    <header className={`header header--${getHeaderStyle()}`}>
      <div className="header__container">
        <div 
          className="header__logo" 
          onClick={() => navigate('/')}
          role="button"
          aria-label="На главную"
        >
          <span>СтройРасчёт</span>
        </div>

        <nav className="header__nav">
          {/* Основные кнопки навигации */}
          {location.pathname === '/' && (
            <div className="header__main-nav">
              <button 
                className="header__nav-btn"
                onClick={() => handleNavigation('calculator')}
                aria-label="Перейти к калькулятору"
              >
                Калькулятор
              </button>
              <button 
                className="header__nav-btn"
                onClick={() => handleNavigation('materials')}
                aria-label="Перейти к материалам"
              >
                Материалы
              </button>
            </div>
          )}

          {/* Кнопки авторизации */}
          <div className="header__auth-btns">
            {isAuthenticated ? (
              <div className="header__auth-group">
                <button
                  className="header__nav-btn"
                  onClick={() => navigate('/account')}
                  aria-label="Личный кабинет"
                >
                  Кабинет
                </button>
                <button
                  className="header__nav-btn header__nav-btn--logout"
                  onClick={logout}
                  aria-label="Выйти из системы"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                className="header__nav-btn"
                onClick={() => navigate('/auth')}
                aria-label="Авторизация"
              >
                Войти
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;