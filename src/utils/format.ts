export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatCompactNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num);
};
