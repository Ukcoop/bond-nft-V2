export function formatTokenAmount(amount, decimals) {
  if(amount == 0) return 0; 
  let tokenAmount = (amount / Math.pow(10, decimals));
  let maxDecimals = 8 - Math.floor(Math.log10(tokenAmount));
  maxDecimals = Math.max(0, maxDecimals);
  let formattedAmount = tokenAmount.toFixed(maxDecimals);
  formattedAmount = formattedAmount.replace(/\.?0+$/, '');
  if (formattedAmount.length > 10) {
    formattedAmount = tokenAmount.toExponential(3).replace(/\.?0+e/, 'e');
  }

  return formattedAmount;
}

export function parseDays(days: number) {
  const units = [
    { label: 'year', days: 365 },
    { label: 'month', days: 30 },
    { label: 'week', days: 7 }
  ];

  let result = [];

  for (let { label, days: unitDays } of units) {
    if (days >= unitDays) {
      let value = Math.floor(days / unitDays);
      days %= unitDays;
      result.push(`${value} ${label}${value > 1 ? 's' : ''}`);
    }
  }

  if (days > 0) {
    result.push(`${Math.floor(days)} day${days > 1 ? 's' : ''}`);
  }

  return result.join(', ');
}
