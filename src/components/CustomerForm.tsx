import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import { Customer } from '../domain/customer';
import { normalizePhone } from '../domain/phoneNormalizer';
import { rupeesToPaise, paiseToRupees } from '../domain/amountFormatter';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Omit<Customer, 'id' | 'status'>) => Promise<void>;
  onUpdate?: (customer: Customer) => Promise<void>;
  editingCustomer?: Customer | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingCustomer
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone.replace('+91', ''));
      setAmount(String(paiseToRupees(editingCustomer.amount)));
      setDueDate(editingCustomer.dueDate || '');
      setNote(editingCustomer.note || '');
    } else {
      setName('');
      setPhone('');
      setAmount('');
      setDueDate('');
      setNote('');
    }
    setErrors({});
    setIsSubmitting(false);
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    const phoneResult = normalizePhone(phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error || 'Invalid Indian mobile number';
    }

    const numericAmount = parseFloat(amount);
    if (!amount.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Valid positive credit amount required';
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate);
      if (isNaN(selectedDate.getTime())) {
        newErrors.dueDate = 'Invalid due date format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    const phoneResult = normalizePhone(phone);
    const amountInPaise = rupeesToPaise(amount);

    setIsSubmitting(true);

    try {
      if (editingCustomer && onUpdate) {
        await onUpdate({
          ...editingCustomer,
          name: name.trim(),
          phone: phoneResult.normalized!,
          amount: amountInPaise,
          dueDate: dueDate || null,
          note: note.trim()
        });
      } else {
        await onSubmit({
          name: name.trim(),
          phone: phoneResult.normalized!,
          amount: amountInPaise,
          dueDate: dueDate || null,
          note: note.trim()
        });
      }
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save customer account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bk-text-primary/40 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Mobile-First Responsive Sheet Container */}
      <form 
        onSubmit={handleSubmit}
        className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up sm:animate-fade-in"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft shrink-0">
          <h2 className="font-extrabold text-bk-text-primary" style={{ fontSize: 'var(--text-font-size-heading)' }}>
            {editingCustomer ? 'Edit Customer Ledger' : 'Create Customer Account'}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bk-border transition-colors text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div 
          className="flex-1 overflow-y-auto min-h-0 p-4 select-text flex flex-col"
          style={{ gap: 'var(--ui-field-gap)' }}
        >
          {errors.form && (
            <div className="p-3 bg-bk-status-overdue/10 border border-bk-status-overdue/30 text-bk-status-overdue rounded-bk-md text-xs font-semibold">
              {errors.form}
            </div>
          )}

          {/* Customer Name */}
          <div className="flex flex-col space-y-1">
            <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
              Customer Name <span className="text-bk-status-overdue">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
              className={`w-full px-3.5 border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary ${
                errors.name ? 'border-bk-status-overdue' : 'border-bk-border'
              }`}
            />
            {errors.name && <p className="text-bk-status-overdue font-semibold mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>{errors.name}</p>}
          </div>

          {/* WhatsApp Phone Number Input Group */}
          <div className="flex flex-col space-y-1">
            <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
              WhatsApp Mobile Number <span className="text-bk-status-overdue">*</span>
            </label>
            <div className="relative flex w-full max-w-full">
              <span 
                style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderTopLeftRadius: 'var(--ui-border-radius)', borderBottomLeftRadius: 'var(--ui-border-radius)' }}
                className="px-3.5 border border-r-0 border-bk-border bg-bk-surface-soft flex items-center text-bk-text-secondary font-semibold select-none shrink-0"
              >
                +91
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderTopRightRadius: 'var(--ui-border-radius)', borderBottomRightRadius: 'var(--ui-border-radius)' }}
                className={`flex-1 min-w-0 w-full px-3.5 border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary ${
                  errors.phone ? 'border-bk-status-overdue' : 'border-bk-border'
                }`}
              />
            </div>
            <p className="text-bk-text-tertiary leading-none mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>Indian numbers start with 6, 7, 8, or 9</p>
            {errors.phone && <p className="text-bk-status-overdue font-semibold mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>{errors.phone}</p>}
          </div>

          {/* Credit Amount */}
          <div className="flex flex-col space-y-1">
            <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
              Credit Amount (₹) <span className="text-bk-status-overdue">*</span>
            </label>
            <div className="relative w-full">
              <span 
                style={{ fontSize: 'var(--text-font-size-input)' }}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-bk-text-secondary font-bold pointer-events-none select-none"
              >
                ₹
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1250.00"
                style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
                className={`w-full pl-8 pr-3.5 border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary font-tabular-nums ${
                  errors.amount ? 'border-bk-status-overdue' : 'border-bk-border'
                }`}
              />
            </div>
            {errors.amount && <p className="text-bk-status-overdue font-semibold mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>{errors.amount}</p>}
          </div>

          {/* Optional Due Date */}
          <div className="flex flex-col space-y-1">
            <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
              className={`w-full px-3.5 border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary ${
                errors.dueDate ? 'border-bk-status-overdue' : 'border-bk-border'
              }`}
            />
            {errors.dueDate && <p className="text-bk-status-overdue font-semibold mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>{errors.dueDate}</p>}
          </div>

          {/* Ledger Notes */}
          <div className="flex flex-col space-y-1">
            <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
              Ledger Notes (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Tailoring charges for 2 kurtas"
              style={{ minHeight: '84px', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
              className="w-full p-3 border border-bk-border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary resize-none"
            />
          </div>
        </div>

        {/* Touch-Friendly Action Footer */}
        <div className="p-4 pb-safe border-t border-bk-border bg-bk-surface-soft flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ height: 'var(--ui-button-height)', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
            className="flex-1 min-w-0 border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary font-semibold transition-colors duration-150 cursor-pointer text-center disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ height: 'var(--ui-button-height)', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
            className="flex-1 min-w-0 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white font-semibold transition-all duration-150 cursor-pointer text-center shadow-sm active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? 'Saving...' : (editingCustomer ? 'Save Changes' : 'Record Credit')}
          </button>
        </div>
      </form>
    </div>
  );
};
