export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number | string): number {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees.replace(/[^\d.-]/g, '')) : rupees;
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatIndianCurrency(paise: number): string {
  const isNegative = paise < 0;
  const absolutePaise = Math.abs(paise);
  const rupees = absolutePaise / 100;

  const rupeesFloor = Math.floor(rupees);
  const rupeesStr = rupeesFloor.toString();
  const paiseVal = Math.round((rupees - rupeesFloor) * 100);

  let formattedRupees = '';
  if (rupeesStr.length <= 3) {
    formattedRupees = rupeesStr;
  } else {
    const lastThree = rupeesStr.substring(rupeesStr.length - 3);
    const otherNumbers = rupeesStr.substring(0, rupeesStr.length - 3);
    // Group other numbers by 2 (Indian numbering system: Lakhs, Crores, etc.)
    const otherNumbersGrouped = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedRupees = `${otherNumbersGrouped},${lastThree}`;
  }

  const formattedAmount = paiseVal > 0 
    ? `${formattedRupees}.${paiseVal.toString().padStart(2, '0')}` 
    : formattedRupees;

  return `${isNegative ? '-' : ''}₹${formattedAmount}`;
}
