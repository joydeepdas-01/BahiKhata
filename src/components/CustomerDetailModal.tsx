import React, { useState, useEffect } from 'react';
import { 
  CloseIcon, EditIcon, TrashIcon, WhatsAppIcon, PhoneIcon, 
  ArrowUpRightIcon, ArrowDownLeftIcon, CalendarIcon, ClockIcon, AlertCircleIcon 
} from './Icons';
import { Customer, Transaction } from '../domain/customer';
import { formatIndianCurrency, rupeesToPaise } from '../domain/amountFormatter';
import { classifyDueDate, formatDaysDifference, formatDisplayDate } from '../domain/dateClassifier';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onPrepareReminder: (customer: Customer) => void;
  getCustomerTransactions: (customerId: string) => Promise<Transaction[]>;
  onRecordTransaction: (customerId: string, type: 'credit' | 'payment', amountPaise: number, note?: string, date?: string) => Promise<{ customer: Customer; transaction: Transaction }>;
  onDeleteTransaction: (transactionId: string, customerId: string) => Promise<Customer>;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEditCustomer,
  onDeleteCustomer,
  onPrepareReminder,
  getCustomerTransactions,
  onRecordTransaction,
  onDeleteTransaction
}) => {
  const { triggerHaptic, confirmDelete } = useDisplaySettings();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // New Transaction Form Sheet state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [newTransType, setNewTransType] = useState<'credit' | 'payment'>('credit');
  const [newTransAmount, setNewTransAmount] = useState('');
  const [newTransNote, setNewTransNote] = useState('');
  const [newTransDate, setNewTransDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transError, setTransError] = useState<string | null>(null);
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      setLoadingTransactions(true);
      getCustomerTransactions(customer.id)
        .then((data) => setTransactions(data))
        .catch((err) => console.error('Failed to load transactions', err))
        .finally(() => setLoadingTransactions(false));
    } else {
      setTransactions([]);
      setIsAddTransactionOpen(false);
    }
  }, [customer, isOpen, getCustomerTransactions]);

  if (!isOpen || !customer) return null;

  const dueStatus = classifyDueDate(customer.dueDate);
  const relativeDueLabel = formatDaysDifference(customer.dueDate);

  const formattedPhone = customer.phone.startsWith('91') && customer.phone.length === 12
    ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
    : customer.phone;

  const handleOpenAddTransaction = (type: 'credit' | 'payment') => {
    triggerHaptic('light');
    setNewTransType(type);
    setNewTransAmount('');
    setNewTransNote('');
    setNewTransDate(new Date().toISOString().split('T')[0]);
    setTransError(null);
    setIsAddTransactionOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('standard');

    if (!newTransAmount.trim()) {
      setTransError('Please enter an amount');
      return;
    }

    const paise = rupeesToPaise(newTransAmount);
    if (paise <= 0) {
      setTransError('Amount must be greater than zero');
      return;
    }

    setIsSubmittingTrans(true);
    setTransError(null);

    try {
      const res = await onRecordTransaction(
        customer.id,
        newTransType,
        paise,
        newTransNote,
        newTransDate
      );
      triggerHaptic('success');
      setTransactions((prev) => [res.transaction, ...prev]);
      setIsAddTransactionOpen(false);
    } catch (err: any) {
      setTransError(err.message || 'Failed to record transaction');
      triggerHaptic('warning');
    } finally {
      setIsSubmittingTrans(false);
    }
  };

  const handleDeleteTransactionClick = async (transactionId: string) => {
    if (confirmDelete) {
      if (!window.confirm('Are you sure you want to delete this transaction entry? Customer balance will be updated automatically.')) {
        return;
      }
    }

    triggerHaptic('warning');
    try {
      await onDeleteTransaction(transactionId, customer.id);
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
      triggerHaptic('success');
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const handleDeleteCustomerClick = () => {
    if (window.confirm(`Delete the entire ledger for "${customer.name}"? This will erase all customer history and transactions.`)) {
      triggerHaptic('warning');
      onDeleteCustomer(customer.id);
      onClose();
    }
  };

  const isBalanceDue = customer.amount > 0;
  const isSettled = customer.amount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bk-text-primary/40 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[92dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1 bg-bk-border rounded-full mx-auto mt-2" />

        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bk-brand-primary text-white font-extrabold flex items-center justify-center text-sm shadow-2xs">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight leading-tight">
                {customer.name}
              </h3>
              <p className="text-xs font-mono text-bk-text-secondary">{formattedPhone}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                onEditCustomer(customer);
              }}
              className="p-2 border border-bk-border rounded-lg bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary cursor-pointer transition-colors"
              title="Edit Profile"
            >
              <EditIcon size={16} />
            </button>
            <button
              onClick={handleDeleteCustomerClick}
              className="p-2 border border-bk-border rounded-lg bg-white hover:bg-bk-status-overdue/10 text-bk-text-tertiary hover:text-bk-status-overdue cursor-pointer transition-colors"
              title="Delete Ledger"
            >
              <TrashIcon size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-bk-border/60 transition-colors text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer ml-1"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Ledger Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 select-text">
          {/* Outstanding Balance Hero (Wise inspired) */}
          <div className="bg-bk-surface-soft border border-bk-border rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider block">
                {isBalanceDue ? 'Net Amount Owed by Customer' : isSettled ? 'Account Settled' : 'Advance Paid by Customer'}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                  isBalanceDue ? 'text-bk-status-overdue' : isSettled ? 'text-bk-status-paid' : 'text-blue-600'
                }`}
              >
                {formatIndianCurrency(customer.amount)}
              </div>
              {customer.dueDate && (
                <div className="flex items-center gap-1.5 text-xs text-bk-text-secondary pt-0.5">
                  <CalendarIcon size={14} className="text-bk-text-tertiary" />
                  <span>Due: {formatDisplayDate(customer.dueDate)}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      dueStatus === 'overdue'
                        ? 'bg-bk-status-overdue/10 text-bk-status-overdue border-bk-status-overdue/20'
                        : dueStatus === 'due_today'
                        ? 'bg-bk-status-pending/10 text-bk-status-pending border-bk-status-pending/20'
                        : 'bg-bk-surface text-bk-text-secondary border-bk-border'
                    }`}
                  >
                    {relativeDueLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Shortcuts (Call & WhatsApp) */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${customer.phone.replace(/^91/, '')}`}
                onClick={() => triggerHaptic('light')}
                className="px-3.5 py-2 bg-white border border-bk-border hover:bg-bk-surface text-bk-text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <PhoneIcon size={15} className="text-bk-text-secondary" />
                <span>Call</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('standard');
                  onPrepareReminder(customer);
                }}
                className="px-4 py-2 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <WhatsAppIcon size={15} />
                <span>Send Reminder</span>
              </button>
            </div>
          </div>

          {/* Customer Memo/Note (if present) */}
          {customer.note && (
            <div className="p-3 bg-white border border-bk-border rounded-xl text-xs text-bk-text-secondary italic">
              "{customer.note}"
            </div>
          )}

          {/* Quick Transaction Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleOpenAddTransaction('credit')}
              className="py-3 px-4 bg-bk-status-overdue hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowUpRightIcon size={16} />
              <span>Gave Credit (+ Udhaar)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddTransaction('payment')}
              className="py-3 px-4 bg-bk-status-paid hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowDownLeftIcon size={16} />
              <span>Got Payment (- Jama)</span>
            </button>
          </div>

          {/* Add Transaction Inline Sheet (when triggered) */}
          {isAddTransactionOpen && (
            <form onSubmit={handleSaveTransaction} className="p-4 bg-white border-2 border-bk-brand-primary/40 rounded-2xl shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-bk-border pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-bk-text-primary flex items-center gap-1.5">
                  {newTransType === 'credit' ? (
                    <>
                      <ArrowUpRightIcon size={16} className="text-bk-status-overdue" />
                      <span>Record Credit Given to {customer.name}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownLeftIcon size={16} className="text-bk-status-paid" />
                      <span>Record Payment Received from {customer.name}</span>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddTransactionOpen(false)}
                  className="text-xs text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {transError && (
                <div className="p-2.5 bg-bk-status-overdue/10 border border-bk-status-overdue/20 rounded-lg text-xs text-bk-status-overdue flex items-center gap-1.5">
                  <AlertCircleIcon size={14} />
                  <span>{transError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-bk-text-secondary uppercase">Amount (₹) *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-bold text-bk-text-secondary">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      autoFocus
                      required
                      value={newTransAmount}
                      onChange={(e) => setNewTransAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-7 pr-3 py-2 border border-bk-border rounded-xl text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-bk-text-secondary uppercase">Date</label>
                  <input
                    type="date"
                    value={newTransDate}
                    onChange={(e) => setNewTransDate(e.target.value)}
                    className="w-full px-3 py-2 border border-bk-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
                  />
                </div>
              </div>

              {/* Note / Bill Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-bk-text-secondary uppercase">Item / Bill Details (Optional)</label>
                <input
                  type="text"
                  value={newTransNote}
                  onChange={(e) => setNewTransNote(e.target.value)}
                  placeholder="e.g. Rice 10kg, Bill #1402, Cash payment"
                  className="w-full px-3 py-2 border border-bk-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingTrans}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-2xs cursor-pointer transition-all ${
                    newTransType === 'credit'
                      ? 'bg-bk-status-overdue hover:bg-red-700'
                      : 'bg-bk-status-paid hover:bg-green-700'
                  }`}
                >
                  {isSubmittingTrans ? 'Saving...' : `Save ${newTransType === 'credit' ? 'Credit' : 'Payment'}`}
                </button>
              </div>
            </form>
          )}

          {/* Transactions History Header */}
          <div className="pt-2 flex items-center justify-between">
            <h4 className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <ClockIcon size={14} />
              <span>Transaction History & Timeline</span>
            </h4>
            <span className="text-[11px] text-bk-text-tertiary">
              {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Transaction Timeline List */}
          {loadingTransactions ? (
            <div className="space-y-2 py-4 animate-pulse">
              <div className="h-14 bg-bk-surface-soft rounded-xl" />
              <div className="h-14 bg-bk-surface-soft rounded-xl" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 border border-dashed border-bk-border rounded-2xl bg-bk-surface-soft/40 text-center space-y-2">
              <p className="text-xs text-bk-text-secondary">
                No entries recorded for this customer yet. Use the red or green buttons above to add credit or payment.
              </p>
            </div>
          ) : (
            <div className="space-y-2 select-text">
              {transactions.map((t) => {
                const isCredit = t.type === 'credit';
                return (
                  <div
                    key={t.id}
                    className="p-3 bg-white border border-bk-border rounded-xl shadow-2xs flex items-center justify-between gap-3 hover:border-bk-border/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCredit
                            ? 'bg-red-100 text-bk-status-overdue'
                            : 'bg-green-100 text-bk-status-paid'
                        }`}
                      >
                        {isCredit ? <ArrowUpRightIcon size={16} /> : <ArrowDownLeftIcon size={16} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-bk-text-primary">
                            {isCredit ? 'Credit Given (Udhaar)' : 'Payment Received (Jama)'}
                          </span>
                          <span className="text-[10px] text-bk-text-tertiary">
                            {formatDisplayDate(t.date)}
                          </span>
                        </div>
                        {t.note ? (
                          <p className="text-[11px] text-bk-text-secondary mt-0.5">{t.note}</p>
                        ) : (
                          <p className="text-[11px] text-bk-text-tertiary mt-0.5">No remarks</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-mono text-sm font-extrabold ${
                          isCredit ? 'text-bk-status-overdue' : 'text-bk-status-paid'
                        }`}
                      >
                        {isCredit ? '+' : '-'} {formatIndianCurrency(t.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteTransactionClick(t.id)}
                        className="p-1.5 text-bk-text-tertiary hover:text-bk-status-overdue rounded-lg hover:bg-bk-surface-soft cursor-pointer transition-colors"
                        title="Delete entry"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-bk-border bg-bk-surface-soft/80 flex items-center justify-between text-xs text-bk-text-tertiary">
          <span>Customer ID: {customer.id.slice(0, 8)}...</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-bk-border rounded-xl font-bold text-bk-text-secondary hover:text-bk-text-primary transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

