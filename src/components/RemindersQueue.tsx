import React, { useState, useMemo } from 'react';
import { Customer } from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { classifyDueDate, formatDaysDifference, formatDisplayDate } from '../domain/dateClassifier';
import { AppContentContainer } from './AppContentContainer';
import { WhatsAppIcon, ClockIcon, CalendarIcon } from './Icons';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface RemindersQueueProps {
  customers: Customer[];
  onPrepareReminder: (customer: Customer) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const RemindersQueue: React.FC<RemindersQueueProps> = ({
  customers,
  onPrepareReminder,
  onSelectCustomer
}) => {
  const { triggerHaptic } = useDisplaySettings();
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_today'>('all');

  // Filter only customers who actually owe money
  const pendingCustomers = useMemo(() => {
    return customers
      .filter((c) => c.amount > 0 && c.status !== 'archived')
      .sort((a, b) => {
        // Priority: Overdue first, then Due Today, then others
        const statusA = classifyDueDate(a.dueDate);
        const statusB = classifyDueDate(b.dueDate);

        const score = (s: string) => (s === 'overdue' ? 3 : s === 'due_today' ? 2 : 1);
        const diff = score(statusB) - score(statusA);
        if (diff !== 0) return diff;

        // If same category, highest due amount first
        return b.amount - a.amount;
      });
  }, [customers]);

  const filteredQueue = useMemo(() => {
    if (filter === 'all') return pendingCustomers;
    return pendingCustomers.filter((c) => {
      const s = classifyDueDate(c.dueDate);
      if (filter === 'overdue') return s === 'overdue';
      if (filter === 'due_today') return s === 'due_today';
      return true;
    });
  }, [pendingCustomers, filter]);

  const totalDueInQueue = useMemo(() => {
    return filteredQueue.reduce((acc, c) => acc + c.amount, 0);
  }, [filteredQueue]);

  return (
    <AppContentContainer className="flex flex-col space-y-3.5 py-1.5 select-none">
      {/* 1. Compact Overview Banner */}
      <div className="bg-bk-surface border border-bk-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight">
              Payment Follow-Up Queue
            </h3>
            <p className="text-xs text-bk-text-tertiary">
              Accounts requiring reminder notices ordered by urgency
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">
                Total In Queue
              </span>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-bk-status-overdue leading-tight">
                {formatIndianCurrency(totalDueInQueue)}
              </div>
              <span className="text-[11px] text-bk-text-tertiary">
                {filteredQueue.length} {filteredQueue.length === 1 ? 'account' : 'accounts'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Standardized Filter Chips */}
      <div className="flex gap-1.5 select-none overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilter('all');
          }}
          className={`h-7 px-3.5 rounded-full border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filter === 'all'
              ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
              : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
          }`}
        >
          All Pending ({pendingCustomers.length})
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilter('overdue');
          }}
          className={`h-7 px-3.5 rounded-full border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filter === 'overdue'
              ? 'bg-bk-status-overdue text-white border-bk-status-overdue shadow-2xs'
              : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
          }`}
        >
          Overdue Only
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setFilter('due_today');
          }}
          className={`h-7 px-3.5 rounded-full border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filter === 'due_today'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
          }`}
        >
          Due Today
        </button>
      </div>

      {/* 3. Queue List */}
      <div className="pt-0.5">
        {filteredQueue.length === 0 ? (
          <div className="p-8 sm:p-12 border border-dashed border-bk-border rounded-2xl bg-white text-center space-y-2">
            <WhatsAppIcon size={40} className="mx-auto text-bk-status-paid opacity-40" />
            <h4 className="font-bold text-bk-text-primary text-sm sm:text-base">No follow-ups needed!</h4>
            <p className="text-xs text-bk-text-secondary max-w-sm mx-auto leading-relaxed">
              All customer dues in this category have either been settled or no dues match the selected filter.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 select-text">
            {filteredQueue.map((customer) => {
              const dueStatus = classifyDueDate(customer.dueDate);
              const relativeDueLabel = formatDaysDifference(customer.dueDate);

              const formattedPhone =
                customer.phone.startsWith('91') && customer.phone.length === 12
                  ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
                  : customer.phone;

              const initials = customer.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'BK';

              return (
                <div
                  key={customer.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectCustomer(customer);
                  }}
                  className="p-3.5 sm:p-4 bg-white border border-bk-border hover:border-bk-brand-primary/40 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-bk-surface-soft border border-bk-border text-bk-text-primary font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:border-bk-brand-primary/30 transition-colors">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-bk-text-primary truncate group-hover:text-bk-brand-primary transition-colors">
                          {customer.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                            dueStatus === 'overdue'
                              ? 'bg-red-50 text-bk-status-overdue border-red-200'
                              : dueStatus === 'due_today'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-bk-surface-soft text-bk-text-secondary border-bk-border'
                          }`}
                        >
                          {relativeDueLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-bk-text-secondary mt-0.5 truncate">
                        <span className="font-mono text-xs">{formattedPhone}</span>
                        {customer.dueDate && (
                          <span className="text-[11px] text-bk-text-tertiary flex items-center gap-1">
                            <CalendarIcon size={11} />
                            Due: {formatDisplayDate(customer.dueDate)}
                          </span>
                        )}
                      </div>

                      {customer.lastReminderSentAt && (
                        <div className="text-[10px] text-bk-text-tertiary flex items-center gap-1 mt-0.5">
                          <ClockIcon size={11} />
                          <span>Last reminded: {formatDisplayDate(customer.lastReminderSentAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-bk-border">
                    <div className="text-left sm:text-right">
                      <div className="font-mono text-sm sm:text-base font-extrabold text-bk-status-overdue">
                        {formatIndianCurrency(customer.amount)}
                      </div>
                      <span className="text-[9px] text-bk-text-tertiary uppercase tracking-wider block">
                        Pending Due
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('standard');
                        onPrepareReminder(customer);
                      }}
                      className="h-8 px-3 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <WhatsAppIcon size={13} />
                      <span>Send Reminder</span>
                    </button>
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
