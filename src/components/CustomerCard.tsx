import React from 'react';
import { Customer } from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { classifyDueDate, formatDaysDifference, formatDisplayDate } from '../domain/dateClassifier';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { 
  EditIcon, TrashIcon, WhatsAppIcon, 
  ArrowUpRightIcon, ArrowDownLeftIcon, 
  CalendarIcon, ClockIcon 
} from './Icons';

interface CustomerCardProps {
  customer: Customer;
  onSelect: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string, name: string) => void;
  onQuickTransaction: (customer: Customer, type: 'credit' | 'payment') => void;
  onPrepareReminder: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onSelect,
  onEdit,
  onDelete,
  onQuickTransaction,
  onPrepareReminder
}) => {
  const { triggerHaptic } = useDisplaySettings();

  const dueStatus = classifyDueDate(customer.dueDate);
  const relativeDueLabel = formatDaysDifference(customer.dueDate);

  const formattedPhone =
    customer.phone.startsWith('91') && customer.phone.length === 12
      ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
      : customer.phone;

  const isDue = customer.amount > 0;
  const isSettled = customer.amount === 0;

  // 2 uppercase initials
  const initials =
    customer.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'BK';

  return (
    <div
      onClick={() => {
        triggerHaptic('light');
        onSelect(customer);
      }}
      className="bg-bk-surface border border-bk-border hover:border-bk-brand-primary/40 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col justify-between gap-2.5 cursor-pointer group select-none"
    >
      {/* 1. Header: Avatar + Identity + Financial Balance */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-bk-surface-soft border border-bk-border text-bk-text-primary font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:border-bk-brand-primary/30 group-hover:bg-red-50/50 transition-colors">
            {initials}
          </div>

          {/* Name & Phone */}
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-bk-text-primary text-sm sm:text-base leading-snug truncate group-hover:text-bk-brand-primary transition-colors">
              {customer.name}
            </h4>
            <p className="text-xs font-mono text-bk-text-secondary truncate mt-0.5">
              {formattedPhone}
            </p>
          </div>
        </div>

        {/* Financial Information */}
        <div className="flex flex-col items-end shrink-0 pl-1">
          <span
            className={`font-mono text-base font-black tracking-tight leading-none ${
              isDue
                ? 'text-bk-status-overdue'
                : isSettled
                ? 'text-bk-status-paid'
                : 'text-blue-600'
            }`}
          >
            {formatIndianCurrency(customer.amount)}
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.2 rounded ${
              isDue
                ? 'bg-red-50 text-bk-status-overdue border border-red-100'
                : isSettled
                ? 'bg-emerald-50 text-bk-status-paid border border-emerald-100'
                : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}
          >
            {isDue ? 'Due' : isSettled ? 'Settled' : 'Advance'}
          </span>
        </div>
      </div>

      {/* 2. Additional Context: Due Date, Reminders & Note */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex flex-wrap items-center justify-between text-xs text-bk-text-secondary gap-1">
          {customer.dueDate ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              <CalendarIcon size={12} className="text-bk-text-tertiary shrink-0" />
              <span
                className={`font-bold ${
                  dueStatus === 'overdue'
                    ? 'text-bk-status-overdue'
                    : dueStatus === 'due_today'
                    ? 'text-amber-700'
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
              <ClockIcon size={11} className="shrink-0" />
              <span>Reminded {formatDisplayDate(customer.lastReminderSentAt)}</span>
            </div>
          )}
        </div>

        {customer.note && (
          <p className="text-xs text-bk-text-secondary bg-bk-surface-soft px-2.5 py-1 rounded-lg truncate border border-bk-border/60">
            {customer.note}
          </p>
        )}
      </div>

      {/* 3. Action Area: Standardized 2-Tier Structured Layout (Zero wrapping issues) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-t border-bk-border pt-2.5 mt-0.5 space-y-2 select-none"
      >
        {/* Tier 1: Primary Financial Actions (Symmetrical 50/50 Split) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onQuickTransaction(customer, 'credit');
            }}
            className="h-8.5 rounded-lg bg-red-50 hover:bg-red-100/90 active:bg-red-200 text-bk-status-overdue border border-red-200/90 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            title="Record Credit Given"
          >
            <ArrowUpRightIcon size={13} />
            <span>+ Gave Credit</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onQuickTransaction(customer, 'payment');
            }}
            className="h-8.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 active:bg-emerald-200 text-bk-status-paid border border-emerald-200/90 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            title="Record Payment Received"
          >
            <ArrowDownLeftIcon size={13} />
            <span>- Got Payment</span>
          </button>
        </div>

        {/* Tier 2: Secondary Utilities (Edit/Delete) on Left, WhatsApp Follow-Up on Right */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onEdit(customer);
              }}
              className="h-7 px-2.5 rounded-md border border-bk-border bg-white text-bk-text-secondary hover:text-bk-text-primary hover:bg-bk-surface-soft flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors"
              title="Edit Customer"
            >
              <EditIcon size={12} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('warning');
                onDelete(customer.id, customer.name);
              }}
              className="h-7 w-7 rounded-md border border-bk-border bg-white text-bk-text-tertiary hover:text-bk-status-overdue hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-[11px] cursor-pointer transition-colors"
              title="Delete Ledger"
            >
              <TrashIcon size={12} />
            </button>
          </div>

          {isDue ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('standard');
                onPrepareReminder(customer);
              }}
              className="h-7 px-3 rounded-md bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
              title="Send WhatsApp Reminder"
            >
              <WhatsAppIcon size={12} />
              <span>Send Reminder</span>
            </button>
          ) : (
            <span className="text-[10px] text-bk-status-paid font-bold flex items-center gap-1 px-1">
              ✓ Settled
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
