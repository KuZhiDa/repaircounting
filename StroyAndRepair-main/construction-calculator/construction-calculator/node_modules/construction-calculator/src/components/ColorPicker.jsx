import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import './ColorPicker.css'; // Стили (опционально)

const ColorPicker = ({ color, onChange }) => {
  const [currentColor, setCurrentColor] = useState(color || '#4287f5');

  const handleChange = (newColor) => {
    setCurrentColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="color-picker-container">
      <HexColorPicker color={currentColor} onChange={handleChange} />
      <div className="color-picker-value" style={{ backgroundColor: currentColor }}>
        {currentColor}
      </div>
    </div>
  );
};

export default ColorPicker;