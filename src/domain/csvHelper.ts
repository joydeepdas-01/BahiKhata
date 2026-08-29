import { Customer } from './customer';
import { normalizePhone } from './phoneNormalizer';
import { rupeesToPaise } from './amountFormatter';

export interface CSVParseResult {
  customers: Omit<Customer, 'id' | 'status'>[];
  errors: { row: number; column: string; message: string; value: string }[];
}

export function exportToCSV(customers: Customer[]): string {
  const headers = ['Name', 'Phone', 'Amount (Rs)', 'Due Date', 'Notes', 'Last Reminder Sent'];
  
  const rows = customers.map(c => {
    const amountRs = (c.amount / 100).toFixed(2);
    const dueDate = c.dueDate || '';
    const notes = (c.note || '').replace(/"/g, '""'); // Escape quotes
    const lastReminder = c.lastReminderSentAt || '';
    
    return [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      amountRs,
      `"${dueDate}"`,
      `"${notes}"`,
      `"${lastReminder}"`
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

export function parseCSV(csvText: string): CSVParseResult {
  const result: CSVParseResult = {
    customers: [],
    errors: []
  };
  
  const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    return result;
  }
  
  // Parse header
  const headerCells = parseCSVLine(lines[0]);
  
  // Map headers to columns
  let nameIdx = -1;
  let phoneIdx = -1;
  let amountIdx = -1;
  let dateIdx = -1;
  let noteIdx = -1;
  
  headerCells.forEach((cell, idx) => {
    const clean = cell.toLowerCase().trim();
    if (clean.includes('name')) nameIdx = idx;
    else if (clean.includes('phone') || clean.includes('mobile') || clean.includes('contact')) phoneIdx = idx;
    else if (clean.includes('amount') || clean.includes('rupee') || clean.includes('rs') || clean.includes('credit')) amountIdx = idx;
    else if (clean.includes('date') || clean.includes('due')) dateIdx = idx;
    else if (clean.includes('note') || clean.includes('memo') || clean.includes('remark')) noteIdx = idx;
  });
  
  // Fallbacks if no exact match (order-based fallback)
  if (nameIdx === -1 && headerCells.length > 0) nameIdx = 0;
  if (phoneIdx === -1 && headerCells.length > 1) phoneIdx = 1;
  if (amountIdx === -1 && headerCells.length > 2) amountIdx = 2;
  if (dateIdx === -1 && headerCells.length > 3) dateIdx = 3;
  if (noteIdx === -1 && headerCells.length > 4) noteIdx = 4;
  
  // Parse rows
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length === 0 || (cells.length === 1 && cells[0] === '')) {
      continue; // Skip blank lines
    }
    
    const rowNum = i + 1;
    
    const rawName = cells[nameIdx] || '';
    const rawPhone = cells[phoneIdx] || '';
    const rawAmount = cells[amountIdx] || '';
    const rawDate = cells[dateIdx] || '';
    const rawNote = cells[noteIdx] || '';
    
    // Validations
    if (!rawName.trim()) {
      result.errors.push({
        row: rowNum,
        column: 'Name',
        message: 'Name cannot be empty',
        value: rawName
      });
      continue;
    }
    
    const phoneResult = normalizePhone(rawPhone);
    if (!phoneResult.isValid) {
      result.errors.push({
        row: rowNum,
        column: 'Phone',
        message: phoneResult.error || 'Invalid phone format',
        value: rawPhone
      });
      continue;
    }
    
    const amountVal = parseFloat(rawAmount.replace(/[^\d.-]/g, ''));
    if (isNaN(amountVal) || amountVal < 0) {
      result.errors.push({
        row: rowNum,
        column: 'Amount',
        message: 'Amount must be a positive number',
        value: rawAmount
      });
      continue;
    }
    
    let formattedDate: string | null = null;
    if (rawDate.trim()) {
      const parsedDate = new Date(rawDate.trim());
      if (isNaN(parsedDate.getTime())) {
        result.errors.push({
          row: rowNum,
          column: 'Due Date',
          message: 'Invalid date format (use YYYY-MM-DD)',
          value: rawDate
        });
        continue;
      }
      formattedDate = parsedDate.toISOString().split('T')[0];
    }
    
    result.customers.push({
      name: rawName.trim(),
      phone: phoneResult.normalized!,
      amount: rupeesToPaise(amountVal),
      dueDate: formattedDate,
      note: rawNote.trim()
    });
  }
  
  return result;
}

// Handles quoted strings with commas inside them correctly
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentCell.trim());
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  
  result.push(currentCell.trim());
  return result;
}
