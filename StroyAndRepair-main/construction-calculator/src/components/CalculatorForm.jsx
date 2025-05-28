import Visualization3D from './Visualization3D';
import React, { useState, useEffect } from 'react';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from './Loader';
import { FiX, FiSave, FiPlusSquare } from 'react-icons/fi';
import './CalculatorForm.scss';

const CalculatorForm = ({ onClose, onCalculate }) => {
  const [category, setCategory] = useState('');
  const [calcType, setCalcType] = useState('');
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [calculationTypes, setCalculationTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('input');

  useEffect(() => {
    API.get('/calculation-types/')
      .then(res => setCalculationTypes(res.data))
      .catch(err => console.error(err));
  }, []);

  const validateField = (name, value) => {
    if (!value || value <= 0) return 'Поле обязательно для заполнения';
    return null;
  };

  const handleCalculate = async () => {
    const numericParams = {};
    const requiredFields = calculationTypes[category]?.calculations[calcType]?.fields || [];

    const newErrors = {};
    requiredFields.forEach(field => {
      const value = inputs[field.name];
      if (value === undefined || value === '') {
        newErrors[field.name] = 'Поле обязательно для заполнения';
      } else {
        numericParams[field.name] = parseFloat(value);
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/calculations/', {
        category,
        type: calcType,
        params: numericParams
      });
      setResult(data.result);
      setActiveTab('result');
      if (onCalculate) onCalculate(data);
    } catch (error) {
      console.error('Ошибка расчета:', error.response?.data);
      setErrors({
        general: error.response?.data?.error || 'Произошла ошибка при расчете'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    const numericValue = parseFloat(value);
    setInputs(prev => ({
      ...prev,
      [fieldName]: isNaN(numericValue) ? '' : numericValue
    }));
    setErrors(prev => ({ ...prev, [fieldName]: null }));
  };

  const resetForm = () => {
    setCategory('');
    setCalcType('');
    setInputs({});
    setResult(null);
    setErrors({});
    setActiveTab('input');
  };

  return (
    <motion.div
      className="calculator-modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className="calculator-header">
        <div className="header-content">
          <FiPlusSquare className="calculator-icon" />
          <h2>Строительный калькулятор</h2>
        </div>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      <div className="tabs">
        {result && (
          <>
            <button
              className={`tab ${activeTab === 'result' ? 'active' : ''}`}
              onClick={() => setActiveTab('result')}
            >
              Результат
            </button>
            <button
              className={`tab ${activeTab === 'visualization' ? 'active' : ''}`}
              onClick={() => setActiveTab('visualization')}
            >
              3D Визуализация
            </button>
          </>
        )}
      </div>

      <div className="calculator-body">
        <AnimatePresence mode="wait">
          {activeTab === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Выбор категории */}
              <div className="form-group">
                <label>Категория работ</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCalcType('');
                    setInputs({});
                    setErrors({});
                  }}
                  className={`type-select ${errors.category ? 'error' : ''}`}
                >
                  <option value="">Выберите категорию</option>
                  {Object.entries(calculationTypes).map(([key, item]) => (
                    <option key={key} value={key}>{item.name}</option>
                  ))}
                </select>
                {errors.category &&
                  <span className="error-message">{errors.category}</span>}
              </div>

              {/* Выбор типа расчета */}
              {category && (
                <div className="form-group">
                  <label>Тип расчета</label>
                  <select
                    value={calcType}
                    onChange={(e) => {
                      setCalcType(e.target.value);
                      setInputs({});
                      setErrors({});
                    }}
                    className={`type-select ${errors.calcType ? 'error' : ''}`}
                  >
                    <option value="">Выберите тип расчета</option>
                    {calculationTypes[category]?.calculations && Object.entries(calculationTypes[category].calculations).map(([key, item]) => (
                      <option key={key} value={key}>{item.name}</option>
                    ))}
                  </select>
                  {errors.calcType &&
                    <span className="error-message">{errors.calcType}</span>}
                </div>
              )}

              {/* Поля ввода */}
              <div className="input-grid">
                {calcType && category && calculationTypes[category]?.calculations[calcType]?.fields?.map(field => (
                  <div key={field.name} className="form-group">
                    <label>{field.label}</label>
                    <div className="input-with-unit">
                      <input
                        type={field.type || 'number'}
                        step={field.step || 1}
                        min={field.min}
                        max={field.max}
                        value={inputs[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className={errors[field.name] ? 'error' : ''}
                        placeholder={field.default ? `По умолчанию: ${field.default}` : ''}
                      />
                      {field.unit && <span className="unit">{field.unit}</span>}
                    </div>
                    {errors[field.name] &&
                      <span className="error-message">{errors[field.name]}</span>}
                  </div>
                ))}
              </div>

              {errors.general && (
                <div className="error-message general-error">
                  {errors.general}
                </div>
              )}

              <div className="actions">
                <button className="reset-btn" onClick={resetForm}>
                  Сбросить
                </button>
                <button
                  className="calculate-btn"
                  onClick={handleCalculate}
                  disabled={!category || !calcType || loading}
                >
                  {loading ? <Loader size="small" /> : 'Рассчитать'}
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'result' ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="result-container"
            >
              {result && (
                <>
                  <div className="result-summary">
                    <h3>Итоговые результаты</h3>
                    <div className="summary-card">
                      <div className="summary-item">
                        <span>Тип расчета:</span>
                        <span>{calculationTypes[category]?.calculations[calcType]?.name}</span>
                      </div>
                      <div className="summary-item">
                        <span>Категория:</span>
                        <span>{calculationTypes[category]?.name}</span>
                      </div>
                    </div>
                  </div>

                  {result.materials && (
                    <div className="materials-section">
                      <h4>Необходимые материалы</h4>
                      <div className="materials-grid">
                        {result.materials.map((material, index) => (
                          <div key={index} className="material-card">
                            <div className="material-name">{material.name}</div>
                            <div className="material-quantity">
                              {material.quantity} {material.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.details && (
                    <div className="details-section">
                      <h4>Детали расчета</h4>
                      <div className="details-card">
                        <pre>{result.details}</pre>
                      </div>
                    </div>
                  )}

                  <div className="result-actions">
                    <button className="back-btn" onClick={() => setActiveTab('input')}>
                      Вернуться
                    </button>
                    <button
                      className="save-btn"
                      onClick={() => setActiveTab('visualization')}
                    >
                      <FiSave /> Показать визуализацию
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="visualization"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="visualization-tab"
            >
              <Visualization3D
                category={category}
                calcType={calcType}
                inputs={inputs}
                result={result}
              />
              <div className="visualization-actions">
                <button className="back-btn" onClick={() => setActiveTab('result')}>
                  Назад к результатам
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CalculatorForm;