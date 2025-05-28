import React from 'react';
import './Loader.scss';

const Loader = ({ message = 'Загрузка...' }) => {
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <div className="loader-text">{message}</div>
    </div>
  );
};

export default Loader;