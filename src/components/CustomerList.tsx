import React, { useState, useMemo } from 'react';
import { Customer, CustomerSummary, CustomerSortOption } from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { classifyDueDate } from '../domain/dateClassifier';
import { BahiKhataLogo } from './BahiKhataLogo';
import { AppContentContainer } from './AppContentContainer';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { CustomerCard } from './CustomerCard';
import { 
  SearchIcon, PlusIcon, ArrowUpRightIcon, ArrowDownLeftIcon 
} from './Icons';

interface CustomerListProps {
  customers: Customer[];
  summary: CustomerSummary;
  onSelectCustomer: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onPrepareReminder: (customer: Customer) => void;
  onOpenAddForm: () => void;
  onQuickTransaction: (customer: Customer, type: 'credit' | 'payment') => void;
}

type FilterStatus = 'all' | 'pending' | 'due_today' | 'overdue' | 'paid';

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  summary,
  onSelectCustomer,
  onEdit,
  onDelete,
  onPrepareReminder,
  onOpenAddForm,
  onQuickTransaction
}) => {
  const { defaultFilter, confirmDelete, triggerHaptic } = useDisplaySettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterStatus>(defaultFilter);
  const [sortOption, setSortOption] = useState<CustomerSortOption>('recent');

  const filteredAndSortedCustomers = useMemo(() => {
    // 1. Filter
    const filtered = customers.filter((c) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        (c.note && c.note.toLowerCase().includes(search));

      if (!matchesSearch) return false;

      // Status
      if (filter === 'all') return c.status !== 'archived';
      if (filter === 'paid') return c.amount <= 0 || c.status === 'paid';

      // For pending/due filters
      if (c.amount <= 0) return false;

      const dueStatus = classifyDueDate(c.dueDate);
      if (filter === 'pending') return true;
      if (filter === 'due_today') return dueStatus === 'due_today';
      if (filter === 'overdue') return dueStatus === 'overdue';

      return true;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortOption === 'recent') {
        const dateA = a.updatedAt || a.createdAt || '';
        const dateB = b.updatedAt || b.createdAt || '';
        return dateB.localeCompare(dateA);
      } else if (sortOption === 'balance_desc') {
        return b.amount - a.amount;
      } else if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'due_date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return 0;
    });
  }, [customers, searchTerm, filter, sortOption]);

  const handleDelete = (id: string, name: string) => {
    if (confirmDelete) {
      if (window.confirm(`Delete the ledger for "${name}"? This action cannot be undone.`)) {
        triggerHaptic('warning');
        onDelete(id);
      }
    } else {
      triggerHaptic('warning');
      onDelete(id);
    }
  };

  return (
    <AppContentContainer className="flex flex-col space-y-3 py-1">
      {/* 1. Financial Overview Hero (Wise + Apple discipline: Integrated, Compact) */}
      <div className="bg-bk-surface border border-bk-border rounded-2xl p-4 shadow-xs select-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">
              Total You Will Receive
            </span>
            <div className="mt-0.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-bk-status-overdue font-mono">
              {formatIndianCurrency(summary.totalPendingPaise)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-bk-text-tertiary">
              <span className="font-semibold text-bk-text-secondary">
                {summary.pendingCount} pending accounts
              </span>
              {summary.overdueCount > 0 && (
                <span className="text-bk-status-overdue font-bold">
                  • {summary.overdueCount} overdue
                </span>
              )}
            </div>
          </div>

          {/* Today's Cashflow Badge - Integrated Side-by-Side */}
          <div className="p-2 sm:p-2.5 bg-bk-surface-soft border border-bk-border rounded-xl text-xs space-y-0.5 shrink-0 text-right">
            <div className="text-[9px] font-bold text-bk-text-secondary uppercase tracking-wider">
              Today's Activity
            </div>
            <div className="flex items-center gap-2 font-mono font-bold text-xs pt-0.5">
              <span className="text-bk-status-overdue flex items-center gap-0.5" title="Credit Given Today">
                <ArrowUpRightIcon size={12} /> {formatIndianCurrency(summary.todayCreditPaise)}
              </span>
              <span className="text-bk-status-paid flex items-center gap-0.5" title="Payment Received Today">
                <ArrowDownLeftIcon size={12} /> {formatIndianCurrency(summary.todayPaymentPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Combined Search & Sort Toolbar - Single Line Efficiency */}
      <div className="flex gap-2 items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bk-text-tertiary pointer-events-none">
            <SearchIcon size={15} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, phone, or memo..."
            className="w-full h-10 pl-9 pr-7 border border-bk-border rounded-xl bg-white text-bk-text-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-bk-text-tertiary hover:text-bk-text-primary text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Compact Sort Selector */}
        <div className="shrink-0">
          <select
            value={sortOption}
            onChange={(e) => {
              triggerHaptic('light');
              setSortOption(e.target.value as CustomerSortOption);
            }}
            className="h-10 px-2.5 sm:px-3 border border-bk-border rounded-xl bg-white text-bk-text-secondary text-xs font-semibold focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="recent">Recent Activity</option>
            <option value="balance_desc">Highest Due</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="due_date">Due Date</option>
          </select>
        </div>
      </div>

      {/* 3. Filter Status Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none select-none">
        {(['all', 'pending', 'due_today', 'overdue', 'paid'] as const).map((f) => {
          const label =
            f === 'all'
              ? `All (${customers.length})`
              : f === 'pending'
              ? `Pending (${summary.pendingCount})`
              : f === 'due_today'
              ? `Due Today (${summary.dueTodayCount})`
              : f === 'overdue'
              ? `Overdue (${summary.overdueCount})`
              : `Settled (${summary.settledCount})`;

          const isActive = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setFilter(f);
              }}
              className={`h-7 px-3 rounded-full border text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                  : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 4. Customer Cards Grid */}
      <div className="pt-0.5">
        {filteredAndSortedCustomers.length === 0 ? (
          /* Professional Empty State */
          <div className="p-8 sm:p-12 border border-dashed border-bk-border rounded-2xl bg-white flex flex-col items-center justify-center text-center space-y-3">
            <div className="opacity-25 text-bk-brand-primary">
              <BahiKhataLogo size={52} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-bk-text-primary text-sm sm:text-base">
                {searchTerm || filter !== 'all' ? 'No matching customer accounts' : 'Your Khata ledger is empty'}
              </h4>
              <p className="text-xs text-bk-text-secondary max-w-sm leading-relaxed">
                {searchTerm || filter !== 'all'
                  ? 'Try modifying your search text or switching to another filter.'
                  : 'Add your first customer to record credit, track payments, and send WhatsApp reminders.'}
              </p>
            </div>
            {!(searchTerm || filter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('standard');
                  onOpenAddForm();
                }}
                className="mt-2 h-9 px-4 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <PlusIcon size={14} />
                <span>Add First Customer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {filteredAndSortedCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onSelect={onSelectCustomer}
                onEdit={onEdit}
                onDelete={handleDelete}
                onQuickTransaction={onQuickTransaction}
                onPrepareReminder={onPrepareReminder}
              />
            ))}
          </div>
        )}
      </div>
    </AppContentContainer>
  );
};
