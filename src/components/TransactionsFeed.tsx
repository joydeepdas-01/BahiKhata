import React, { useState, useMemo } from 'react';
import { 
  Transaction, 
  Customer, 
  FinancialTransactionType,
  normalizeTransactionType,
  getTransactionTypeLabel 
} from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { formatDisplayDate } from '../domain/dateClassifier';
import { AppContentContainer } from './AppContentContainer';
import { 
  ArrowUpRightIcon, ArrowDownLeftIcon, SearchIcon, ClockIcon 
} from './Icons';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface TransactionsFeedProps {
  transactions: Transaction[];
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

type FeedFilterType = 'all' | 'receive' | 'pay' | 'credit' | 'payment' | 'adjustment';

export const TransactionsFeed: React.FC<TransactionsFeedProps> = ({
  transactions,
  customers,
  onSelectCustomer
}) => {
  const { triggerHaptic } = useDisplaySettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeedFilterType>('all');

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const normType = normalizeTransactionType(t.type);
      const info = getTransactionTypeLabel(normType);

      if (typeFilter === 'receive' && info.category !== 'receive') return false;
      if (typeFilter === 'pay' && info.category !== 'pay') return false;
      if (typeFilter === 'credit' && normType !== 'credit_given' && normType !== 'debt_incurred') return false;
      if (typeFilter === 'payment' && normType !== 'payment_received' && normType !== 'payment_made') return false;
      if (typeFilter === 'adjustment' && info.category !== 'adjustment') return false;

      const cust = customerMap.get(t.customerId);
      const custName = cust ? cust.name.toLowerCase() : '';
      const note = t.note ? t.note.toLowerCase() : '';
      const ref = t.referenceNumber ? t.referenceNumber.toLowerCase() : '';
      const search = searchTerm.toLowerCase().trim();

      if (!search) return true;
      return custName.includes(search) || note.includes(search) || ref.includes(search);
    });
  }, [transactions, typeFilter, searchTerm, customerMap]);

  // Aggregate totals
  const totals = useMemo(() => {
    let cashReceived = 0;
    let cashPaid = 0;
    let creditSales = 0;
    let creditPurchases = 0;

    filteredTransactions.forEach((t) => {
      if (t.isReversed) return;
      const normType = normalizeTransactionType(t.type);

      if (normType === 'payment_received' || normType === 'advance_received') {
        cashReceived += t.amount;
      } else if (normType === 'payment_made' || normType === 'advance_paid') {
        cashPaid += t.amount;
      } else if (normType === 'credit_given') {
        creditSales += t.amount;
      } else if (normType === 'debt_incurred') {
        creditPurchases += t.amount;
      }
    });

    return { cashReceived, cashPaid, creditSales, creditPurchases };
  }, [filteredTransactions]);

  return (
    <AppContentContainer className="flex flex-col space-y-3.5 py-1.5 select-none">
      {/* 1. Header Summary Card */}
      <div className="bg-bk-surface border border-bk-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight">
              Transaction Activity Feed
            </h3>
            <p className="text-xs text-bk-text-tertiary">
              Complete chronological audit trail of all credit, debt, payments & settlements
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono font-bold text-xs bg-bk-surface-soft border border-bk-border p-2 sm:p-2.5 rounded-xl shrink-0">
            <div className="text-emerald-700 flex items-center gap-1" title="Actual cash received">
              <ArrowDownLeftIcon size={14} />
              <span>In: {formatIndianCurrency(totals.cashReceived)}</span>
            </div>
            <span className="text-bk-border font-light">|</span>
            <div className="text-rose-700 flex items-center gap-1" title="Actual cash paid out">
              <ArrowUpRightIcon size={14} />
              <span>Out: {formatIndianCurrency(totals.cashPaid)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bk-text-tertiary pointer-events-none">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, description, or ref #..."
            className="w-full h-10 pl-9 pr-8 border border-bk-border rounded-xl bg-white text-bk-text-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-bk-text-tertiary hover:text-bk-text-primary text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
          {([
            { id: 'all', label: `All (${transactions.length})` },
            { id: 'receive', label: 'Money Received' },
            { id: 'pay', label: 'Money Paid' },
            { id: 'credit', label: 'Credit Given / Taken' },
            { id: 'adjustment', label: 'Adjustments / Reversals' }
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTypeFilter(id as FeedFilterType);
              }}
              className={`h-8 px-3 rounded-xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === id
                  ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                  : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Transaction Items Feed */}
      <div className="space-y-2 select-text">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-bk-text-tertiary border border-dashed border-bk-border rounded-2xl bg-white">
            No transactions match the selected filters.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const customer = customerMap.get(tx.customerId);
            const normType = normalizeTransactionType(tx.type);
            const info = getTransactionTypeLabel(normType);
            const isCredit = normType === 'credit_given' || normType === 'debt_incurred';

            return (
              <div
                key={tx.id}
                onClick={() => {
                  if (customer) {
                    triggerHaptic('light');
                    onSelectCustomer(customer);
                  }
                }}
                className={`p-3.5 bg-white border border-bk-border rounded-2xl shadow-2xs hover:border-bk-brand-primary/40 transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                  tx.isReversed ? 'opacity-50 bg-zinc-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category Direction Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                    info.category === 'receive'
                      ? 'bg-red-50 border-red-100 text-rose-600'
                      : info.category === 'pay'
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      : 'bg-purple-50 border-purple-100 text-purple-600'
                  }`}>
                    {isCredit ? <ArrowUpRightIcon size={16} /> : <ArrowDownLeftIcon size={16} />}
                  </div>

                  {/* Customer & Transaction Meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-bk-text-primary group-hover:text-bk-brand-primary transition-colors truncate">
                        {customer?.name || 'Unknown Account'}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
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
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                          Reversed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-bk-text-secondary mt-0.5">
                      <span className="text-[11px] text-bk-text-tertiary">
                        {formatDisplayDate(tx.date)}
                      </span>
                      {tx.referenceNumber && (
                        <span className="font-mono text-[10px] text-bk-text-tertiary">
                          Ref: {tx.referenceNumber}
                        </span>
                      )}
                      {tx.note && (
                        <span className="text-[11px] text-bk-text-secondary truncate">
                          • {tx.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div className={`font-mono text-sm sm:text-base font-black tracking-tight ${
                    tx.isReversed
                      ? 'line-through text-zinc-400'
                      : isCredit
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}>
                    {isCredit ? '+' : '-'}{formatIndianCurrency(tx.amount)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppContentContainer>
  );
};
