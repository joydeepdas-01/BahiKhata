import React, { useState, useMemo } from 'react';
import { Customer, CustomerSummary, CustomerSortOption } from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { classifyDueDate, formatDaysDifference, formatDisplayDate } from '../domain/dateClassifier';
import { BahiKhataLogo } from './BahiKhataLogo';
import { AppContentContainer } from './AppContentContainer';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { 
  SearchIcon, PlusIcon, EditIcon, TrashIcon, 
  WhatsAppIcon, ArrowUpRightIcon, ArrowDownLeftIcon,
  ClockIcon, CalendarIcon
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

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
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
    <AppContentContainer className="flex flex-col space-y-4 py-2">
      {/* Financial Overview Hero (Wise + Apple discipline) */}
      <div className="bg-bk-surface border border-bk-border rounded-2xl p-4 sm:p-5 shadow-xs select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider block">
              Total You Will Receive (Pending Dues)
            </span>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-bk-status-overdue font-mono">
              {formatIndianCurrency(summary.totalPendingPaise)}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-bk-text-tertiary">
              <span>{summary.pendingCount} pending accounts</span>
              {summary.overdueCount > 0 && (
                <span className="text-bk-status-overdue font-bold">
                  • {summary.overdueCount} overdue
                </span>
              )}
            </div>
          </div>

          {/* Today's Cashflow Badge */}
          <div className="p-3 bg-bk-surface-soft border border-bk-border rounded-xl text-xs space-y-1 shrink-0">
            <div className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider">
              Today's Activity
            </div>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-bk-status-overdue flex items-center gap-0.5">
                <ArrowUpRightIcon size={13} /> {formatIndianCurrency(summary.todayCreditPaise)}
              </span>
              <span className="text-bk-status-paid flex items-center gap-0.5">
                <ArrowDownLeftIcon size={13} /> {formatIndianCurrency(summary.todayPaymentPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-bk-text-tertiary pointer-events-none">
            <SearchIcon size={17} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, phone, or memo..."
            className="w-full pl-10 pr-4 py-2 border border-bk-border rounded-xl bg-white text-bk-text-primary text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary shadow-2xs"
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

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sortOption}
            onChange={(e) => {
              triggerHaptic('light');
              setSortOption(e.target.value as CustomerSortOption);
            }}
            className="px-3 py-2 border border-bk-border rounded-xl bg-white text-bk-text-secondary text-xs font-semibold focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="recent">Sort: Recent Activity</option>
            <option value="balance_desc">Sort: Highest Balance</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="due_date">Sort: Due Date</option>
          </select>
        </div>
      </div>

      {/* Filter Status Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
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
              onClick={() => {
                triggerHaptic('light');
                setFilter(f);
              }}
              className={`px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
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

      {/* Customer List Cards Section */}
      <div className="pt-1">
        {filteredAndSortedCustomers.length === 0 ? (
          /* Empty State */
          <div className="p-8 sm:p-12 border border-dashed border-bk-border rounded-2xl bg-white flex flex-col items-center justify-center text-center space-y-3">
            <div className="opacity-25 text-bk-brand-primary">
              <BahiKhataLogo size={60} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-bk-text-primary text-base sm:text-lg">
                {searchTerm || filter !== 'all' ? 'No matching customer accounts' : 'Your Khata ledger is empty'}
              </h4>
              <p className="text-xs sm:text-sm text-bk-text-secondary max-w-sm leading-relaxed">
                {searchTerm || filter !== 'all'
                  ? 'Try modifying your search text or switching the filter above.'
                  : 'Add your first customer to begin recording credit, tracking payments, and sending WhatsApp reminders.'}
              </p>
            </div>
            {!(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  triggerHaptic('standard');
                  onOpenAddForm();
                }}
                className="mt-2 px-5 py-2.5 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <PlusIcon size={16} />
                <span>Add First Customer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAndSortedCustomers.map((customer) => {
              const dueStatus = classifyDueDate(customer.dueDate);
              const relativeDueLabel = formatDaysDifference(customer.dueDate);

              const formattedPhone =
                customer.phone.startsWith('91') && customer.phone.length === 12
                  ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
                  : customer.phone;

              const isDue = customer.amount > 0;
              const isSettled = customer.amount === 0;

              return (
                <div
                  key={customer.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectCustomer(customer);
                  }}
                  className="bg-bk-surface border border-bk-border hover:border-bk-brand-primary/40 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col justify-between space-y-3 cursor-pointer group"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-bk-surface-soft border border-bk-border text-bk-text-primary font-bold text-sm flex items-center justify-center shrink-0 group-hover:border-bk-brand-primary/30 transition-colors">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-bk-text-primary text-sm sm:text-base leading-tight group-hover:text-bk-brand-primary transition-colors">
                          {customer.name}
                        </h4>
                        <p className="text-xs font-mono text-bk-text-secondary mt-0.5">{formattedPhone}</p>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`font-mono text-base font-black ${
                          isDue ? 'text-bk-status-overdue' : isSettled ? 'text-bk-status-paid' : 'text-blue-600'
                        }`}
                      >
                        {formatIndianCurrency(customer.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-bk-text-tertiary uppercase tracking-wider">
                        {isDue ? 'Due' : isSettled ? 'Settled' : 'Advance'}
                      </span>
                    </div>
                  </div>

                  {/* Due Date & Memo */}
                  <div className="flex items-center justify-between text-xs text-bk-text-secondary pt-0.5">
                    {customer.dueDate ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <CalendarIcon size={13} className="text-bk-text-tertiary" />
                        <span
                          className={`font-bold ${
                            dueStatus === 'overdue'
                              ? 'text-bk-status-overdue'
                              : dueStatus === 'due_today'
                              ? 'text-bk-status-pending'
                              : 'text-bk-text-secondary'
                          }`}
                        >
                          {relativeDueLabel} ({formatDisplayDate(customer.dueDate)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-bk-text-tertiary">No due date set</span>
                    )}

                    {customer.lastReminderSentAt && (
                      <div className="flex items-center gap-1 text-[10px] text-bk-text-tertiary">
                        <ClockIcon size={12} />
                        <span>Reminded {formatDisplayDate(customer.lastReminderSentAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Note preview if any */}
                  {customer.note && (
                    <p className="text-xs text-bk-text-secondary bg-bk-surface-soft px-3 py-1.5 rounded-lg truncate border border-bk-border/60">
                      {customer.note}
                    </p>
                  )}

                  {/* Quick Action Toolbar */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between border-t border-bk-border pt-2.5 mt-1 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          onEdit(customer);
                        }}
                        className="p-1.5 text-bk-text-tertiary hover:text-bk-text-primary rounded-lg hover:bg-bk-surface-soft cursor-pointer transition-colors"
                        title="Edit Customer"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, customer.id, customer.name)}
                        className="p-1.5 text-bk-text-tertiary hover:text-bk-status-overdue rounded-lg hover:bg-bk-status-overdue/10 cursor-pointer transition-colors"
                        title="Delete Ledger"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>

                    {/* Transaction & Reminder Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          onQuickTransaction(customer, 'credit');
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-bk-status-overdue border border-red-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        title="Give Credit"
                      >
                        <ArrowUpRightIcon size={13} />
                        <span>+ Credit</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          onQuickTransaction(customer, 'payment');
                        }}
                        className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-bk-status-paid border border-green-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        title="Receive Payment"
                      >
                        <ArrowDownLeftIcon size={13} />
                        <span>- Payment</span>
                      </button>

                      {isDue && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('standard');
                            onPrepareReminder(customer);
                          }}
                          className="px-2.5 py-1.5 bg-bk-brand-primary hover:bg-bk-brand-primary-hover text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                          title="Send WhatsApp Reminder"
                        >
                          <WhatsAppIcon size={13} />
                          <span>Remind</span>
                        </button>
                      )}
                    </div>
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
