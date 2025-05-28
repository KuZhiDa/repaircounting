// src/components/Materials.jsx
import React from 'react';
import './Materials.scss';
import boardImage from '../assets/images/materials/board.jpg';
import brickImage from '../assets/images/materials/brick.jpg';
import cementImage from '../assets/images/materials/cement.jpg';


const materialsData = [
  {
    id: 1,
    name: 'Кирпич строительный',
    image: brickImage,
    params: [
      { label: 'Вид', value: 'Керамический' },
      { label: 'Размер', value: '250×120×65 мм' },
      { label: 'Цена', value: '15 руб/шт' }
    ]
  },
  {
    id: 2,
    name: 'Цемент М500',
    image: cementImage,
    params: [
      { label: 'Вес', value: '50 кг' },
      { label: 'Прочность', value: 'М500' },
      { label: 'Цена', value: '450 руб/мешок' }
    ]
  },
  {
    id: 3,
    name: 'Доска обрезная',
    image: boardImage,
    params: [
      { label: 'Порода', value: 'Сосна' },
      { label: 'Размер', value: '6000×150×50 мм' },
      { label: 'Цена', value: '15 000 руб/м³' }
    ]
  }
];

export default function Materials() {
  return (
    <div className="materials-grid">
      {materialsData.map(material => (
        <div key={material.id} className="material-card">
          <div className="material-image">
            <img src={material.image} alt={material.name} />
          </div>
          <h3 className="material-title">{material.name}</h3>
          <div className="material-params">
            {material.params.map((param, index) => (
              <div key={index} className="param-row">
                <span className="param-label">{param.label}:</span>
                <span className="param-value">{param.value}</span>
              </div>
            ))}
          </div>
          <button className="btn btn--block">Добавить в расчет</button>
        </div>
      ))}
    </div>
  );
}