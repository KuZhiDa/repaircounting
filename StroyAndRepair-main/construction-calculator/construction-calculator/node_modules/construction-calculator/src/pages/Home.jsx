import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './Home.scss';
import { scrollToSection } from '../utils/scrollHelpers';
import CalculatorForm from '../components/CalculatorForm';
import Features from '../components/Features';
import Materials from '../components/Materials';
import heroImage from '../assets/images/hero-bg.jpg';

const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const textVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Home() {

    const homeRef = useRef(null);

    useEffect(() => {
      const updatePadding = () => {
        const header = document.querySelector('.header');
        if (header && homeRef.current) {
          const headerHeight = header.offsetHeight;
          homeRef.current.style.paddingTop = `${headerHeight}px`;
        }
      };
  
      updatePadding();
      window.addEventListener('resize', updatePadding);
      return () => window.removeEventListener('resize', updatePadding);
    }, []);

  return (
    <main ref={homeRef}>
      <section className="hero" id="hero">
        <div className="container">
          <motion.div 
            className="hero__content"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="hero__text">
              <motion.h1 
                variants={textVariants}
                className="gradient-text"
              >
                Профессиональный расчет<br/>строительных материалов
              </motion.h1>
              
              <motion.p 
                variants={textVariants}
                className="hero__subtitle"
              >
                Точные вычисления для вашего проекта с учетом всех технических норм
              </motion.p>

              <motion.div 
                className="hero__cta"
                variants={textVariants}
              >
                <motion.button 
                  className="btn btn--primary"
                  onClick={() => scrollToSection('calculator')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Начать расчет
                </motion.button>
                <motion.button 
                  className="btn btn--outline"
                  onClick={() => scrollToSection('features')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Примеры проектов
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div 
              className="hero__image"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 50 }}
            >
              <img 
                src={heroImage} 
                alt="Строительные материалы" 
              />
              <div className="hero__glow"></div>
            </motion.div>
          </motion.div>
        </div>

        {/* Анимированный фон */}
        <div className="hero__waves">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
        </div>
      </section>

      {/* Секция преимуществ */}
      <section className="features-section" id="features">
        <div className="container">
          <Features />
        </div>
      </section>

      {/* Секция калькулятора */}
      <section className="calculator-section" id="calculator">
        <div className="container">
          <h2 className="section-title">Онлайн-калькулятор</h2>
          <CalculatorForm />
        </div>
      </section>

      {/* Секция материалов */}
      <section className="materials-section" id="materials">
        <div className="container">
          <h2 className="section-title">Каталог материалов</h2>
          <Materials />
        </div>
      </section>
    </main>
  );
}