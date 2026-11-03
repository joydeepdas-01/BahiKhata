import React, { useState, useMemo } from 'react';
import { Customer } from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { classifyDueDate, formatDaysDifference, formatDisplayDate } from '../domain/dateClassifier';
import { AppContentContainer } from './AppContentContainer';
import { WhatsAppIcon, ClockIcon } from './Icons';
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
    <AppContentContainer className="flex flex-col space-y-4 py-2">
      {/* Overview Banner */}
      <div className="bg-bk-surface border border-bk-border rounded-2xl p-4 sm:p-5 shadow-xs select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight">
              Payment Follow-Up Queue
            </h3>
            <p className="text-xs text-bk-text-tertiary">
              Accounts requiring reminder notices ordered by urgency
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">
              Total In Queue
            </span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-bk-status-overdue">
              {formatIndianCurrency(totalDueInQueue)}
            </div>
            <span className="text-[11px] text-bk-text-tertiary">
              {filteredQueue.length} {filteredQueue.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 select-none">
        <button
          onClick={() => {
            triggerHaptic('light');
            setFilter('all');
          }}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-bk-brand-primary text-white border-bk-brand-primary'
              : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
          }`}
        >
          All Pending ({pendingCustomers.length})
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setFilter('overdue');
          }}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            filter === 'overdue'
              ? 'bg-bk-status-overdue text-white border-bk-status-overdue'
              : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
          }`}
        >
          Overdue Only
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setFilter('due_today');
          }}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            filter === 'due_today'
              ? 'bg-bk-status-pending text-white border-bk-status-pending'
              : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
          }`}
        >
          Due Today
        </button>
      </div>

      {/* Queue List */}
      <div className="pt-1">
        {filteredQueue.length === 0 ? (
          <div className="p-8 border border-dashed border-bk-border rounded-2xl bg-white text-center space-y-2">
            <WhatsAppIcon size={40} className="mx-auto text-bk-status-paid opacity-40" />
            <h4 className="font-bold text-bk-text-primary text-sm">No follow-ups needed!</h4>
            <p className="text-xs text-bk-text-secondary max-w-sm mx-auto">
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

              return (
                <div
                  key={customer.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectCustomer(customer);
                  }}
                  className="p-4 bg-white border border-bk-border hover:border-bk-brand-primary/40 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bk-surface-soft border border-bk-border text-bk-text-primary font-bold text-sm flex items-center justify-center shrink-0">
                      {customer.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-bk-text-primary">
                          {customer.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            dueStatus === 'overdue'
                              ? 'bg-bk-status-overdue/10 text-bk-status-overdue border-bk-status-overdue/20'
                              : dueStatus === 'due_today'
                              ? 'bg-bk-status-pending/10 text-bk-status-pending border-bk-status-pending/20'
                              : 'bg-bk-surface-soft text-bk-text-secondary border-bk-border'
                          }`}
                        >
                          {relativeDueLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-bk-text-secondary mt-0.5">
                        <span className="font-mono">{formattedPhone}</span>
                        {customer.dueDate && (
                          <span className="text-[11px] text-bk-text-tertiary">
                            • Due: {formatDisplayDate(customer.dueDate)}
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
                      <div className="font-mono text-base font-extrabold text-bk-status-overdue">
                        {formatIndianCurrency(customer.amount)}
                      </div>
                      <span className="text-[10px] text-bk-text-tertiary uppercase">Pending Due</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('standard');
                        onPrepareReminder(customer);
                      }}
                      className="px-4 py-2 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <WhatsAppIcon size={14} />
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
