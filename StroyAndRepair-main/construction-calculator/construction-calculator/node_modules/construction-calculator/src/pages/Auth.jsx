import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import './Auth.scss';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const controls = useAnimation();

  // Создаем частицы для фона
  useEffect(() => {
    const particleTypes = [
      { color: 'rgba(42, 95, 127, 0.8)', size: [2, 6] },
      { color: 'rgba(255, 107, 107, 0.6)', size: [3, 8] },
      { color: 'rgba(77, 171, 245, 0.7)', size: [1, 4] }
    ];

    const newParticles = Array.from({ length: 50 }, (_, i) => {
      const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (type.size[1] - type.size[0]) + type.size[0],
        color: type.color,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 5,
        path: Math.random() > 0.5 ? 1 : -1
      };
    });
    setParticles(newParticles);

    controls.start({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, type: 'spring' }
    });
  }, [controls]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isLogin && formData.password !== formData.password2) {
      setError('Пароли не совпадают');
      setIsLoading(false);

      // Анимация встряски при ошибке
      await controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.6 }
      });
      return;
    }

    try {
      let success;
      if (isLogin) {
        success = await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        success = await register({
          email: formData.email,
          password: formData.password,
          password2: formData.password2
        });
      }

      if (success) {
        // Анимация успешного входа
        await controls.start({
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.5 }
        });
        navigate('/account');
      } else {
        setError(isLogin
          ? 'Неверный email или пароль'
          : 'Ошибка регистрации. Возможно, пользователь уже существует');

        // Анимация встряски при ошибке
        await controls.start({
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.6 }
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Произошла ошибка. Попробуйте позже');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ ...formData, password: '', password2: '' });
  };

  return (
    <div className="auth-container">
      {/* Улучшенные анимированные частицы фона */}
      <div className="particles-container">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="particle"
            initial={{
              x: `${particle.x}%`,
              y: `${particle.y}%`,
              opacity: 0,
              scale: 0
            }}
            animate={{
              x: `${particle.x + Math.sin(particle.id) * 10}%`,
              y: `${particle.y + 20}%`,
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
              rotate: [0, particle.path * 360]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: "linear"
            }}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              borderRadius: particle.size > 5 ? '50%' : '30%'
            }}
          />
        ))}
      </div>

      {/* Анимированный градиентный фон с пульсацией */}
      <motion.div
        className="gradient-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div
          className="gradient-circle-1"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="gradient-circle-2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: "easeInOut",
            delay: 5
          }}
        />
      </motion.div>

      {/* Добавим анимированные волны на задний план */}
      <div className="waves-container">
        <motion.div
          className="wave wave-1"
          animate={{
            x: ['-100%', '0%', '-100%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="wave wave-2"
          animate={{
            x: ['0%', '-100%', '0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
        />
      </div>

      {/* Основная карточка */}
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={controls}
        whileHover={{
          y: -5,
          boxShadow: '0 15px 45px rgba(42, 95, 127, 0.25)'
        }}
      >
        {/* Анимированный заголовок */}
        <motion.div
          className="auth-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h2
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.4 }}
          >
            {isLogin ? 'Войдите в свой аккаунт' : 'Присоединяйтесь к нам'}
          </motion.p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.span
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {error}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Анимированные поля ввода */}
          <motion.div
            className="input-group"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <input
              type="email"
              placeholder=" "
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            <motion.label
              initial={{ y: 0 }}
              animate={{
                y: formData.email ? -24 : 0,
                scale: formData.email ? 0.85 : 1,
                color: formData.email ? 'var(--primary-color)' : 'inherit'
              }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              Email
            </motion.label>
            <div className="input-highlight"></div>
          </motion.div>

          <motion.div
            className="input-group"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <input
              type="password"
              placeholder=" "
              required
              minLength="6"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <motion.label
              initial={{ y: 0 }}
              animate={{
                y: formData.password ? -24 : 0,
                scale: formData.password ? 0.85 : 1,
                color: formData.password ? 'var(--primary-color)' : 'inherit'
              }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              Пароль
            </motion.label>
            <div className="input-highlight"></div>
          </motion.div>

          <AnimatePresence>
            {!isLogin && (
              <motion.div
                className="input-group"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="password"
                  placeholder=" "
                  required
                  minLength="6"
                  value={formData.password2}
                  onChange={e => setFormData({ ...formData, password2: e.target.value })}
                />
                <motion.label
                  initial={{ y: 0 }}
                  animate={{
                    y: formData.password2 ? -24 : 0,
                    scale: formData.password2 ? 0.85 : 1,
                    color: formData.password2 ? 'var(--primary-color)' : 'inherit'
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Повторите пароль
                </motion.label>
                <div className="input-highlight"></div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {isLoading ? (
              <motion.span
                className="spinner"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            ) : isLogin ? (
              <motion.span
                key="login-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Войти
              </motion.span>
            ) : (
              <motion.span
                key="register-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Зарегистрироваться
              </motion.span>
            )}
          </motion.button>
        </form>

        <motion.div
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>
            {isLogin ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'}
            <motion.span
              onClick={toggleAuthMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLogin ? ' Зарегистрироваться' : ' Войти'}
            </motion.span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;