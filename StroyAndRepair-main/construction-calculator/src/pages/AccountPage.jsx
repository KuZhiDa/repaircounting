import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import CalculatorForm from '../components/CalculatorForm';
import './AccountPage.scss';
import {
  FiPlus, FiTrash2, FiX,
  FiBox, FiDollarSign,
  FiPieChart, FiList, FiBarChart2, FiPercent,
  FiDownload, FiFileText, FiFile, FiFileMinus
} from 'react-icons/fi';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AccountPage = () => {
  const { user, logout } = useAuth();
  const [calculations, setCalculations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [activeTab, setActiveTab] = useState('calculations');
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    title: '',
    description: ''
  });
  const [showAddCalculationModal, setShowAddCalculationModal] = useState(false);
  const [costData, setCostData] = useState({
    planned: '',
    actual: ''
  });
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    quantity: '',
    unit: 'м²'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [calcRes, materialsRes, budgetsRes] = await Promise.all([
        API.get('/user/calculations/'),
        API.get('/user/materials/'),
        API.get('/user/budgets/')
      ]);
      setCalculations(calcRes.data);
      setMaterials(materialsRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCalculate = async (calculationData) => {
    try {
      const { data } = await API.post('/calculations/', calculationData);
      setCalculations(prev => [data, ...prev]);
      setShowCalculator(false);
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Ошибка при сохранении расчета: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('ru-RU', options);
    } catch {
      return dateString;
    }
  };

  const getCalculationName = (calc) => {
    const types = {
      paint: 'Покраска стен',
      tiles: 'Укладка плитки',
      wallpaper: 'Обои',
      laminate: 'Ламинат',
      plaster: 'Штукатурка',
      foundation: 'Фундамент',
      bricks: 'Кирпичная кладка',
      roofing: 'Кровельные материалы',
      insulation: 'Утеплитель'
    };
    return types[calc.type] || calc.calculation_type || calc.type;
  };

  const handleDeleteMaterial = async (id) => {
    try {
      await API.delete(`/user/materials/${id}/`);
      setMaterials(materials.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.quantity) return;

    try {
      const { data } = await API.post('/user/materials/', newMaterial);
      setMaterials([...materials, data]);
      setNewMaterial({ name: '', quantity: '', unit: 'кг' });
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };

  const createBudget = async () => {
    try {
      const { data } = await API.post('/user/budgets/', newBudget);
      setBudgets([...budgets, data]);
      setNewBudget({
        title: '',
        description: ''
      });
      setShowBudgetForm(false);
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const deleteBudget = async (id) => {
    try {
      await API.delete(`/user/budgets/${id}/`);

      // Оптимистичное обновление UI
      setBudgets(budgets.filter(b => b.id !== id));

      if (selectedBudget?.id === id) {
        setSelectedBudget(null);
        setShowBudgetModal(false);
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Ошибка при удалении сметы: ' + (error.response?.data?.error || error.message));

      // В случае ошибки - перезагружаем данные
      fetchData();
    }
  };

  const addCalculationToBudget = async (calculationId) => {
    if (!selectedBudget) return;

    try {
      // 1. Находим полные данные расчета
      const calculation = calculations.find(c => c.id === calculationId);
      if (!calculation) {
        throw new Error('Расчет не найден');
      }

      // 2. Отправляем запрос на добавление
      const response = await API.post(`/user/budgets/${selectedBudget.id}/calculations/`, {
        calculation_id: calculationId,
        planned_cost: costData.planned || null,
        actual_cost: costData.actual || null
      });

      // 3. Создаем новый объект элемента сметы
      const newBudgetItem = {
        id: response.data.id, // ID из ответа сервера
        calculation_details: {
          ...calculation,
          category: calculation.category,
          type: calculation.calculation_type || calculation.type
        },
        planned_cost: costData.planned ? parseFloat(costData.planned) : null,
        actual_cost: costData.actual ? parseFloat(costData.actual) : null
      };

      // 4. Обновляем состояние без запроса к серверу
      const updatedBudget = {
        ...selectedBudget,
        items: [...(selectedBudget.items || []), newBudgetItem],
        total_planned: selectedBudget.total_planned + (newBudgetItem.planned_cost || 0),
        total_actual: selectedBudget.total_actual + (newBudgetItem.actual_cost || 0)
      };

      setSelectedBudget(updatedBudget);
      setBudgets(budgets.map(b => b.id === updatedBudget.id ? updatedBudget : b));

      setShowAddCalculationModal(false);
      setCostData({ planned: '', actual: '' });
    } catch (error) {
      console.error('Error adding calculation to budget:', error);
      alert('Ошибка при добавлении расчета: ' + (error.response?.data?.error || error.message));
    }
  };

  const removeCalculationFromBudget = async (budgetItemId) => {
    if (!selectedBudget) return;

    try {
      await API.delete(`/user/budgets/${selectedBudget.id}/calculations/${budgetItemId}/`);

      // Оптимистичное обновление UI
      const updatedBudget = {
        ...selectedBudget,
        items: selectedBudget.items.filter(item => item.id !== budgetItemId),
        total_planned: selectedBudget.total_planned - (selectedBudget.items.find(item => item.id === budgetItemId)?.planned_cost || 0),
        total_actual: selectedBudget.total_actual - (selectedBudget.items.find(item => item.id === budgetItemId)?.actual_cost || 0)
      };

      setSelectedBudget(updatedBudget);
      setBudgets(budgets.map(b => b.id === updatedBudget.id ? updatedBudget : b));
    } catch (error) {
      console.error('Error removing calculation from budget:', error);
      alert('Ошибка при удалении расчета: ' + (error.response?.data?.error || error.message));
      // Можно добавить повторную загрузку данных в случае ошибки
      fetchData();
    }
  };

  const getBudgetChartData = (budget) => {
    if (!budget?.items) return null;

    const categories = {};
    budget.items.forEach(item => {
      const category = item.calculation_details.category;
      if (!categories[category]) {
        categories[category] = {
          planned: 0,
          actual: 0
        };
      }
      categories[category].planned += parseFloat(item.planned_cost || 0);
      categories[category].actual += parseFloat(item.actual_cost || 0);
    });

    return {
      labels: Object.keys(categories),
      datasets: [
        {
          label: 'Плановые затраты',
          data: Object.values(categories).map(c => c.planned),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Фактические затраты',
          data: Object.values(categories).map(c => c.actual),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getBudgetPieData = (budget) => {
    if (!budget?.items) return null;

    const categories = {};
    budget.items.forEach(item => {
      const type = item.calculation_details.type;
      if (!categories[type]) {
        categories[type] = 0;
      }
      categories[type] += parseFloat(item.actual_cost || item.planned_cost || 0);
    });

    const backgroundColors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)'
    ];

    return {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: backgroundColors.slice(0, Object.keys(categories).length),
          borderWidth: 1
        }
      ]
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.email?.split('@')[0] || 'Строитель';

    if (hour >= 5 && hour < 12) return `Доброе утро, ${name}!`;
    if (hour >= 12 && hour < 18) return `Добрый день, ${name}!`;
    if (hour >= 18 && hour < 23) return `Добрый вечер, ${name}!`;
    return `Доброй ночи, ${name}!`;
  };

  const renderCalculationDetails = (calc) => {
    if (!calc) return null;

    const resultData = calc.result || calc.result_data;
    if (!resultData) return null;

    if (resultData.materials) {
      return (
        <div className="materials-list">
          {resultData.materials.slice(0, 2).map((mat, i) => (
            <div key={i} className="material-item">
              <span>{mat.name}:</span>
              <span>{mat.quantity} {mat.unit}</span>
            </div>
          ))}
          {resultData.materials.length > 2 && (
            <div className="more-items">+{resultData.materials.length - 2} материалов</div>
          )}
        </div>
      );
    }

    if (resultData.details) {
      return <p className="details-text">{resultData.details}</p>;
    }

    return null;
  };

const exportToWord = (calculation) => {

  const resultData = calculation.result || calculation.result_data || {};
    const translateParam = (key) => {
        const translations = {
            // Основные геометрические параметры
            length: 'Длина',
            width: 'Ширина',
            height: 'Высота',
            depth: 'Глубина',
            area: 'Площадь',
            perimeter: 'Периметр',
            volume: 'Объем',

            // Материалы и характеристики
            thickness: 'Толщина',
            quantity: 'Количество',
            weight: 'Вес',
            density: 'Плотность',

            // Параметры для конкретных типов расчетов
            paint_coverage: 'Расход краски',
            paint_layers: 'Количество слоев',
            wall_area: 'Площадь стен',
            color: 'Цвет',
            tile_width: 'Ширина плитки',
            tile_length: 'Длина плитки',
            tile_area: 'Площадь плитки',
            gap_width: 'Ширина шва',
            tile_quantity: 'Количество плиток',
            pattern: 'Узор',
            wallpaper_length: 'Длина рулона',
            wallpaper_width: 'Ширина рулона',
            rapport: 'Раппорт',
            wall_height: 'Высота стен',
            laminate_width: 'Ширина ламината',
            laminate_length: 'Длина ламината',
            laminate_pack: 'Штук в упаковке',
            underlay: 'Подложка',
            plaster_thickness: 'Толщина слоя',
            plaster_consumption: 'Расход штукатурки',
            foundation_type: 'Тип фундамента',
            concrete_grade: 'Марка бетона',
            concrete_per_cubic: 'Бетон на куб.м',
            reinforcement: 'Арматура',
            formwork: 'Опалубка',
            brick_type: 'Тип кирпича',
            brick_quantity: 'Количество кирпичей',
            mortar_consumption: 'Расход раствора',
            roof_type: 'Тип кровли',
            roof_slope: 'Уклон крыши',
            roofing_material: 'Кровельный материал',
            insulation_type: 'Тип утеплителя',
            insulation_thickness: 'Толщина утеплителя',
            unit: 'Единица измерения',
            name: 'Название',
            description: 'Описание',
            price: 'Цена',
            total: 'Итого',
            coefficient: 'Коэффициент',
            efficiency: 'Эффективность'
        };
        return translations[key] || key;
    };

    // Формируем параметры
    const inputParams = Object.entries(calculation.input_data || {})
        .map(([key, value]) => {
            const translatedKey = translateParam(key);
            const formattedValue = value !== null && value !== undefined ? value : 'не указано';
            return `${translatedKey}: ${formattedValue}`;
        })
        .join('\n');

    // Формируем материалы
 let materialsContent = 'Не требуется';
    if (resultData.materials?.length > 0) {
        materialsContent = resultData.materials
            .map(mat => `- ${mat.name}: ${mat.quantity} ${mat.unit}`)
            .join('\n');
    }

    // Формируем результаты и объем работ
    let resultContent = 'Нет данных';
    if (resultData.details) {
        resultContent = resultData.details;
    } else if (resultData.total) {
        resultContent = `Итого: ${resultData.total}`;
    }

    const content = `
        ===== РАСЧЕТ =====
        Тип: ${getCalculationName(calculation)}
        Дата создания: ${formatDate(calculation.created_at)}
        
        === ВВЕДЕННЫЕ ПАРАМЕТРЫ ===
        ${inputParams}
        
        === РЕЗУЛЬТАТЫ И ОБЪЕМ РАБОТ ===
        ${resultContent}
        
        === НЕОБХОДИМЫЕ МАТЕРИАЛЫ ===
        ${materialsContent}
    `;

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Расчет_${getCalculationName(calculation)}_${calculation.created_at}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportToExcel = (calculation) => {
    const resultData = calculation.result || calculation.result_data || {};
    
    // Полный словарь переводов как в exportToWord
    const translateParam = (key) => {
        const translations = {
            length: 'Длина',
            width: 'Ширина',
            height: 'Высота',
            depth: 'Глубина',
            area: 'Площадь',
            perimeter: 'Периметр',
            volume: 'Объем',
            thickness: 'Толщина',
            quantity: 'Количество',
            weight: 'Вес',
            density: 'Плотность',
            paint_coverage: 'Расход краски',
            paint_layers: 'Количество слоев',
            wall_area: 'Площадь стен',
            color: 'Цвет',
            tile_width: 'Ширина плитки',
            tile_length: 'Длина плитки',
            tile_area: 'Площадь плитки',
            gap_width: 'Ширина шва',
            tile_quantity: 'Количество плиток',
            pattern: 'Узор',
            wallpaper_length: 'Длина рулона',
            wallpaper_width: 'Ширина рулона',
            rapport: 'Раппорт',
            wall_height: 'Высота стен',
            laminate_width: 'Ширина ламината',
            laminate_length: 'Длина ламината',
            laminate_pack: 'Штук в упаковке',
            underlay: 'Подложка',
            plaster_thickness: 'Толщина слоя',
            plaster_consumption: 'Расход штукатурки',
            foundation_type: 'Тип фундамента',
            concrete_grade: 'Марка бетона',
            concrete_per_cubic: 'Бетон на куб.м',
            reinforcement: 'Арматура',
            formwork: 'Опалубка',
            brick_type: 'Тип кирпича',
            brick_quantity: 'Количество кирпичей',
            mortar_consumption: 'Расход раствора',
            roof_type: 'Тип кровли',
            roof_slope: 'Уклон крыши',
            roofing_material: 'Кровельный материал',
            insulation_type: 'Тип утеплителя',
            insulation_thickness: 'Толщина утеплителя',
            unit: 'Единица измерения',
            name: 'Название',
            description: 'Описание',
            price: 'Цена',
            total: 'Итого',
            coefficient: 'Коэффициент',
            efficiency: 'Эффективность'
        };
        return translations[key] || key;
    };

    // Результаты
    let resultContent = 'Нет данных';
    if (resultData.details) {
        resultContent = resultData.details;
    } else if (resultData.total) {
        resultContent = `Итого: ${resultData.total}`;
    }

    // Формируем CSV контент
    const csvContent = [
        ['Тип расчета', getCalculationName(calculation)],
        ['Дата создания', formatDate(calculation.created_at)],
        [],
        ['Введенные параметры', 'Значение'],
        ...Object.entries(calculation.input_data || {})
            .map(([key, value]) => [
                translateParam(key), 
                value !== null && value !== undefined ? value : 'не указано'
            ]),
        [],
        ['Результаты и объем работ', resultContent],
        [],
        ['Материалы', 'Количество', 'Единица измерения'],
        ...(resultData.materials?.map(mat => [mat.name, mat.quantity, mat.unit]) || [['Нет материалов', '', '']])
    ]
    .map(row => row.join(';'))
    .join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Расчет_${getCalculationName(calculation)}_${calculation.created_at}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportToTxt = (calculation) => {

    const resultData = calculation.result || calculation.result_data || {};
    const translateParam = (key) => {
        // Используем тот же словарь переводов, что и в exportToWord
        const translations = {
            length: 'Длина',
            width: 'Ширина',
            // ... остальные переводы из exportToWord
        };
        return translations[key] || key;
    };

    // Формируем параметры
    const inputParams = Object.entries(calculation.input_data || {})
        .map(([key, value]) => {
            const translatedKey = translateParam(key);
            const formattedValue = value !== null && value !== undefined ? value : 'не указано';
            return `${translatedKey}: ${formattedValue}`;
        })
        .join('\n');

    // Формируем материалы
    let materialsContent = 'Не требуется';
    if (resultData.materials?.length > 0) {
        materialsContent = resultData.materials
            .map(mat => `- ${mat.name}: ${mat.quantity} ${mat.unit}`)
            .join('\n');
    }

    // Формируем результаты
    let resultContent = 'Нет данных';
    if (resultData.details) {
        resultContent = resultData.details;
    } else if (resultData.total) {
        resultContent = `Итого: ${resultData.total}`;
    }

    const content = `
        ===== РАСЧЕТ =====
        Тип: ${getCalculationName(calculation)}
        Дата создания: ${formatDate(calculation.created_at)}
        
        === ВВЕДЕННЫЕ ПАРАМЕТРЫ ===
        ${inputParams}
        
        === РЕЗУЛЬТАТЫ И ОБЪЕМ РАБОТ ===
        ${resultContent}
        
        === НЕОБХОДИМЫЕ МАТЕРИАЛЫ ===
        ${materialsContent}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Расчет_${getCalculationName(calculation)}_${calculation.created_at}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  return (
    <div className="account-page">
      <motion.nav
        className="sidebar"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="user-card">
          <div className="avatar">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h3>{user?.email || 'Вы'}</h3>
          <button onClick={logout} className="logout-btn">
            Выйти
          </button>
        </div>

        <ul className="nav-menu">
          <li
            className={activeTab === 'calculations' ? 'active' : ''}
            onClick={() => setActiveTab('calculations')}
          >
            <FiList /> История расчетов
          </li>
          <li
            className={activeTab === 'materials' ? 'active' : ''}
            onClick={() => setActiveTab('materials')}
          >
            <FiBox /> Мои материалы
          </li>
          <li
            className={activeTab === 'budgets' ? 'active' : ''}
            onClick={() => setActiveTab('budgets')}
          >
            <FiDollarSign /> Сметы и бюджет
          </li>
        </ul>
      </motion.nav>

      <div className="main-content">
        <motion.div
          className="greeting"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>{getGreeting()}</h1>
          <p>Рады видеть вас в вашем личном кабинете</p>
        </motion.div>

        {showCalculator ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="calculator-container"
          >
            <CalculatorForm
              onCalculate={handleCalculate}
              onClose={() => setShowCalculator(false)}
            />
          </motion.div>
        ) : (
          <>
            <button
              className="new-calculation-btn"
              onClick={() => setShowCalculator(true)}
            >
              <FiPlus className="calculator-icon" />
              Новый расчет
            </button>

            {loading ? (
              <div className="loader-container">
                <div className="loader"></div>
              </div>
            ) : (
              <>
                {activeTab === 'calculations' && (
                  <motion.div
                    className="history-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h2>История расчетов</h2>
                    {calculations.length === 0 ? (
                      <p className="empty-message">У вас пока нет сохраненных расчетов</p>
                    ) : (
                      <div className="calculations-grid">
                        {calculations.map(calc => (
                          <motion.div
                            key={calc.id}
                            className="calculation-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                          >
                            <h3>{getCalculationName(calc)}</h3>
                            <p className="date">{formatDate(calc.created_at)}</p>
                            {renderCalculationDetails(calc)}
                            <button
                              className="details-btn"
                              onClick={() => setSelectedCalculation(calc)}
                            >
                              Подробнее
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'materials' && (
                  <motion.div
                    className="materials-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="section-header">
                      <h2>Мои материалы</h2>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setNewMaterial({
                            name: '',
                            quantity: '',
                            unit: 'м²'
                          });
                        }}
                      >
                        <FiPlus /> Добавить материал
                      </button>
                    </div>

                    {newMaterial && (
                      <div className="add-material-form">
                        <input
                          type="text"
                          placeholder="Название материала"
                          value={newMaterial.name}
                          onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="Количество"
                          value={newMaterial.quantity}
                          onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                        />
                        <select
                          value={newMaterial.unit}
                          onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                        >
                          <option value="м²">м²</option>
                          <option value="м">м</option>
                          <option value="шт">шт</option>
                          <option value="кг">кг</option>
                          <option value="л">л</option>
                        </select>
                        <button
                          className="btn-primary"
                          onClick={handleAddMaterial}
                          disabled={!newMaterial.name || !newMaterial.quantity}
                        >
                          Сохранить
                        </button>
                        <button
                          className="btn-text"
                          onClick={() => setNewMaterial(null)}
                        >
                          Отмена
                        </button>
                      </div>
                    )}

                    {materials.length === 0 ? (
                      <p className="empty-message">У вас пока нет сохраненных материалов</p>
                    ) : (
                      <table className="materials-table">
                        <thead>
                          <tr>
                            <th>Материал</th>
                            <th>Количество</th>
                            <th>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materials.map(mat => (
                            <motion.tr
                              key={mat.id}
                              whileHover={{ backgroundColor: 'rgba(42,95,127,0.05)' }}
                            >
                              <td>{mat.name}</td>
                              <td>{mat.quantity} {mat.unit}</td>
                              <td>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteMaterial(mat.id)}
                                >
                                  Удалить
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </motion.div>
                )}

                {activeTab === 'budgets' && (
                  <motion.div
                    className="budgets-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="section-header">
                      <h2>Мои сметы</h2>
                      <div className="actions">
                        <button
                          className="btn-primary"
                          onClick={() => setShowBudgetForm(true)}
                        >
                          <FiPlus /> Новая смета
                        </button>
                      </div>
                    </div>

                    {showBudgetForm && (
                      <motion.div
                        className="budget-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h3>Новая смета</h3>
                        <div className="form-group">
                          <label>Название сметы</label>
                          <input
                            type="text"
                            value={newBudget.title}
                            onChange={(e) => setNewBudget({ ...newBudget, title: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Описание</label>
                          <textarea
                            value={newBudget.description}
                            onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
                          />
                        </div>
                        <div className="form-actions">
                          <button
                            className="btn-primary"
                            onClick={createBudget}
                            disabled={!newBudget.title}
                          >
                            Создать смету
                          </button>
                          <button
                            className="btn-text"
                            onClick={() => setShowBudgetForm(false)}
                          >
                            Отмена
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {budgets.length === 0 ? (
                      <div className="empty-budgets">
                        <FiDollarSign className="empty-icon" />
                        <p>У вас пока нет созданных смет</p>
                      </div>
                    ) : (
                      <div className="budgets-grid">
                        {budgets.map(budget => (
                          <motion.div
                            key={budget.id}
                            className="budget-card"
                            whileHover={{ y: -5 }}
                            onClick={() => {
                              setSelectedBudget(budget);
                              setShowBudgetModal(true);
                            }}
                          >
                            <div className="budget-header">
                              <FiDollarSign className="budget-icon" />
                              <div className="budget-title">
                                <h3>{budget.title}</h3>
                                <p className="budget-description">{budget.description}</p>
                              </div>
                            </div>

                            <div className="budget-stats">
                              <div className="stat-item">
                                <FiPieChart className="stat-icon" />
                                <div>
                                  <div className="stat-value">{budget.items?.length || 0}</div>
                                  <div className="stat-label">Расчетов</div>
                                </div>
                              </div>
                              <div className="stat-item">
                                <FiBarChart2 className="stat-icon" />
                                <div>
                                  <div className="stat-value">{budget.total_planned.toLocaleString('ru-RU')} ₽</div>
                                  <div className="stat-label">Плановый бюджет</div>
                                </div>
                              </div>
                              <div className="stat-item">
                                <FiPercent className="stat-icon" />
                                <div>
                                  <div className="stat-value">
                                    {budget.total_planned > 0
                                      ? Math.round((budget.total_actual / budget.total_planned) * 100)
                                      : 0}%
                                  </div>
                                  <div className="stat-label">Исполнено</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </>
        )}

        {/* Модальное окно расчета */}
        <AnimatePresence>
          {selectedCalculation && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCalculation(null)}
            >
              <motion.div
                className="calculation-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="close-modal"
                  onClick={() => setSelectedCalculation(null)}
                >
                  <FiX />
                </button>

                <div className="modal-header">
                  <h2>{getCalculationName(selectedCalculation)}</h2>
                </div>

                <div className="modal-body">
                  <p className="modal-date">{formatDate(selectedCalculation.created_at)}</p>

                  <div className="export-buttons">
                    <button
                      className="export-btn word"
                      onClick={() => exportToWord(selectedCalculation)}
                      title="Скачать в Word"
                    >
                      <FiFile /> Word
                    </button>
                    <button
                      className="export-btn excel"
                      onClick={() => exportToExcel(selectedCalculation)}
                      title="Скачать в Excel"
                    >
                      <FiFileText /> Excel
                    </button>
                    <button
                      className="export-btn txt"
                      onClick={() => exportToTxt(selectedCalculation)}
                      title="Скачать в TXT"
                    >
                      <FiFileMinus /> TXT
                    </button>
                  </div>

                  <div className="modal-section">
                    <h3 className="section-title">Введенные параметры:</h3>
                    <div className="input-params">
                      <ul>
                        {selectedCalculation.input_data && Object.entries(selectedCalculation.input_data).map(([key, value]) => {
                          // Словарь переводов параметров
                          const paramTranslations = {
                            // Основные геометрические параметры
                            length: 'Длина',
                            width: 'Ширина',
                            height: 'Высота',
                            depth: 'Глубина',
                            area: 'Площадь',
                            perimeter: 'Периметр',
                            volume: 'Объем',

                            // Материалы и характеристики
                            thickness: 'Толщина',
                            quantity: 'Количество',
                            weight: 'Вес',
                            density: 'Плотность',

                            // Параметры для конкретных типов расчетов
                            // Для покраски
                            paint_coverage: 'Расход краски',
                            paint_layers: 'Количество слоев',
                            wall_area: 'Площадь стен',
                            color: 'Цвет',

                            // Для плитки
                            tile_width: 'Ширина плитки',
                            tile_length: 'Длина плитки',
                            tile_area: 'Площадь плитки',
                            gap_width: 'Ширина шва',
                            tile_quantity: 'Количество плиток',
                            pattern: 'Узор',

                            // Для обоев
                            wallpaper_length: 'Длина рулона',
                            wallpaper_width: 'Ширина рулона',
                            rapport: 'Раппорт',
                            wall_height: 'Высота стен',

                            // Для ламината
                            laminate_width: 'Ширина ламината',
                            laminate_length: 'Длина ламината',
                            laminate_pack: 'Штук в упаковке',
                            underlay: 'Подложка',

                            // Для штукатурки
                            plaster_thickness: 'Толщина слоя',
                            plaster_consumption: 'Расход штукатурки',

                            // Для фундамента
                            foundation_type: 'Тип фундамента',
                            concrete_grade: 'Марка бетона',
                            concrete_per_cubic: 'Бетон на куб.м',
                            reinforcement: 'Арматура',
                            formwork: 'Опалубка',

                            // Для кирпичной кладки
                            brick_type: 'Тип кирпича',
                            brick_quantity: 'Количество кирпичей',
                            mortar_consumption: 'Расход раствора',

                            // Для кровли
                            roof_type: 'Тип кровли',
                            roof_slope: 'Уклон крыши',
                            roofing_material: 'Кровельный материал',

                            // Для утеплителя
                            insulation_type: 'Тип утеплителя',
                            insulation_thickness: 'Толщина утеплителя',

                            // Единицы измерения
                            unit: 'Единица измерения',
                            meters: 'метры',
                            square_meters: 'кв. метры',
                            cubic_meters: 'куб. метры',
                            pieces: 'штуки',
                            kilograms: 'килограммы',
                            liters: 'литры',

                            // Дополнительные параметры
                            name: 'Название',
                            description: 'Описание',
                            price: 'Цена',
                            total: 'Итого',
                            coefficient: 'Коэффициент',
                            efficiency: 'Эффективность'
                          };

                          // Форматирование значения
                          const formatValue = (val) => {
                            if (val === null || val === undefined) return '—';
                            if (typeof val === 'boolean') return val ? 'Да' : 'Нет';
                            if (typeof val === 'object') return JSON.stringify(val);
                            return val;
                          };

                          return (
                            <li key={key} className="param-item">
                              <span className="param-name">
                                {paramTranslations[key] || key}:
                              </span>
                              <span className="param-value">
                                {formatValue(value)}
                                {key === 'unit' && paramTranslations[value] ? (
                                  <span className="unit-hint"> ({paramTranslations[value]})</span>
                                ) : null}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {selectedCalculation.result_data?.materials && (
                    <div className="modal-section">
                      <h3 className="section-title">Необходимые материалы:</h3>
                      <div className="full-materials">
                        <table>
                          <thead>
                            <tr>
                              <th>Материал</th>
                              <th>Количество</th>
                              <th>Ед. изм.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCalculation.result_data.materials.map((mat, i) => (
                              <tr key={i}>
                                <td>{mat.name}</td>
                                <td>{mat.quantity}</td>
                                <td>{mat.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedCalculation.result_data?.details && (
                    <div className="modal-section">
                      <h3 className="section-title">Итог:</h3>
                      <div className="calculation-summary">
                        <p>{selectedCalculation.result_data.details}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно сметы */}
        <AnimatePresence>
          {showBudgetModal && selectedBudget && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBudgetModal(false)}
            >
              <motion.div
                className="budget-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>
                    <FiDollarSign />
                    {selectedBudget.title}
                  </h2>
                  <button
                    className="close-modal"
                    onClick={() => setShowBudgetModal(false)}
                  >
                    <FiX />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="budget-summary">
                    <div className="summary-item">
                      <span>Плановый бюджет:</span>
                      <span className="amount planned">{selectedBudget.total_planned.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="summary-item">
                      <span>Фактические затраты:</span>
                      <span className="amount actual">{selectedBudget.total_actual.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="summary-item">
                      <span>Отклонение:</span>
                      <span className={`amount ${selectedBudget.total_actual > selectedBudget.total_planned ? 'over' : 'under'}`}>
                        {Math.abs(selectedBudget.total_actual - selectedBudget.total_planned).toLocaleString('ru-RU')} ₽
                        ({selectedBudget.total_planned > 0
                          ? Math.round(Math.abs(selectedBudget.total_actual - selectedBudget.total_planned) / selectedBudget.total_planned * 100)
                          : 0}%)
                      </span>
                    </div>
                  </div>

                  <div className="charts-container">
                    <div className="chart-wrapper">
                      <h3>Распределение по категориям</h3>
                      <div className="chart">
                        {getBudgetChartData(selectedBudget) && (
                          <Bar
                            data={getBudgetChartData(selectedBudget)}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                                title: {
                                  display: false
                                }
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="chart-wrapper">
                      <h3>Структура затрат</h3>
                      <div className="chart">
                        {getBudgetPieData(selectedBudget) && (
                          <Pie
                            data={getBudgetPieData(selectedBudget)}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: {
                                  position: 'right',
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="budget-calculations">
                    <div className="section-header">
                      <h3>Расчеты в смете</h3>
                      <button
                        className="btn-outline"
                        onClick={() => setShowAddCalculationModal(true)}
                      >
                        <FiPlus /> Добавить расчет
                      </button>
                    </div>

                    {selectedBudget.items?.length > 0 ? (
                      <div className="calculations-list">
                        {selectedBudget.items.map(item => (
                          <div key={item.id} className="calculation-item">
                            <div className="calculation-info">
                              <h4>{getCalculationName(item.calculation_details)}</h4>
                              <div className="calculation-costs">
                                <div className="cost planned">
                                  <span>План:</span>
                                  <span>{item.planned_cost?.toLocaleString('ru-RU') || '—'} ₽</span>
                                </div>
                                <div className="cost actual">
                                  <span>Факт:</span>
                                  <span>{item.actual_cost?.toLocaleString('ru-RU') || '—'} ₽</span>
                                </div>
                              </div>
                            </div>
                            <button
                              className="btn-icon danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCalculationFromBudget(item.id);
                              }}
                              title="Удалить расчет из сметы"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-calculations">
                        <p>В смете пока нет расчетов</p>
                        <button
                          className="btn-primary"
                          onClick={() => setShowAddCalculationModal(true)}
                        >
                          <FiPlus /> Добавить первый расчет
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn-danger"
                    onClick={() => {
                      if (window.confirm('Удалить эту смету?')) {
                        deleteBudget(selectedBudget.id);
                      }
                    }}
                  >
                    <FiTrash2 /> Удалить смету
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно добавления расчета */}
        <AnimatePresence>
          {showAddCalculationModal && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCalculationModal(false)}
            >
              <motion.div
                className="add-calculation-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Добавить расчет в смету</h3>
                  <button
                    className="close-modal"
                    onClick={() => setShowAddCalculationModal(false)}
                  >
                    <FiX />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="cost-inputs">
                    <div className="form-group">
                      <label>Плановая стоимость (₽)</label>
                      <input
                        type="number"
                        value={costData.planned}
                        onChange={(e) => setCostData({ ...costData, planned: e.target.value })}
                        placeholder="Введите сумму"
                      />
                    </div>
                    <div className="form-group">
                      <label>Фактическая стоимость (₽)</label>
                      <input
                        type="number"
                        value={costData.actual}
                        onChange={(e) => setCostData({ ...costData, actual: e.target.value })}
                        placeholder="Введите сумму"
                      />
                    </div>
                  </div>

                  {calculations.length === 0 ? (
                    <p>У вас пока нет сохраненных расчетов</p>
                  ) : (
                    <div className="calculations-to-add">
                      {calculations.map(calc => (
                        <div key={calc.id} className="calculation-to-add">
                          <div>
                            <h4>{getCalculationName(calc)}</h4>
                            <p className="date">{formatDate(calc.created_at)}</p>
                          </div>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              addCalculationToBudget(calc.id);
                            }}
                          >
                            Добавить
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AccountPage;