import React, { useState, useMemo } from 'react';
import { Customer, CustomerSummary } from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { classifyDueDate, formatDaysDifference, formatDisplayDate } from '../domain/dateClassifier';
import { BahiKhataLogo } from './BahiKhataLogo';
import { AppContentContainer } from './AppContentContainer';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { 
  SearchIcon, PlusIcon, EditIcon, TrashIcon, 
  CheckIcon, WhatsAppIcon 
} from './Icons';

interface CustomerListProps {
  customers: Customer[];
  summary: CustomerSummary;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onPrepareReminder: (customer: Customer) => void;
  onOpenAddForm: () => void;
  onOpenSettings: () => void;
}

type FilterStatus = 'all' | 'pending' | 'due_today' | 'overdue' | 'paid';

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  summary,
  onEdit,
  onDelete,
  onMarkPaid,
  onPrepareReminder,
  onOpenAddForm
}) => {
  const { defaultFilter, confirmDelete, triggerHaptic } = useDisplaySettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterStatus>(defaultFilter);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // 1. Search filter
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);

      if (!matchesSearch) return false;

      // 2. Status filter
      if (filter === 'all') return c.status !== 'archived';
      if (filter === 'paid') return c.status === 'paid';
      
      // If filtering by pending/due, only show pending ones
      if (c.status !== 'pending') return false;
      
      const dueStatus = classifyDueDate(c.dueDate);
      if (filter === 'pending') return true;
      if (filter === 'due_today') return dueStatus === 'due_today';
      if (filter === 'overdue') return dueStatus === 'overdue';
      
      return true;
    });
  }, [customers, searchTerm, filter]);

  const handleDeleteClick = (id: string) => {
    if (confirmDelete) {
      if (window.confirm('Delete this customer ledger entry?')) {
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
      
      {/* KPI / Dashboard Stat Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 select-none">
        
        {/* Total Outstanding */}
        <div 
          className="bg-bk-surface border border-bk-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between"
          style={{ padding: 'var(--ui-card-padding)' }}
        >
          <span className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--app-label-scale)' }}>
            Total Outstanding
          </span>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-bk-text-primary font-tabular-nums" style={{ fontSize: 'var(--app-kpi-scale)' }}>
            {formatIndianCurrency(summary.totalPendingPaise)}
          </div>
          <span className="text-bk-text-tertiary font-medium mt-1" style={{ fontSize: 'var(--app-helper-scale)' }}>
            Pending collection
          </span>
        </div>

        {/* Overdue Dues */}
        <div 
          className="bg-bk-surface border border-bk-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between"
          style={{ padding: 'var(--ui-card-padding)' }}
        >
          <span className="font-bold text-bk-status-overdue uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--app-label-scale)' }}>
            Overdue Dues
          </span>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-bk-status-overdue font-tabular-nums" style={{ fontSize: 'var(--app-kpi-scale)' }}>
            {summary.overdueCount} {summary.overdueCount === 1 ? 'account' : 'accounts'}
          </div>
          <span className="text-bk-status-overdue/80 font-medium mt-1" style={{ fontSize: 'var(--app-helper-scale)' }}>
            Immediate follow-up
          </span>
        </div>

        {/* Due Today */}
        <div 
          className="bg-bk-surface border border-bk-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between"
          style={{ padding: 'var(--ui-card-padding)' }}
        >
          <span className="font-bold text-bk-status-pending uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--app-label-scale)' }}>
            Due Today
          </span>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-bk-status-pending font-tabular-nums" style={{ fontSize: 'var(--app-kpi-scale)' }}>
            {summary.dueTodayCount} {summary.dueTodayCount === 1 ? 'account' : 'accounts'}
          </div>
          <span className="text-bk-status-pending/80 font-medium mt-1" style={{ fontSize: 'var(--app-helper-scale)' }}>
            Scheduled today
          </span>
        </div>

        {/* Active Ledgers */}
        <div 
          className="bg-bk-surface border border-bk-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between"
          style={{ padding: 'var(--ui-card-padding)' }}
        >
          <span className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--app-label-scale)' }}>
            Active Ledgers
          </span>
          <div className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-bk-brand-secondary font-tabular-nums" style={{ fontSize: 'var(--app-kpi-scale)' }}>
            {summary.pendingCount} <span className="text-xs font-normal text-bk-text-tertiary">/ {summary.totalCustomersCount} total</span>
          </div>
          <span className="text-bk-text-tertiary font-medium mt-1" style={{ fontSize: 'var(--app-helper-scale)' }}>
            Tracked customers
          </span>
        </div>

      </div>

      {/* Action & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-bk-text-tertiary pointer-events-none">
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name or mobile number..."
            style={{ height: 'var(--ui-control-height)', fontSize: 'var(--app-input-scale)' }}
            className="w-full pl-10 pr-4 border border-bk-border rounded-xl bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-none select-none">
          {(['all', 'pending', 'due_today', 'overdue', 'paid'] as const).map(f => {
            const label = f === 'all' ? 'All' : f === 'pending' ? 'Pending' : f === 'due_today' ? 'Due Today' : f === 'overdue' ? 'Overdue' : 'Paid';
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  triggerHaptic('light');
                  setFilter(f);
                }}
                style={{ height: '36px' }}
                className={`px-3.5 rounded-full border font-semibold whitespace-nowrap cursor-pointer transition-all duration-150 flex items-center justify-center ${
                  isActive 
                    ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-xs' 
                    : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                }`}
              >
                <span style={{ fontSize: 'var(--app-label-scale)' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Cards & Empty State Section */}
      <div className="pt-1">
        {filteredCustomers.length === 0 ? (
          /* Brand-aligned empty state (Notion-style) */
          <div className="p-6 sm:p-10 border border-dashed border-bk-border rounded-2xl bg-white flex flex-col items-center justify-center text-center space-y-3">
            <div className="opacity-20 text-bk-brand-primary">
              <BahiKhataLogo size={64} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-bk-text-primary" style={{ fontSize: 'var(--app-heading-scale)' }}>Your khata ledger is empty</h4>
              <p className="text-bk-text-secondary max-w-sm leading-relaxed" style={{ fontSize: 'var(--app-body-font-size)' }}>
                {searchTerm || filter !== 'all' 
                  ? 'No matching customer accounts found. Try adjusting your search query or filter selection.' 
                  : 'Add your first customer account to start tracking credit dues, payment statuses, and reminders.'}
              </p>
            </div>
            {!(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  triggerHaptic('standard');
                  onOpenAddForm();
                }}
                style={{ height: 'var(--ui-button-height)', fontSize: 'var(--app-input-scale)' }}
                className="px-5 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white font-semibold rounded-xl transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-sm active:translate-y-[1px]"
              >
                <PlusIcon size={16} />
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredCustomers.map(customer => {
              const dueStatus = classifyDueDate(customer.dueDate);
              const relativeDueLabel = formatDaysDifference(customer.dueDate);
              
              let statusPillClass = '';
              if (customer.status === 'paid') {
                statusPillClass = 'bg-bk-status-paid/10 text-bk-status-paid border-bk-status-paid/20';
              } else if (dueStatus === 'overdue') {
                statusPillClass = 'bg-bk-status-overdue/10 text-bk-status-overdue border-bk-status-overdue/20';
              } else if (dueStatus === 'due_today') {
                statusPillClass = 'bg-bk-status-pending/10 text-bk-status-pending border-bk-status-pending/20';
              } else {
                statusPillClass = 'bg-bk-brand-secondary/10 text-bk-brand-secondary border-bk-brand-secondary/20';
              }

              const formattedPhone = customer.phone.startsWith('91') && customer.phone.length === 12
                ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
                : customer.phone;

              return (
                <div 
                  key={customer.id} 
                  className="bg-bk-surface border border-bk-border rounded-xl shadow-xs hover:border-bk-brand-primary/30 hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-3"
                  style={{ padding: 'var(--ui-card-padding)' }}
                >
                  {/* Card Top Details */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-bk-text-primary tracking-tight leading-tight" style={{ fontSize: 'var(--app-heading-scale)' }}>{customer.name}</h4>
                      <p className="text-bk-text-secondary font-medium" style={{ fontSize: 'var(--app-helper-scale)' }}>{formattedPhone}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-black text-bk-text-primary font-tabular-nums leading-none" style={{ fontSize: 'var(--app-heading-scale)' }}>
                        {formatIndianCurrency(customer.amount)}
                      </span>
                      {customer.dueDate && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider select-none ${statusPillClass}`}>
                          {customer.status === 'paid' ? 'Paid' : relativeDueLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Ledger Notes */}
                  {customer.note && (
                    <p className="text-bk-text-secondary bg-bk-surface-soft p-3 rounded-lg border border-bk-border italic leading-relaxed" style={{ fontSize: 'var(--app-body-font-size)' }}>
                      "{customer.note}"
                    </p>
                  )}

                  {/* Card Action Buttons Bar */}
                  <div className="flex justify-between items-center gap-2 border-t border-bk-border pt-3 mt-1 select-none">
                    <div className="text-[10px] text-bk-text-tertiary">
                      {customer.lastReminderSentAt ? (
                        <span>Reminded: {formatDisplayDate(customer.lastReminderSentAt)}</span>
                      ) : (
                        <span>No reminder sent</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          onEdit(customer);
                        }}
                        className="p-2 rounded-lg border border-bk-border text-bk-text-tertiary hover:text-bk-text-primary hover:bg-bk-surface-soft cursor-pointer transition-colors"
                        title="Edit Customer"
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(customer.id)}
                        className="p-2 rounded-lg border border-bk-border text-bk-text-tertiary hover:text-bk-status-overdue hover:bg-bk-status-overdue/5 cursor-pointer transition-colors"
                        title="Delete Ledger"
                      >
                        <TrashIcon size={14} />
                      </button>
                      
                      {customer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              triggerHaptic('success');
                              onMarkPaid(customer.id);
                            }}
                            className="px-3 h-9 bg-white border border-bk-status-paid/30 hover:bg-bk-status-paid/5 text-bk-status-paid text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <CheckIcon size={14} />
                            Paid
                          </button>
                          <button
                            onClick={() => {
                              triggerHaptic('standard');
                              onPrepareReminder(customer);
                            }}
                            className="px-3 h-9 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:translate-y-[1px]"
                          >
                            <WhatsAppIcon size={14} />
                            Remind
                          </button>
                        </>
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
