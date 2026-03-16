// файл: src/components/ElectricBorder.jsx
import React from 'react';
import './ElectricBorder.css';

export default function ElectricBorder({ children }) {
  return (
    <div className="electric-border-wrapper">
      <div className="electric-border-content">
        {children}
      </div>
    </div>
  );
}
