import { useState } from 'react';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

export function useWeightUnit() {
  const [unit, setUnit] = useState(() => localStorage.getItem('weightUnit') || 'kg');

  const toggle = () => {
    const next = unit === 'kg' ? 'lbs' : 'kg';
    localStorage.setItem('weightUnit', next);
    setUnit(next);
  };

  // Convert a stored kg value → display value in current unit
  const toDisplay = (kg) => {
    if (!kg && kg !== 0) return '';
    const val = unit === 'lbs' ? kg * KG_TO_LBS : kg;
    return Math.round(val * 10) / 10;
  };

  // Convert a user-entered value (in current unit) → kg for storage
  const toKg = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return unit === 'lbs' ? Math.round(num * LBS_TO_KG * 100) / 100 : num;
  };

  return { unit, toggle, toDisplay, toKg };
}