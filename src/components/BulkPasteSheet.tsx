import React, { useState } from 'react';
import { CloseIcon, InfoIcon, CheckIcon } from './Icons';
import { Customer } from '../domain/customer';
import { parseTSV, TSVRowValidation } from '../domain/tsvHelper';
import { normalizePhone } from '../domain/phoneNormalizer';
import { rupeesToPaise } from '../domain/amountFormatter';

interface BulkPasteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBulk: (customers: Omit<Customer, 'id' | 'status'>[]) => Promise<void>;
}

export const BulkPasteSheet: React.FC<BulkPasteSheetProps> = ({
  isOpen,
  onClose,
  onImportBulk
}) => {
  const [pasteData, setPasteData] = useState('');
  const [parsedRows, setParsedRows] = useState<TSVRowValidation[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!pasteData.trim()) {
      alert('Please paste spreadsheet data first.');
      return;
    }
    const results = parseTSV(pasteData);
    setParsedRows(results);
    setHasParsed(true);
  };

  const handleClear = () => {
    setPasteData('');
    setParsedRows([]);
    setHasParsed(false);
    setIsImporting(false);
  };

  const totalErrors = parsedRows.filter(r => !r.isValid).length;
  const validRows = parsedRows.filter(r => r.isValid);

  const handleImportClick = async () => {
    if (isImporting) return;
    if (validRows.length === 0) {
      alert('No valid rows available to import.');
      return;
    }

    // Convert valid parsed rows to customers payload
    const payload = validRows.map(row => {
      const phoneResult = normalizePhone(row.phone!);
      return {
        name: row.name!.trim(),
        phone: phoneResult.normalized!,
        amount: rupeesToPaise(row.amount!),
        dueDate: row.dueDate || null,
        note: row.note ? row.note.trim() : ''
      };
    });

    setIsImporting(true);
    try {
      await onImportBulk(payload);
      alert(`Successfully imported ${payload.length} customers!`);
      handleClear();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to import customer records.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-bk-text-primary/30 backdrop-blur-xs animate-fade-in select-none p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Mobile-First Sliding Sheet Panel */}
      <div className="relative w-full max-w-2xl max-h-[90dvh] sm:max-h-[85dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="px-4 py-3 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft shrink-0">
          <h2 className="text-base sm:text-lg font-extrabold text-bk-text-primary">
            Import Ledger from Spreadsheet
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-bk-border transition-colors text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Composer & Preview Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 flex flex-col justify-between select-text">
          {!hasParsed ? (
            /* Input Section */
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">Instructions</span>
                <p className="text-xs text-bk-text-secondary leading-relaxed bg-bk-surface-soft p-3 rounded-bk-md border border-bk-border">
                  1. Open your spreadsheet (Excel, Google Sheets, or Numbers).<br />
                  2. Select and Copy columns: <strong>Name, Phone/WhatsApp, Credit Amount, Due Date (optional), Notes (optional)</strong>.<br />
                  3. Paste the copied cells directly in the input box below. Our smart parsing heuristic will auto-detect columns.
                </p>
              </div>

              <div className="flex-1 flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">Paste Spreadsheet Data Here</label>
                <textarea
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Rahul Sharma	9876543210	1250	2026-09-01	Pending tailor charges&#10;Priya Patel	9823456789	3500	2026-08-30	Alteration advance"
                  className="flex-1 w-full p-3 border border-bk-border rounded-bk-sm bg-white text-xs text-bk-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-bk-brand-primary focus:border-bk-brand-primary resize-none min-h-[180px] sm:min-h-[220px]"
                />
              </div>
            </div>
          ) : (
            /* Validation Table Grid (Airtable style) */
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              {/* Parse status summary banner */}
              <div className="flex items-center justify-between p-2.5 bg-bk-surface-soft border border-bk-border rounded-bk-md">
                <div className="text-xs text-bk-text-secondary space-x-2">
                  <span className="font-semibold text-bk-text-primary">{parsedRows.length} rows processed:</span>
                  <span className="text-bk-status-paid font-bold">{validRows.length} valid</span>
                  {totalErrors > 0 && (
                    <span className="text-bk-status-overdue font-bold">{totalErrors} errors found</span>
                  )}
                </div>
                <button
                  onClick={handleClear}
                  className="text-xs text-bk-brand-primary font-bold hover:underline cursor-pointer"
                >
                  Start Over
                </button>
              </div>

              {/* Error warning notification if needed */}
              {totalErrors > 0 && (
                <div className="p-2 bg-bk-status-overdue/5 border border-bk-status-overdue/25 rounded-bk-sm flex items-start gap-2 text-xs text-bk-status-overdue">
                  <div className="shrink-0 mt-0.5"><InfoIcon size={14} /></div>
                  <p>Some rows failed validation checks (invalid phone formats, negative values, etc.). You can import the valid rows now; invalid rows will be skipped.</p>
                </div>
              )}

              {/* Data Table Grid container */}
              <div className="flex-1 overflow-auto border border-bk-border rounded-bk-md bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-bk-surface-soft z-10">
                    <tr className="border-b border-bk-border">
                      <th className="p-2 border-r border-bk-border text-[9px] font-bold text-bk-text-secondary uppercase tracking-wider">Status</th>
                      <th className="p-2 border-r border-bk-border text-[9px] font-bold text-bk-text-secondary uppercase tracking-wider">Customer Name</th>
                      <th className="p-2 border-r border-bk-border text-[9px] font-bold text-bk-text-secondary uppercase tracking-wider">Phone / WhatsApp</th>
                      <th className="p-2 border-r border-bk-border text-[9px] font-bold text-bk-text-secondary uppercase tracking-wider">Amount (₹)</th>
                      <th className="p-2 border-r border-bk-border text-[9px] font-bold text-bk-text-secondary uppercase tracking-wider">Due Date</th>
                      <th className="p-2 text-[9px] font-bold text-bk-text-secondary uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-bk-border hover:bg-bk-surface-soft transition-colors ${
                          !row.isValid ? 'bg-bk-status-overdue/5' : ''
                        }`}
                      >
                        <td className="p-2 border-r border-bk-border font-bold">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-bk-status-paid border border-bk-status-paid/20 bg-bk-status-paid/5 px-2 py-0.5 rounded-bk-pill">
                              <CheckIcon size={10} /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-bk-status-overdue border border-bk-status-overdue/20 bg-bk-status-overdue/5 px-2 py-0.5 rounded-bk-pill" title={row.errors?.join(', ')}>
                              ⚠ Error
                            </span>
                          )}
                        </td>
                        <td className="p-2 border-r border-bk-border font-medium text-bk-text-primary">{row.name || <span className="text-bk-text-tertiary">Empty</span>}</td>
                        <td className={`p-2 border-r border-bk-border font-tabular-nums ${row.errors?.some(e => e.includes('phone')) ? 'text-bk-status-overdue font-semibold' : 'text-bk-text-secondary'}`}>
                          {row.phone || <span className="text-bk-text-tertiary">Empty</span>}
                        </td>
                        <td className={`p-2 border-r border-bk-border font-bold font-tabular-nums ${row.errors?.some(e => e.includes('amount')) ? 'text-bk-status-overdue' : 'text-bk-text-primary'}`}>
                          {row.amount ? `₹${row.amount}` : <span className="text-bk-text-tertiary">Empty</span>}
                        </td>
                        <td className={`p-2 border-r border-bk-border font-tabular-nums ${row.errors?.some(e => e.includes('date')) ? 'text-bk-status-overdue' : 'text-bk-text-secondary'}`}>
                          {row.dueDate || <span className="text-bk-text-tertiary">No Date</span>}
                        </td>
                        <td className="p-2 text-bk-text-secondary max-w-xs truncate" title={row.note || ''}>
                          {row.note || <span className="text-bk-text-tertiary">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 pb-safe border-t border-bk-border bg-bk-surface-soft flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 h-9 sm:h-10 border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary font-semibold rounded-bk-md transition-colors duration-150 cursor-pointer text-center text-xs sm:text-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          
          {!hasParsed ? (
            <button
              onClick={handleParse}
              className="flex-1 h-9 sm:h-10 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white font-semibold rounded-bk-md transition-all duration-150 cursor-pointer text-center text-xs sm:text-sm shadow-sm active:translate-y-[1px]"
            >
              Parse Data
            </button>
          ) : (
            <button
              onClick={handleImportClick}
              disabled={validRows.length === 0 || isImporting}
              className="flex-1 h-9 sm:h-10 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white font-semibold rounded-bk-md transition-all duration-150 cursor-pointer text-center text-xs sm:text-sm shadow-sm active:translate-y-[1px] disabled:opacity-40 disabled:pointer-events-none"
            >
              {isImporting ? 'Importing...' : `Import ${validRows.length} Ledger Dues`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
