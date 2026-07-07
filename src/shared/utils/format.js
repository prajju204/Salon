/**
 * Formats a numeric amount to Indian Rupee (INR) format.
 * Example: 125000 -> ₹1,25,000.00 or ₹1,25,000
 * @param {number|string} amount - The numerical value to format.
 * @param {boolean} [includeDecimals=false] - Whether to force two decimal places.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (amount, includeDecimals = false) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2
  }).format(numericAmount);
};
