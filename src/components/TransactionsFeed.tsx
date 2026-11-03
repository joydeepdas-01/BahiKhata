import React, { useState, useMemo } from 'react';
import { Transaction, Customer } from '../domain/customer';
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

export const TransactionsFeed: React.FC<TransactionsFeedProps> = ({
  transactions,
  customers,
  onSelectCustomer
}) => {
  const { triggerHaptic } = useDisplaySettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'payment'>('all');

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      const cust = customerMap.get(t.customerId);
      const custName = cust ? cust.name.toLowerCase() : '';
      const note = t.note ? t.note.toLowerCase() : '';
      const search = searchTerm.toLowerCase().trim();

      if (!search) return true;
      return custName.includes(search) || note.includes(search);
    });
  }, [transactions, typeFilter, searchTerm, customerMap]);

  // Calculate totals for filtered list
  const totals = useMemo(() => {
    let credit = 0;
    let payment = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'credit') credit += t.amount;
      else if (t.type === 'payment') payment += t.amount;
    });
    return { credit, payment };
  }, [filteredTransactions]);

  return (
    <AppContentContainer className="flex flex-col space-y-4 py-2">
      {/* Header Summary */}
      <div className="bg-bk-surface border border-bk-border rounded-2xl p-4 sm:p-5 shadow-xs select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight">
              Transaction Activity Feed
            </h3>
            <p className="text-xs text-bk-text-tertiary">
              Complete chronological audit trail of all credit and payments recorded
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono font-bold text-xs bg-bk-surface-soft border border-bk-border p-2.5 rounded-xl shrink-0">
            <div className="text-bk-status-overdue flex items-center gap-1">
              <ArrowUpRightIcon size={14} />
              <span>Gave: {formatIndianCurrency(totals.credit)}</span>
            </div>
            <span className="text-bk-border">|</span>
            <div className="text-bk-status-paid flex items-center gap-1">
              <ArrowDownLeftIcon size={14} />
              <span>Got: {formatIndianCurrency(totals.payment)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-bk-text-tertiary pointer-events-none">
            <SearchIcon size={17} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions by customer name or item note..."
            className="w-full pl-10 pr-4 py-2 border border-bk-border rounded-xl bg-white text-bk-text-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary shadow-2xs"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex gap-1.5 shrink-0 select-none">
          <button
            onClick={() => {
              triggerHaptic('light');
              setTypeFilter('all');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-bk-brand-primary text-white border-bk-brand-primary'
                : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
            }`}
          >
            All Entries
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setTypeFilter('credit');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'credit'
                ? 'bg-bk-status-overdue text-white border-bk-status-overdue'
                : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
            }`}
          >
            Credit (+ Udhaar)
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setTypeFilter('payment');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'payment'
                ? 'bg-bk-status-paid text-white border-bk-status-paid'
                : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
            }`}
          >
            Payment (- Jama)
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="pt-1">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 border border-dashed border-bk-border rounded-2xl bg-white text-center space-y-2">
            <ClockIcon size={40} className="mx-auto text-bk-text-tertiary opacity-30" />
            <h4 className="font-bold text-bk-text-primary text-sm">No transaction entries found</h4>
            <p className="text-xs text-bk-text-secondary max-w-sm mx-auto">
              Transactions recorded from customer ledger cards will appear here in chronological order.
            </p>
          </div>
        ) : (
          <div className="space-y-2 select-text">
            {filteredTransactions.map((t) => {
              const cust = customerMap.get(t.customerId);
              const isCredit = t.type === 'credit';

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (cust) {
                      triggerHaptic('light');
                      onSelectCustomer(cust);
                    }
                  }}
                  className="p-3.5 bg-white border border-bk-border hover:border-bk-brand-primary/40 rounded-xl shadow-2xs flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-red-50 text-bk-status-overdue'
                          : 'bg-green-50 text-bk-status-paid'
                      }`}
                    >
                      {isCredit ? <ArrowUpRightIcon size={18} /> : <ArrowDownLeftIcon size={18} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-bk-text-primary">
                          {cust ? cust.name : 'Unknown Customer'}
                        </span>
                        <span className="text-[10px] text-bk-text-tertiary font-mono">
                          {formatDisplayDate(t.date)}
                        </span>
                      </div>
                      <p className="text-xs text-bk-text-secondary mt-0.5">
                        {t.note || (isCredit ? 'Credit given' : 'Payment received')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className={`font-mono text-sm sm:text-base font-extrabold ${
                        isCredit ? 'text-bk-status-overdue' : 'text-bk-status-paid'
                      }`}
                    >
                      {isCredit ? '+' : '-'} {formatIndianCurrency(t.amount)}
                    </span>
                    <span className="text-[10px] text-bk-text-tertiary uppercase">
                      {isCredit ? 'Credit' : 'Payment'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppContentContainer>
  );
};

