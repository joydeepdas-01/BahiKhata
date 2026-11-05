import React, { useState, useEffect, useMemo } from 'react';
import { 
  CloseIcon, EditIcon, TrashIcon, WhatsAppIcon, PhoneIcon, 
  ArrowUpRightIcon, ArrowDownLeftIcon, CalendarIcon, ClockIcon, AlertCircleIcon,
  ChevronRightIcon
} from './Icons';
import { 
  Customer, 
  Transaction, 
  LedgerTransaction, 
  FinancialTransactionType,
  PaymentMethod,
  PaymentAllocation,
  CustomerFinancialSummary,
  calculateCustomerLedger,
  previewTransactionEffect,
  getTransactionTypeLabel
} from '../domain/customer';
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
  onRecordTransaction: (
    customerId: string, 
    type: string, 
    amountPaise: number, 
    note?: string, 
    date?: string,
    options?: any
  ) => Promise<{ customer: Customer; transaction: Transaction }>;
  onDeleteTransaction: (transactionId: string, customerId: string) => Promise<Customer>;
  onRecordMutualAdjustment?: (customerId: string, amountPaise: number, note?: string) => Promise<any>;
  onReverseTransaction?: (transactionId: string, customerId: string, reason?: string) => Promise<any>;
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
  onDeleteTransaction,
  onRecordMutualAdjustment,
  onReverseTransaction
}) => {
  const { triggerHaptic, confirmDelete } = useDisplaySettings();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'debts' | 'advances'>('timeline');

  // New Transaction Form Sheet state
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [directionCategory, setDirectionCategory] = useState<'receive' | 'pay'>('receive');
  const [transType, setTransType] = useState<FinancialTransactionType>('credit_given');
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDateInput, setDueDateInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedTargetDebtId, setSelectedTargetDebtId] = useState<string>('fifo');
  const [transError, setTransError] = useState<string | null>(null);
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);

  // Mutual Settlement Modal state
  const [isMutualModalOpen, setIsMutualModalOpen] = useState(false);
  const [mutualAmountInput, setMutualAmountInput] = useState('');
  const [mutualNote, setMutualNote] = useState('');
  const [isSubmittingMutual, setIsSubmittingMutual] = useState(false);

  const fetchTransactions = () => {
    if (customer && isOpen) {
      setLoadingTransactions(true);
      getCustomerTransactions(customer.id)
        .then((data) => setTransactions(data))
        .catch((err) => console.error('Failed to load transactions', err))
        .finally(() => setLoadingTransactions(false));
    }
  };

  useEffect(() => {
    if (customer && isOpen) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setIsAddTransactionOpen(false);
      setIsMutualModalOpen(false);
    }
  }, [customer, isOpen]);

  // Compute live ledger summary
  const summary: CustomerFinancialSummary = useMemo(() => {
    if (!customer) {
      return {
        customerId: '',
        receivablePaise: 0,
        payablePaise: 0,
        customerAdvancePaise: 0,
        supplierAdvancePaise: 0,
        netPaise: 0,
        totalCreditGivenPaise: 0,
        totalPaymentsReceivedPaise: 0,
        totalDebtIncurredPaise: 0,
        totalPaymentsMadePaise: 0,
        totalAdvancesReceivedPaise: 0,
        totalAdvancesPaidPaise: 0,
        totalMutualAdjustmentsPaise: 0,
        totalRefundsGivenPaise: 0,
        totalRefundsReceivedPaise: 0,
        outstandingReceivables: [],
        outstandingPayables: [],
        settledDebts: []
      };
    }
    return calculateCustomerLedger(customer.id, transactions);
  }, [customer, transactions]);

  if (!isOpen || !customer) return null;

  const dueStatus = classifyDueDate(customer.dueDate);
  const relativeDueLabel = formatDaysDifference(customer.dueDate);

  const formattedPhone = customer.phone.startsWith('91') && customer.phone.length === 12
    ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
    : customer.phone;

  // Real-time financial preview of prospective transaction
  const amountPaise = rupeesToPaise(amountInput);
  const allocations: PaymentAllocation[] | undefined = 
    selectedTargetDebtId && selectedTargetDebtId !== 'fifo'
      ? [{ targetTransactionId: selectedTargetDebtId, allocatedPaise: amountPaise }]
      : undefined;

  const preview = previewTransactionEffect(summary, transType, amountPaise, allocations);

  // Handlers for opening the Add Transaction form
  const handleOpenAddTransaction = (category: 'receive' | 'pay', defaultType?: FinancialTransactionType, targetDebtId?: string) => {
    triggerHaptic('light');
    setDirectionCategory(category);
    setTransType(defaultType || (category === 'receive' ? 'credit_given' : 'debt_incurred'));
    setAmountInput('');
    setNoteInput('');
    setDateInput(new Date().toISOString().split('T')[0]);
    setDueDateInput('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setSelectedTargetDebtId(targetDebtId || 'fifo');
    setTransError(null);
    setIsAddTransactionOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('standard');

    if (!amountInput.trim()) {
      setTransError('Please enter an amount');
      return;
    }

    const paise = rupeesToPaise(amountInput);
    if (paise <= 0) {
      setTransError('Amount must be greater than zero');
      return;
    }

    setIsSubmittingTrans(true);
    setTransError(null);

    try {
      const selectedAllocations: PaymentAllocation[] | undefined = 
        selectedTargetDebtId && selectedTargetDebtId !== 'fifo'
          ? [{ targetTransactionId: selectedTargetDebtId, allocatedPaise: paise }]
          : undefined;

      const res = await onRecordTransaction(
        customer.id,
        transType,
        paise,
        noteInput,
        dateInput,
        {
          paymentMethod: (transType === 'payment_received' || transType === 'payment_made' || transType === 'advance_received' || transType === 'advance_paid') ? paymentMethod : undefined,
          referenceNumber: referenceNumber.trim() || undefined,
          dueDate: (transType === 'credit_given' || transType === 'debt_incurred') ? (dueDateInput || null) : undefined,
          allocations: selectedAllocations
        }
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

  const handleOpenMutualAdjustment = () => {
    triggerHaptic('light');
    const maxOffset = Math.min(summary.receivablePaise, summary.payablePaise);
    setMutualAmountInput((maxOffset / 100).toFixed(2));
    setMutualNote('Mutual bilateral settlement offset');
    setIsMutualModalOpen(true);
  };

  const handleExecuteMutualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('standard');
    const paise = rupeesToPaise(mutualAmountInput);
    const maxOffset = Math.min(summary.receivablePaise, summary.payablePaise);

    if (paise <= 0 || paise > maxOffset) {
      alert(`Adjustment amount must be between ₹0.01 and ${formatIndianCurrency(maxOffset)}`);
      return;
    }

    setIsSubmittingMutual(true);
    try {
      if (onRecordMutualAdjustment) {
        await onRecordMutualAdjustment(customer.id, paise, mutualNote);
      } else {
        await onRecordTransaction(customer.id, 'mutual_adjustment', paise, mutualNote);
      }
      triggerHaptic('success');
      fetchTransactions();
      setIsMutualModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to process mutual adjustment');
    } finally {
      setIsSubmittingMutual(false);
    }
  };

  const handleReverseTransactionClick = async (transaction: Transaction) => {
    triggerHaptic('warning');
    const reason = window.prompt(
      `Reverse this ${transaction.type} of ${formatIndianCurrency(transaction.amount)}?\n\nEnter reason for reversal (preserves complete audit trail):`,
      'Incorrect entry correction'
    );
    if (reason === null) return; // User cancelled

    try {
      if (onReverseTransaction) {
        await onReverseTransaction(transaction.id, customer.id, reason);
      } else {
        await onDeleteTransaction(transaction.id, customer.id);
      }
      triggerHaptic('success');
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Failed to reverse transaction');
    }
  };

  const maxMutualOffset = Math.min(summary.receivablePaise, summary.payablePaise);
  const hasBothPositions = summary.receivablePaise > 0 && summary.payablePaise > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-bk-surface border-t sm:border border-bk-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[94dvh] z-10">
        
        {/* Drag handle for mobile */}
        <div className="sm:hidden w-12 h-1 bg-bk-border rounded-full mx-auto mt-2 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-bk-surface border border-bk-border font-bold text-sm text-bk-text-primary flex items-center justify-center shrink-0">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-bk-text-primary text-base sm:text-lg leading-tight truncate">
                {customer.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-bk-text-secondary mt-0.5">
                <span className="font-mono">{formattedPhone}</span>
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="p-1 rounded hover:bg-bk-border/60 text-bk-text-tertiary hover:text-bk-text-primary transition-colors"
                    title="Call"
                  >
                    <PhoneIcon size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEditCustomer(customer)}
              className="p-1.5 rounded-lg border border-bk-border hover:bg-bk-surface text-bk-text-secondary hover:text-bk-text-primary transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <EditIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteCustomer(customer.id)}
              className="p-1.5 rounded-lg border border-bk-border hover:bg-red-50 hover:border-red-200 text-bk-text-tertiary hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete Account"
            >
              <TrashIcon size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-bk-border/60 text-bk-text-tertiary hover:text-bk-text-primary transition-colors cursor-pointer ml-1"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 select-text">

          {/* 1. Independent Financial Overview (Wise + Apple Minimal Hierarchy) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Tile 1: Owes You (Receivable) */}
            <div className="p-3 bg-red-50/70 dark:bg-rose-950/20 border border-red-100 dark:border-rose-900/40 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Owes You
              </span>
              <div className="mt-1">
                <span className="font-mono text-base sm:text-lg font-black text-rose-700 dark:text-rose-300">
                  {formatIndianCurrency(summary.receivablePaise)}
                </span>
                <p className="text-[10px] text-rose-600/80 mt-0.5">
                  {summary.outstandingReceivables.length} open bill(s)
                </p>
              </div>
            </div>

            {/* Tile 2: You Owe (Payable) */}
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                You Owe
              </span>
              <div className="mt-1">
                <span className="font-mono text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300">
                  {formatIndianCurrency(summary.payablePaise)}
                </span>
                <p className="text-[10px] text-indigo-600/80 mt-0.5">
                  {summary.outstandingPayables.length} open debt(s)
                </p>
              </div>
            </div>

            {/* Tile 3: Advances */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Advances Held
              </span>
              <div className="mt-1">
                <span className="font-mono text-base sm:text-lg font-black text-blue-700 dark:text-blue-300">
                  {formatIndianCurrency(summary.customerAdvancePaise || summary.supplierAdvancePaise)}
                </span>
                <p className="text-[10px] text-blue-600/80 mt-0.5">
                  {summary.customerAdvancePaise > 0 ? 'Customer credit' : summary.supplierAdvancePaise > 0 ? 'Supplier deposit' : 'None'}
                </p>
              </div>
            </div>

            {/* Tile 4: Net Position */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-bk-border rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-bk-text-secondary">
                Net Position
              </span>
              <div className="mt-1">
                <span className={`font-mono text-base sm:text-lg font-black ${
                  summary.netPaise > 0 ? 'text-rose-600' : summary.netPaise < 0 ? 'text-indigo-600' : 'text-emerald-600'
                }`}>
                  {formatIndianCurrency(Math.abs(summary.netPaise))}
                </span>
                <p className="text-[10px] font-semibold text-bk-text-tertiary mt-0.5">
                  {summary.netPaise > 0 ? 'Net Owes You' : summary.netPaise < 0 ? 'Net You Owe' : 'Zero Net'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Mutual Settlement Action Banner (If both directions have open balances) */}
          {hasBothPositions && (
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Mutual Positions Detected
                  </span>
                  <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-mono font-bold">
                    Offset up to {formatIndianCurrency(maxMutualOffset)}
                  </span>
                </div>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                  You can perform a bilateral settlement to reduce both balances without exchanging physical cash.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenMutualAdjustment}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-2xs transition-transform active:scale-95"
              >
                Settle Mutually
              </button>
            </div>
          )}

          {/* 3. Primary Directional Actions Bar */}
          <div className="grid grid-cols-2 gap-2 select-none">
            <button
              type="button"
              onClick={() => handleOpenAddTransaction('receive', 'credit_given')}
              className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-rose-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <ArrowUpRightIcon size={14} />
              <span>+ Gave Credit (Udhaar Diya)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddTransaction('receive', 'payment_received')}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <ArrowDownLeftIcon size={14} />
              <span>- Got Payment (Jama Mila)</span>
            </button>
          </div>

          {/* Quick Payables Shortcut */}
          <div className="flex items-center justify-between text-xs text-bk-text-secondary px-1">
            <span>Supplier / Liability Actions:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddTransaction('pay', 'debt_incurred')}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                + Took Credit
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleOpenAddTransaction('pay', 'payment_made')}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                - Made Payment
              </button>
            </div>
          </div>

          {/* 4. Tab Navigation */}
          <div className="border-b border-bk-border flex items-center gap-4 text-xs font-bold text-bk-text-secondary pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'timeline'
                  ? 'border-bk-brand-primary text-bk-brand-primary'
                  : 'border-transparent hover:text-bk-text-primary'
              }`}
            >
              Ledger Timeline ({transactions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('debts')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'debts'
                  ? 'border-bk-brand-primary text-bk-brand-primary'
                  : 'border-transparent hover:text-bk-text-primary'
              }`}
            >
              <span>Outstanding Bills & Installments</span>
              {(summary.outstandingReceivables.length + summary.outstandingPayables.length > 0) && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-red-100 text-rose-700 font-mono">
                  {summary.outstandingReceivables.length + summary.outstandingPayables.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('advances')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'advances'
                  ? 'border-bk-brand-primary text-bk-brand-primary'
                  : 'border-transparent hover:text-bk-text-primary'
              }`}
            >
              Advances ({formatIndianCurrency(summary.customerAdvancePaise + summary.supplierAdvancePaise)})
            </button>
          </div>

          {/* 5. TAB A: Chronological Ledger Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-2">
              {loadingTransactions ? (
                <div className="p-6 text-center text-xs text-bk-text-tertiary">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-bk-text-tertiary text-xs border border-dashed border-bk-border rounded-xl">
                  No transaction history recorded yet. Use the buttons above to record the first transaction.
                </div>
              ) : (
                transactions.map((tx) => {
                  const info = getTransactionTypeLabel(tx.type as FinancialTransactionType);
                  const isCreditDirection = tx.type === 'credit_given' || tx.type === 'debt_incurred';

                  return (
                    <div
                      key={tx.id}
                      className={`p-3 rounded-xl border transition-all ${
                        tx.isReversed
                          ? 'bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-60'
                          : 'bg-white border-bk-border hover:border-bk-brand-primary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                              info.category === 'receive'
                                ? 'bg-red-50 text-rose-700 border-red-100'
                                : info.category === 'pay'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                : 'bg-purple-50 text-purple-700 border-purple-100'
                            }`}>
                              {info.label}
                            </span>
                            {tx.paymentMethod && (
                              <span className="text-[10px] font-mono text-bk-text-tertiary uppercase">
                                [{tx.paymentMethod}]
                              </span>
                            )}
                            {tx.isReversed && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                                Reversed
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-bk-text-secondary mt-1">
                            <span>{formatDisplayDate(tx.date)}</span>
                            {tx.referenceNumber && (
                              <span className="font-mono text-[11px] text-bk-text-tertiary ml-2">
                                Ref: {tx.referenceNumber}
                              </span>
                            )}
                          </div>

                          {tx.note && (
                            <p className="text-xs text-bk-text-primary mt-1 bg-bk-surface-soft px-2 py-0.5 rounded border border-bk-border/60">
                              {tx.note}
                            </p>
                          )}
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className={`font-mono text-sm font-black ${
                            tx.isReversed
                              ? 'line-through text-zinc-400'
                              : isCreditDirection
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}>
                            {isCreditDirection ? '+' : '-'}{formatIndianCurrency(tx.amount)}
                          </span>

                          {!tx.isReversed && tx.type !== 'reversal' && (
                            <button
                              type="button"
                              onClick={() => handleReverseTransactionClick(tx)}
                              className="text-[10px] text-zinc-400 hover:text-rose-600 font-semibold mt-1 cursor-pointer transition-colors"
                              title="Reverse this transaction traceably"
                            >
                              Reverse
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 6. TAB B: Outstanding Bills & Flexible Installments */}
          {activeTab === 'debts' && (
            <div className="space-y-3">
              <div className="text-xs text-bk-text-secondary font-medium">
                Track each specific credit bill, see progress of installments, or settle individual bills directly:
              </div>

              {/* Receivables List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Bills Customer Owes You ({summary.outstandingReceivables.length})
                </h4>

                {summary.outstandingReceivables.length === 0 ? (
                  <div className="p-3 text-center text-xs text-bk-text-tertiary bg-emerald-50 rounded-xl border border-emerald-100">
                    ✓ All customer credit bills have been fully settled!
                  </div>
                ) : (
                  summary.outstandingReceivables.map((debt) => {
                    const pct = Math.round((debt.settledAmountPaise / debt.originalAmountPaise) * 100);

                    return (
                      <div key={debt.transactionId} className="p-3.5 bg-white border border-bk-border rounded-xl space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-bk-text-primary">
                                Bill from {formatDisplayDate(debt.date)}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                debt.status === 'unsettled' ? 'bg-red-50 text-rose-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {debt.status === 'unsettled' ? 'Unsettled' : `${pct}% Paid`}
                              </span>
                            </div>
                            {debt.note && <p className="text-xs text-bk-text-tertiary mt-0.5">{debt.note}</p>}
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-sm font-black text-rose-600">
                              Remaining: {formatIndianCurrency(debt.remainingAmountPaise)}
                            </span>
                            <div className="text-[10px] text-bk-text-tertiary">
                              Original: {formatIndianCurrency(debt.originalAmountPaise)}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>

                        {/* Installment History for this bill */}
                        {debt.allocations.length > 0 && (
                          <div className="text-[11px] text-bk-text-secondary bg-bk-surface-soft p-2 rounded-lg space-y-1">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-bk-text-tertiary">
                              Installments Paid ({debt.allocations.length}):
                            </span>
                            {debt.allocations.map((a, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span>{formatDisplayDate(a.paymentDate)} ({a.paymentMethod || 'cash'})</span>
                                <span className="font-mono font-bold text-emerald-600">+{formatIndianCurrency(a.allocatedPaise)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenAddTransaction('receive', 'payment_received', debt.transactionId)}
                            className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors"
                          >
                            Pay Installment / Settle This Bill
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Payables List */}
              {summary.outstandingPayables.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Debts You Owe To Them ({summary.outstandingPayables.length})
                  </h4>

                  {summary.outstandingPayables.map((debt) => (
                    <div key={debt.transactionId} className="p-3.5 bg-white border border-bk-border rounded-xl space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-bk-text-primary">
                            Debt from {formatDisplayDate(debt.date)}
                          </span>
                          {debt.note && <p className="text-xs text-bk-text-tertiary mt-0.5">{debt.note}</p>}
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-sm font-black text-indigo-600">
                            Remaining: {formatIndianCurrency(debt.remainingAmountPaise)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenAddTransaction('pay', 'payment_made', debt.transactionId)}
                          className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold cursor-pointer transition-colors"
                        >
                          Pay Installment / Settle Debt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. TAB C: Advances Management */}
          {activeTab === 'advances' && (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Advance Balances</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Advances are held separately and will automatically adjust against any new credit transactions.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-black text-blue-700">
                    {formatIndianCurrency(summary.customerAdvancePaise || summary.supplierAdvancePaise)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddTransaction('receive', 'advance_received')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  + Record Customer Advance
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddTransaction('pay', 'advance_paid')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  + Record Supplier Advance
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Quick WhatsApp Follow-Up */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-bk-border bg-bk-surface-soft/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-bk-text-secondary">
            {summary.receivablePaise > 0 ? (
              <span className="font-bold text-rose-600">
                Total Due: {formatIndianCurrency(summary.receivablePaise)}
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">
                ✓ No Outstanding Dues
              </span>
            )}
          </div>

          {summary.receivablePaise > 0 && (
            <button
              type="button"
              onClick={() => onPrepareReminder(customer)}
              className="px-3 py-1.5 rounded-lg bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-transform active:scale-95"
            >
              <WhatsAppIcon size={14} />
              <span>Send WhatsApp Reminder</span>
            </button>
          )}
        </div>
      </div>

      {/* 8. Slide-Over Sheet for Recording New Transaction with Contextual Forms */}
      {isAddTransactionOpen && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsAddTransactionOpen(false)} />

          <div className="relative w-full max-w-md bg-white border border-bk-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[92dvh] z-20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft shrink-0">
              <div>
                <h4 className="text-sm font-extrabold text-bk-text-primary">
                  Record Transaction for {customer.name}
                </h4>
                <p className="text-[11px] text-bk-text-tertiary">Select transaction type and enter details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTransactionOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-bk-border text-bk-text-tertiary hover:text-bk-text-primary flex items-center justify-center cursor-pointer"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveTransaction} className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text">
              {transError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircleIcon size={14} className="shrink-0" />
                  <span>{transError}</span>
                </div>
              )}

              {/* Direction Selector: Money I Receive vs Money I Pay */}
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
                  <ArrowUpRightIcon size={12} />
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
                  <ArrowDownLeftIcon size={12} />
                  <span>Money I Pay</span>
                </button>
              </div>

              {/* Sub-Type Selector */}
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
                      <option value="refund_given">Refund Given (Refunded to customer from advance)</option>
                    </>
                  ) : (
                    <>
                      <option value="debt_incurred">Debt Incurred (Udhaar Liya - You must pay)</option>
                      <option value="payment_made">Payment Made (Bhugtan - You paid creditor)</option>
                      <option value="advance_paid">Advance Paid (You deposited advance to supplier)</option>
                      <option value="refund_received">Refund Received (Supplier refunded your advance)</option>
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
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono font-bold text-base text-bk-text-secondary">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full pl-8 pr-3 py-2 bg-white border border-bk-border rounded-xl font-mono text-base font-extrabold text-bk-text-primary focus:outline-none focus:ring-2 focus:ring-bk-brand-primary"
                  />
                </div>
              </div>

              {/* Real-Time Mathematical Preview */}
              {amountPaise > 0 && (
                <div className="p-3 bg-zinc-50 border border-bk-border rounded-xl space-y-1.5 text-xs animate-fade-in">
                  <div className="flex justify-between text-bk-text-secondary">
                    <span>Outstanding Before:</span>
                    <span className="font-mono font-bold">{formatIndianCurrency(preview.currentOutstandingPaise)}</span>
                  </div>
                  <div className="flex justify-between text-bk-text-secondary">
                    <span>Transaction Effect:</span>
                    <span className={`font-mono font-bold ${
                      transType === 'payment_received' || transType === 'payment_made' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {transType === 'payment_received' || transType === 'payment_made' ? '-' : '+'}{formatIndianCurrency(amountPaise)}
                    </span>
                  </div>
                  <div className="border-t border-bk-border pt-1 flex justify-between font-bold text-bk-text-primary">
                    <span>Outstanding After:</span>
                    <span className="font-mono">{formatIndianCurrency(preview.newOutstandingPaise)}</span>
                  </div>

                  {preview.advancePaiseResult > 0 && (
                    <div className="text-[11px] text-blue-700 bg-blue-50 p-1.5 rounded-lg border border-blue-100 font-medium">
                      ℹ {formatIndianCurrency(preview.advancePaiseResult)} will be held as advance balance for future adjustment.
                    </div>
                  )}
                </div>
              )}

              {/* Debt Allocation Selector (for payment transactions) */}
              {(transType === 'payment_received' || transType === 'payment_made') && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
                    Settlement Allocation
                  </label>
                  <select
                    value={selectedTargetDebtId}
                    onChange={(e) => setSelectedTargetDebtId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
                  >
                    <option value="fifo">Auto FIFO (Settle oldest open bill first)</option>
                    {(transType === 'payment_received' ? summary.outstandingReceivables : summary.outstandingPayables).map((d) => (
                      <option key={d.transactionId} value={d.transactionId}>
                        Settle bill from {formatDisplayDate(d.date)} (Remaining: {formatIndianCurrency(d.remainingAmountPaise)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Method & Reference (for payments & advances) */}
              {(transType === 'payment_received' || transType === 'payment_made' || transType === 'advance_received' || transType === 'advance_paid') && (
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
                      <option value="cash">Cash (Nagad)</option>
                      <option value="upi">UPI (GPay/PhonePe/Paytm)</option>
                      <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
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
                      placeholder="UTR / Cheque #"
                      className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
                    />
                  </div>
                </div>
              )}

              {/* Date & Optional Due Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
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
                      value={dueDateInput}
                      onChange={(e) => setDueDateInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
                    />
                  </div>
                ) : null}
              </div>

              {/* Note / Memo */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g. 5 bags rice / Bill #402"
                  className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
                />
              </div>

              {/* Sticky Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTransactionOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-bk-text-secondary hover:bg-bk-surface-soft rounded-xl border border-bk-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTrans}
                  className="flex-1 py-2 text-xs font-bold text-white bg-bk-brand-primary hover:bg-bk-brand-primary-hover rounded-xl shadow-2xs transition-transform active:scale-[0.98] cursor-pointer"
                >
                  {isSubmittingTrans ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Mutual Settlement Offset Modal */}
      {isMutualModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-fade-in">
          <div className="bg-white border border-bk-border rounded-2xl shadow-2xl p-5 max-w-sm w-full space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-bk-text-primary">
                Mutual Bilateral Settlement
              </h4>
              <p className="text-xs text-bk-text-secondary mt-1">
                Offset {customer.name}&apos;s receivable due against your payable debt without cash movement.
              </p>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Receivable (They owe):</span>
                <span className="font-mono font-bold text-rose-600">{formatIndianCurrency(summary.receivablePaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payable (You owe):</span>
                <span className="font-mono font-bold text-indigo-600">{formatIndianCurrency(summary.payablePaise)}</span>
              </div>
              <div className="border-t border-purple-200 pt-1 flex justify-between font-bold text-purple-900">
                <span>Max Offset Possible:</span>
                <span className="font-mono">{formatIndianCurrency(maxMutualOffset)}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteMutualAdjustment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-bk-text-secondary uppercase">
                  Offset Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={mutualAmountInput}
                  onChange={(e) => setMutualAmountInput(e.target.value)}
                  max={maxMutualOffset / 100}
                  required
                  className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl font-mono text-base font-extrabold text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-bk-text-secondary uppercase">
                  Note
                </label>
                <input
                  type="text"
                  value={mutualNote}
                  onChange={(e) => setMutualNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-bk-border rounded-xl text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMutualModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-bk-text-secondary hover:bg-bk-surface-soft rounded-xl border border-bk-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMutual}
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer"
                >
                  {isSubmittingMutual ? 'Offsetting...' : 'Confirm Offset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
