/**
 * Format amounts into Rwandan Francs (RWF) with commas between 3 digits.
 * Example: 15000 -> "15,000 RWF"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 RWF';
  }
  const rounded = Math.round(Number(amount));
  return `${rounded.toLocaleString('en-US')} RWF`;
}

/**
 * Format numbers with 3-digit comma separators.
 * Example: 1250 -> "1,250"
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return Number(num).toLocaleString('en-US');
}

