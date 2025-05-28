// components/Features.jsx
import { motion } from 'framer-motion';
import './Features.scss';
import { useEffect } from 'react';

export default function Features() {
  const features = [
    { 
      title: "Автоматический расчет",
      text: "Система учитывает все строительные нормы",
      icon: "⚡"
    },
    {
      title: "3D визуализация",
      text: "Наглядное отображение результатов",
      icon: "👁️"
    },
    {
      title: "Экспорт сметы",
      text: "Выгрузка в PDF, Excel и другие форматы",
      icon: "📤"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 20, 
      opacity: 0, 
      rotate: -2,
      scale: 0.95
    },
    visible: { 
      y: 0, 
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 12,
        delay: Math.random() * 0.3
      }
    }
  };

  const handleMouseMove = (e) => {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="features" id="features">
      <div className="container">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          Наши преимущества
        </motion.h2>
        
        <motion.div 
          className="features__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div 
              className="feature-card"
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                rotate: [0, -2, 2, 0] 
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <div className="feature-wave"></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}