import React, { useState, useEffect } from 'react';
import { CloseIcon, ArrowUpRightIcon, ArrowDownLeftIcon, AlertCircleIcon } from './Icons';
import { Customer } from '../domain/customer';
import { rupeesToPaise } from '../domain/amountFormatter';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { CustomerSelector } from './CustomerSelector';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  initialCustomer?: Customer | null;
  initialType?: 'credit' | 'payment';
  onRecordTransaction: (
    customerId: string,
    type: 'credit' | 'payment',
    amountPaise: number,
    note?: string,
    date?: string
  ) => Promise<any>;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  initialCustomer,
  initialType = 'credit',
  onRecordTransaction
}) => {
  const { triggerHaptic } = useDisplaySettings();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    () => initialCustomer?.id || customers[0]?.id || ''
  );
  const [transType, setTransType] = useState<'credit' | 'payment'>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setSelectedCustomerId(initialCustomer.id);
      } else if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
      }
      setTransType(initialType);
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialCustomer, initialType, customers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('standard');

    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    if (!amount.trim()) {
      setError('Please enter an amount');
      return;
    }

    const paise = rupeesToPaise(amount);
    if (paise <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onRecordTransaction(selectedCustomerId, transType, paise, note, date);
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction');
      triggerHaptic('warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up max-h-[90vh]">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-bk-border rounded-full mx-auto mt-2" />

        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft/60 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-bk-text-primary tracking-tight">
              Record Transaction
            </h3>
            <p className="text-[11px] text-bk-text-tertiary">Quickly add credit or payment</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-bk-border/60 transition-colors text-bk-text-tertiary hover:text-bk-text-primary flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 select-text overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-bk-status-overdue flex items-center gap-1.5">
              <AlertCircleIcon size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Segmented Control */}
          <div className="grid grid-cols-2 p-1 bg-bk-surface-soft border border-bk-border rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTransType('credit');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                transType === 'credit'
                  ? 'bg-bk-status-overdue text-white shadow-2xs'
                  : 'text-bk-text-secondary hover:text-bk-text-primary'
              }`}
            >
              <ArrowUpRightIcon size={14} />
              <span>Gave Credit (+ Udhaar)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTransType('payment');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                transType === 'payment'
                  ? 'bg-bk-status-paid text-white shadow-2xs'
                  : 'text-bk-text-secondary hover:text-bk-text-primary'
              }`}
            >
              <ArrowDownLeftIcon size={14} />
              <span>Got Payment (- Jama)</span>
            </button>
          </div>

          {/* Customer Selection via Searchable CustomerSelector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider block">
              Customer Account *
            </label>
            <CustomerSelector
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider block">
              Amount (₹) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-base font-bold text-bk-text-secondary">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                autoFocus
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2 border border-bk-border rounded-xl bg-white text-base font-bold font-mono text-bk-text-primary focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
              />
            </div>
          </div>

          {/* Date & Note in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-bk-text-secondary uppercase">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-bk-border rounded-xl bg-white text-xs font-medium text-bk-text-primary focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-bk-text-secondary uppercase">
                Item / Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bill #120, Cash"
                className="w-full px-3 py-2 border border-bk-border rounded-xl bg-white text-xs text-bk-text-primary focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-bk-border mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-bk-border rounded-xl text-xs font-semibold text-bk-text-secondary hover:text-bk-text-primary bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-2xs cursor-pointer transition-all active:scale-95 ${
                transType === 'credit'
                  ? 'bg-bk-status-overdue hover:bg-red-700'
                  : 'bg-bk-status-paid hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? 'Saving...' : `Save ${transType === 'credit' ? 'Credit' : 'Payment'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
