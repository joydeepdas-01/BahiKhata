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
  
  // Smart paste input
  const [quickInput, setQuickInput] = useState('');
  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null);

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
    setQuickInput('');
    setAutoFillMessage(null);
    setErrors({});
    setIsSubmitting(false);
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  // Contact Picker API Integration (Supported in Android WebViews / Chrome)
  const handlePickContact = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const contactName = contact.name && contact.name[0] ? contact.name[0] : '';
          const contactPhone = contact.tel && contact.tel[0] ? contact.tel[0] : '';

          if (contactName) setName(contactName);
          if (contactPhone) {
            const phoneRes = normalizePhone(contactPhone);
            if (phoneRes.normalized) {
              setPhone(phoneRes.normalized.replace('+91', ''));
            } else {
              setPhone(contactPhone.replace(/\D/g, '').slice(-10));
            }
          }
          setAutoFillMessage(`Loaded contact: ${contactName || 'Selected Contact'}`);
        }
      } catch (err) {
        console.warn('Contact picker cancelled or failed', err);
      }
    } else {
      alert('Contact picker is not supported on this browser/version. Please use the Quick Paste feature below!');
    }
  };

  // Smart Contact & Text Parser (Parses Name, 10-digit Phone, Amount, and Reason from raw text)
  const parseRawTextAndFill = (textToParse: string) => {
    if (!textToParse.trim()) return;

    let text = textToParse.trim();
    let detectedPhone = '';
    let detectedAmount = '';
    let detectedName = '';
    let detectedNote = '';

    // 1. Extract 10-digit Indian Mobile Number starting with 6,7,8,9
    const phoneMatch = text.match(/(?:\+91[\s-]?)?([6789]\d{9})/);
    if (phoneMatch) {
      detectedPhone = phoneMatch[1];
      text = text.replace(phoneMatch[0], ' ');
    }

    // 2. Extract monetary amount (e.g. ₹1500, Rs. 500, 1250, 500.50)
    const amountMatch = text.match(/(?:(?:₹|rs\.?|inr)\s*)?(\d+(?:\.\d{1,2})?)/i);
    if (amountMatch) {
      detectedAmount = amountMatch[1];
      text = text.replace(amountMatch[0], ' ');
    }

    // 3. Clean remaining text for Name and Reason
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0) {
      // First 1-2 words as Name if name is not set
      detectedName = words.slice(0, 2).join(' ');
      if (words.length > 2) {
        detectedNote = words.slice(2).join(' ');
      }
    }

    // Apply detected fields
    if (detectedName && (!name || editingCustomer === null)) setName(detectedName);
    if (detectedPhone) setPhone(detectedPhone);
    if (detectedAmount) setAmount(detectedAmount);
    if (detectedNote) setNote(prev => prev ? `${prev} ${detectedNote}` : detectedNote);

    const filledParts = [];
    if (detectedName) filledParts.push(`Name: "${detectedName}"`);
    if (detectedPhone) filledParts.push(`Phone: +91 ${detectedPhone}`);
    if (detectedAmount) filledParts.push(`Amount: ₹${detectedAmount}`);
    if (detectedNote) filledParts.push(`Reason: "${detectedNote}"`);

    if (filledParts.length > 0) {
      setAutoFillMessage(`✨ Auto-filled ${filledParts.join(' | ')}`);
    } else {
      setAutoFillMessage('Could not extract contact details. Try entering manually.');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        setQuickInput(clipText);
        parseRawTextAndFill(clipText);
      } else {
        alert('Clipboard access not supported. Please paste text into the input box below!');
      }
    } catch {
      alert('Clipboard permission denied. Please paste text directly into the Quick Paste input!');
    }
  };

  // Quick Amount Add Helpers
  const addQuickAmount = (delta: number) => {
    const current = parseFloat(amount) || 0;
    const nextVal = current + delta;
    setAmount(String(nextVal));
  };

  // Quick Date Helpers
  const setQuickDueDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const isoDate = d.toISOString().split('T')[0];
    setDueDate(isoDate);
  };

  // Quick Reason Chips
  const appendReasonChip = (reasonTag: string) => {
    setNote(prev => {
      if (!prev) return reasonTag;
      if (prev.includes(reasonTag)) return prev;
      return `${prev}, ${reasonTag}`;
    });
  };

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
        className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[88dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up sm:animate-fade-in"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-bk-text-primary" style={{ fontSize: 'var(--text-font-size-heading)' }}>
              {editingCustomer ? 'Edit Customer Ledger' : 'New Credit Entry'}
            </h2>
          </div>

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
          className="flex-1 overflow-y-auto min-h-0 p-4 select-text flex flex-col space-y-3"
        >
          {errors.form && (
            <div className="p-3 bg-bk-status-overdue/10 border border-bk-status-overdue/30 text-bk-status-overdue rounded-bk-md text-xs font-semibold">
              {errors.form}
            </div>
          )}

          {/* ⚡ Quick Contact & Text Auto-Fill Header Tool */}
          {!editingCustomer && (
            <div className="bg-bk-brand-primary/5 border border-bk-brand-primary/20 rounded-xl p-3 space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-bk-brand-primary flex items-center gap-1.5">
                  ⚡ Express Contact & Data Auto-Fill
                </span>
                
                {/* Device Contact Picker Button */}
                <button
                  type="button"
                  onClick={handlePickContact}
                  className="px-2.5 py-1 bg-bk-brand-primary text-white text-[11px] font-bold rounded-lg hover:bg-bk-brand-primary-hover transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  👤 Pick Contact
                </button>
              </div>

              {/* Paste or Type Raw Text Bar */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => {
                    setQuickInput(e.target.value);
                    parseRawTextAndFill(e.target.value);
                  }}
                  placeholder="Paste details: e.g. Ramesh 9876543210 1500 Groceries"
                  className="flex-1 px-3 py-1.5 border border-bk-border rounded-lg bg-white text-xs text-bk-text-primary focus:outline-none focus:border-bk-brand-primary"
                />
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="px-3 py-1.5 bg-white border border-bk-border hover:bg-bk-surface-soft text-bk-text-secondary text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  📋 Paste
                </button>
              </div>

              {autoFillMessage && (
                <p className="text-[11px] font-semibold text-bk-status-paid bg-bk-status-paid/10 p-1.5 rounded-md border border-bk-status-paid/20">
                  {autoFillMessage}
                </p>
              )}
            </div>
          )}

          {/* Customer Name */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
                Customer Name <span className="text-bk-status-overdue">*</span>
              </label>
              {name && (
                <button type="button" onClick={() => setName('')} className="text-[10px] text-bk-text-tertiary hover:text-bk-status-overdue cursor-pointer">Clear</button>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
              className={`w-full px-3.5 border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary ${
                errors.name ? 'border-bk-status-overdue' : 'border-bk-border'
              }`}
            />
            {errors.name && <p className="text-bk-status-overdue font-semibold mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>{errors.name}</p>}
          </div>

          {/* WhatsApp Phone Number Input Group */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
                WhatsApp Mobile Number <span className="text-bk-status-overdue">*</span>
              </label>
              {phone && (
                <button type="button" onClick={() => setPhone('')} className="text-[10px] text-bk-text-tertiary hover:text-bk-status-overdue cursor-pointer">Clear</button>
              )}
            </div>
            <div className="relative flex w-full max-w-full">
              <span 
                style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderTopLeftRadius: 'var(--ui-border-radius)', borderBottomLeftRadius: 'var(--ui-border-radius)' }}
                className="px-3.5 border border-r-0 border-bk-border bg-bk-surface-soft flex items-center text-bk-text-secondary font-semibold select-none shrink-0"
              >
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderTopRightRadius: 'var(--ui-border-radius)', borderBottomRightRadius: 'var(--ui-border-radius)' }}
                className={`flex-1 min-w-0 w-full px-3.5 border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary ${
                  errors.phone ? 'border-bk-status-overdue' : 'border-bk-border'
                }`}
              />
            </div>
            {errors.phone && <p className="text-bk-status-overdue font-semibold mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>{errors.phone}</p>}
          </div>

          {/* Credit Amount */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
                Credit Amount (₹) <span className="text-bk-status-overdue">*</span>
              </label>
              {amount && (
                <button type="button" onClick={() => setAmount('')} className="text-[10px] text-bk-text-tertiary hover:text-bk-status-overdue cursor-pointer">Clear</button>
              )}
            </div>
            <div className="relative w-full">
              <span 
                style={{ fontSize: 'var(--text-font-size-input)' }}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-bk-text-secondary font-bold pointer-events-none select-none"
              >
                ₹
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1250.00"
                style={{ height: 'var(--ui-control-height)', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
                className={`w-full pl-8 pr-3.5 border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary font-tabular-nums ${
                  errors.amount ? 'border-bk-status-overdue' : 'border-bk-border'
                }`}
              />
            </div>
            
            {/* Quick Fast Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1 select-none">
              {[100, 200, 500, 1000, 2000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addQuickAmount(val)}
                  className="px-2.5 py-1 bg-bk-surface-soft hover:bg-bk-border text-bk-text-primary text-xs font-bold rounded-md border border-bk-border transition-colors cursor-pointer"
                >
                  +₹{val}
                </button>
              ))}
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
            {/* Quick Due Date Selectors */}
            <div className="flex flex-wrap gap-1.5 pt-1 select-none">
              {[
                { label: 'Today', days: 0 },
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 Days', days: 3 },
                { label: 'In 1 Week', days: 7 },
                { label: 'In 1 Month', days: 30 }
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setQuickDueDate(item.days)}
                  className="px-2 py-1 bg-white hover:bg-bk-surface-soft text-bk-text-secondary text-[11px] font-semibold rounded-md border border-bk-border transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
            {errors.dueDate && <p className="text-bk-status-overdue font-semibold mt-0.5" style={{ fontSize: 'var(--text-font-size-helper)' }}>{errors.dueDate}</p>}
          </div>

          {/* Ledger Reason / Notes */}
          <div className="flex flex-col space-y-1">
            <label className="font-bold text-bk-text-secondary uppercase tracking-wider block leading-none" style={{ fontSize: 'var(--text-font-size-label)' }}>
              Reason / Item Details (Mentioned in Reminder Message)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Groceries & Milk bill"
              style={{ minHeight: '70px', fontSize: 'var(--text-font-size-input)', borderRadius: 'var(--ui-border-radius)' }}
              className="w-full p-3 border border-bk-border bg-white text-bk-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary resize-none"
            />
            {/* Quick Common Reason Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1 select-none">
              {[
                '🛒 Groceries',
                '🥛 Dairy/Milk',
                '🌾 Ration',
                '📱 Recharge',
                '💊 Medicines',
                '🧵 Tailoring',
                '🔧 Repair Work',
                '💸 Cash Credit'
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendReasonChip(tag)}
                  className="px-2 py-1 bg-bk-surface-soft hover:bg-bk-border text-bk-text-secondary text-[11px] font-medium rounded-md border border-bk-border/80 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
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
