// Unit conversion utilities
export const convertHeight = {
  cmToIn: (cm: number) => (cm / 2.54).toFixed(1),
  inToCm: (inches: number) => (inches * 2.54).toFixed(1),
};

export const convertWeight = {
  kgToLb: (kg: number) => (kg * 2.20462).toFixed(1),
  lbToKg: (lb: number) => (lb / 2.20462).toFixed(1),
};

export const formatHeight = (cm: string, useImperial: boolean) => {
  const numCm = parseFloat(cm);
  if (isNaN(numCm)) return '';
  return useImperial ? `${convertHeight.cmToIn(numCm)}in` : `${numCm}cm`;
};

export const formatWeight = (kg: string, useImperial: boolean) => {
  const numKg = parseFloat(kg);
  if (isNaN(numKg)) return '';
  return useImperial ? `${convertWeight.kgToLb(numKg)}lb` : `${numKg}kg`;
};

export const calculateBMI = (weight: string, height: string) => {
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  if (isNaN(weightNum) || isNaN(heightNum) || heightNum === 0) return 0;
  return (weightNum / ((heightNum / 100) ** 2)).toFixed(1);
};