import { Customer } from './customer';
import { normalizePhone } from './phoneNormalizer';
import { rupeesToPaise } from './amountFormatter';

export interface TSVRowValidation {
  rowNumber: number;
  name: string;
  phone: string;
  amount: string;
  dueDate: string;
  note: string;
  isValid: boolean;
  errors: string[];
}

export function parseTSV(tsvText: string): TSVRowValidation[] {
  const rows = tsvText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (rows.length === 0) return [];

  // Parse lines into grid of cells
  const grid = rows.map(row => row.split('\t').map(cell => cell.trim()));
  
  // Auto-detect columns
  let nameIdx = -1;
  let phoneIdx = -1;
  let amountIdx = -1;
  let dateIdx = -1;
  let noteIdx = -1;

  // 1. Try mapping using headers on row 0
  const firstRow = grid[0];
  const hasHeaders = firstRow.some(cell => {
    const clean = cell.toLowerCase();
    return clean.includes('name') || clean.includes('phone') || clean.includes('mobile') || clean.includes('amount') || clean.includes('credit') || clean.includes('due') || clean.includes('note');
  });

  let startRow = 0;
  if (hasHeaders) {
    startRow = 1;
    firstRow.forEach((cell, idx) => {
      const clean = cell.toLowerCase();
      if (clean.includes('name')) nameIdx = idx;
      else if (clean.includes('phone') || clean.includes('mobile') || clean.includes('contact')) phoneIdx = idx;
      else if (clean.includes('amount') || clean.includes('rupee') || clean.includes('rs') || clean.includes('credit') || clean.includes('dues') || clean === 'due') amountIdx = idx;
      else if (clean.includes('date') || clean.includes('due date')) dateIdx = idx;
      else if (clean.includes('note') || clean.includes('notes') || clean.includes('remark') || clean.includes('memo')) noteIdx = idx;
    });
  }

  // 2. Multi-row sampling heuristic if indices are not fully matched
  if (nameIdx === -1) {
    nameIdx = 0; // Default guess
  }

  const sampleLimit = Math.min(grid.length, 10);
  const sampleRow = grid[startRow] || [];

  // Find date and phone columns by scanning up to 10 rows
  for (let idx = 0; idx < sampleRow.length; idx++) {
    if (idx === nameIdx) continue;

    for (let r = startRow; r < sampleLimit; r++) {
      const cells = grid[r];
      if (!cells || cells.length <= idx) continue;
      const cell = cells[idx] || '';

      // Strict regex date check (prevents negative values like -500 from matching date parser)
      const isDatePattern = /^\d{4}-\d{2}-\d{2}$/.test(cell) || /^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}$/.test(cell);
      if (isDatePattern && dateIdx === -1) {
        dateIdx = idx;
        break;
      }

      // Phone check (10 digits, starts with 6-9)
      const cleanDigits = cell.replace(/\D/g, '');
      const isPhonePattern = (cleanDigits.length === 10 || (cleanDigits.length === 12 && cleanDigits.startsWith('91'))) && /^[6-9]/.test(cleanDigits.slice(-10));
      if (isPhonePattern && phoneIdx === -1) {
        phoneIdx = idx;
        break;
      }
    }
  }

  // Find amount column (should be numeric and not name, phone, or date)
  for (let idx = 0; idx < sampleRow.length; idx++) {
    if (idx === nameIdx || idx === phoneIdx || idx === dateIdx) continue;

    for (let r = startRow; r < sampleLimit; r++) {
      const cells = grid[r];
      if (!cells || cells.length <= idx) continue;
      const cell = cells[idx] || '';

      const isAmountPattern = !isNaN(parseFloat(cell.replace(/[^\d.-]/g, ''))) && parseFloat(cell.replace(/[^\d.-]/g, '')) > 0;
      if (isAmountPattern && amountIdx === -1) {
        amountIdx = idx;
        break;
      }
    }
  }

  // Strict positional fallback for any remaining unmatched columns
  if (phoneIdx === -1) phoneIdx = sampleRow.length > 1 ? 1 : -1;
  if (amountIdx === -1) amountIdx = sampleRow.length > 2 ? 2 : -1;
  if (dateIdx === -1) dateIdx = sampleRow.length > 3 ? 3 : -1;
  if (noteIdx === -1) noteIdx = sampleRow.length > 4 ? 4 : -1;

  // Process rows
  const validations: TSVRowValidation[] = [];
  
  for (let i = startRow; i < grid.length; i++) {
    const cells = grid[i];
    if (cells.length === 0 || (cells.length === 1 && cells[0] === '')) continue;

    const rowNum = i + 1;
    const errors: string[] = [];

    const name = nameIdx !== -1 ? (cells[nameIdx] || '') : '';
    const phone = phoneIdx !== -1 ? (cells[phoneIdx] || '') : '';
    const amount = amountIdx !== -1 ? (cells[amountIdx] || '') : '';
    const dueDate = dateIdx !== -1 ? (cells[dateIdx] || '') : '';
    const note = noteIdx !== -1 ? (cells[noteIdx] || '') : '';

    // Validations
    if (!name.trim()) {
      errors.push('Name is required');
    }

    const phoneResult = normalizePhone(phone);
    if (!phoneResult.isValid) {
      errors.push(phoneResult.error || 'Invalid phone format');
    }

    const amountVal = parseFloat(amount.replace(/[^\d.-]/g, ''));
    if (isNaN(amountVal) || amountVal <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (dueDate.trim()) {
      const parsedDate = new Date(dueDate.trim());
      if (isNaN(parsedDate.getTime())) {
        errors.push('Invalid due date format (use YYYY-MM-DD)');
      }
    }

    validations.push({
      rowNumber: rowNum,
      name,
      phone,
      amount,
      dueDate,
      note,
      isValid: errors.length === 0,
      errors
    });
  }

  return validations;
}
