import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, ArrowUpRightIcon, ArrowDownLeftIcon, AlertCircleIcon } from './Icons';
import { 
  Customer, 
  FinancialTransactionType, 
  PaymentMethod,
  PaymentAllocation,
  calculateCustomerLedger,
  previewTransactionEffect
} from '../domain/customer';
import { formatIndianCurrency, rupeesToPaise } from '../domain/amountFormatter';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { CustomerSelector } from './CustomerSelector';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  initialCustomer?: Customer | null;
  initialType?: string;
  onRecordTransaction: (
    customerId: string,
    type: string,
    amountPaise: number,
    note?: string,
    date?: string,
    options?: any
  ) => Promise<any>;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  customers,
  initialCustomer,
  initialType = 'credit_given',
  onRecordTransaction
}) => {
  const { triggerHaptic } = useDisplaySettings();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    () => initialCustomer?.id || customers[0]?.id || ''
  );
  
  const [directionCategory, setDirectionCategory] = useState<'receive' | 'pay'>(
    initialType === 'payment_made' || initialType === 'debt_incurred' ? 'pay' : 'receive'
  );
  
  const [transType, setTransType] = useState<FinancialTransactionType>(
    initialType === 'payment' ? 'payment_received' : initialType === 'credit' ? 'credit_given' : (initialType as FinancialTransactionType)
  );

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedTargetDebtId, setSelectedTargetDebtId] = useState<string>('fifo');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setSelectedCustomerId(initialCustomer.id);
      } else if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
      }
      const initialCat = initialType === 'payment_made' || initialType === 'debt_incurred' ? 'pay' : 'receive';
      setDirectionCategory(initialCat);
      setTransType(
        initialType === 'payment' ? 'payment_received' : initialType === 'credit' ? 'credit_given' : (initialType as FinancialTransactionType)
      );
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setPaymentMethod('cash');
      setReferenceNumber('');
      setSelectedTargetDebtId('fifo');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialCustomer, initialType, customers]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  if (!isOpen) return null;

  const amountPaise = rupeesToPaise(amount);

  // Approximate preview based on selected customer state
  const currentReceivable = selectedCustomer?.receivablePaise ?? (selectedCustomer?.amount && selectedCustomer.amount > 0 ? selectedCustomer.amount : 0);
  const currentPayable = selectedCustomer?.payablePaise ?? 0;
  const currentAdvance = selectedCustomer?.customerAdvancePaise ?? 0;

  const isReceivableDirection = transType === 'credit_given' || transType === 'payment_received' || transType === 'advance_received';
  const isPayment = transType === 'payment_received' || transType === 'payment_made';

  let previewNewOutstanding = isReceivableDirection ? currentReceivable : currentPayable;
  let previewAdvanceResult = currentAdvance;

  if (amountPaise > 0) {
    if (isPayment) {
      if (amountPaise > previewNewOutstanding) {
        previewAdvanceResult += (amountPaise - previewNewOutstanding);
        previewNewOutstanding = 0;
      } else {
        previewNewOutstanding = Math.max(0, previewNewOutstanding - amountPaise);
      }
    } else if (transType === 'credit_given' || transType === 'debt_incurred') {
      previewNewOutstanding += amountPaise;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('standard');

    if (!selectedCustomerId) {
      setError('Please select an account');
      return;
    }

    if (!amount.trim()) {
      setError('Please enter a valid amount');
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
      const selectedAllocations: PaymentAllocation[] | undefined = 
        selectedTargetDebtId && selectedTargetDebtId !== 'fifo'
          ? [{ targetTransactionId: selectedTargetDebtId, allocatedPaise: paise }]
          : undefined;

      await onRecordTransaction(selectedCustomerId, transType, paise, note, date, {
        paymentMethod: isPayment ? paymentMethod : undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        dueDate: (transType === 'credit_given' || transType === 'debt_incurred') ? (dueDate || null) : undefined,
        allocations: selectedAllocations
      });

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-bk-surface border-t sm:border border-bk-border rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up max-h-[92dvh]">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-bk-border rounded-full mx-auto mt-2 shrink-0" />

        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft/60 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-bk-text-primary tracking-tight">
              Record Transaction
            </h3>
            <p className="text-[11px] text-bk-text-tertiary">Unified credit, debit & payment ledger entry</p>
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

        {/* Form Body - Scrollable Container */}
        <form id="quick-transaction-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircleIcon size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
              Account / Person
            </label>
            <CustomerSelector
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={(id) => setSelectedCustomerId(id)}
              disabled={customers.length === 0}
            />
          </div>

          {/* Directional Toggle: Receive vs Pay */}
          <div className="grid grid-cols-2 p-1 bg-bk-surface-soft border border-bk-border rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setDirectionCategory('receive');
                setTransType('credit_given');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                directionCategory === 'receive'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-bk-text-secondary hover:text-bk-text-primary'
              }`}
            >
              <ArrowUpRightIcon size={13} />
              <span>Money I Receive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setDirectionCategory('pay');
                setTransType('debt_incurred');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                directionCategory === 'pay'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-bk-text-secondary hover:text-bk-text-primary'
              }`}
            >
              <ArrowDownLeftIcon size={13} />
              <span>Money I Pay</span>
            </button>
          </div>

          {/* Specific Transaction Sub-Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
              Transaction Type
            </label>
            <select
              value={transType}
              onChange={(e) => setTransType(e.target.value as FinancialTransactionType)}
              className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs font-bold text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
            >
              {directionCategory === 'receive' ? (
                <>
                  <option value="credit_given">Credit Given (Udhaar Diya - You will receive)</option>
                  <option value="payment_received">Payment Received (Jama Mila - Customer paid)</option>
                  <option value="advance_received">Advance Received (Customer deposited advance)</option>
                </>
              ) : (
                <>
                  <option value="debt_incurred">Debt Incurred (Udhaar Liya - You must pay)</option>
                  <option value="payment_made">Payment Made (Bhugtan - You paid creditor)</option>
                  <option value="advance_paid">Advance Paid (You deposited advance to supplier)</option>
                </>
              )}
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-mono font-bold text-base text-bk-text-secondary">
                ₹
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="w-full pl-8 pr-3 py-2 bg-white border border-bk-border rounded-xl font-mono text-base font-extrabold text-bk-text-primary focus:outline-none focus:ring-2 focus:ring-bk-brand-primary"
              />
            </div>
          </div>

          {/* Real-time Mathematical Preview */}
          {amountPaise > 0 && selectedCustomer && (
            <div className="p-3 bg-zinc-50 border border-bk-border rounded-xl space-y-1 text-xs animate-fade-in">
              <div className="flex justify-between text-bk-text-secondary">
                <span>Current Outstanding:</span>
                <span className="font-mono font-bold">
                  {formatIndianCurrency(isReceivableDirection ? currentReceivable : currentPayable)}
                </span>
              </div>
              <div className="flex justify-between text-bk-text-secondary">
                <span>Transaction Impact:</span>
                <span className={`font-mono font-bold ${isPayment ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPayment ? '-' : '+'}{formatIndianCurrency(amountPaise)}
                </span>
              </div>
              <div className="border-t border-bk-border pt-1 flex justify-between font-bold text-bk-text-primary">
                <span>Expected New Outstanding:</span>
                <span className="font-mono">{formatIndianCurrency(previewNewOutstanding)}</span>
              </div>
              {previewAdvanceResult > 0 && isPayment && (
                <div className="text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded-lg border border-blue-100 mt-1 font-medium">
                  ℹ {formatIndianCurrency(previewAdvanceResult)} will be held as advance balance.
                </div>
              )}
            </div>
          )}

          {/* Payment Method & Reference for Payments */}
          {isPayment && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
                  Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
                  Reference #
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="UTR / Bill #"
                  className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
                />
              </div>
            </div>
          )}

          {/* Date & Due Date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
              />
            </div>

            {(transType === 'credit_given' || transType === 'debt_incurred') ? (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
                />
              </div>
            ) : null}
          </div>

          {/* Description / Memo */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
              Description / Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly grocery / Invoice #102"
              className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
            />
          </div>
        </form>

        {/* Sticky Fixed Bottom Actions */}
        <div className="p-3 border-t border-bk-border bg-bk-surface-soft/80 flex items-center gap-2 shrink-0 select-none">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-text-secondary font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quick-transaction-form"
            disabled={isSubmitting || !selectedCustomerId}
            className="flex-1 h-9 rounded-xl bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <span>Save Transaction</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
