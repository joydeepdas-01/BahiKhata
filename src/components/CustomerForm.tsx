import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, ContactIcon, AlertCircleIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from './Icons';
import { Customer, findDuplicateCustomer } from '../domain/customer';
import { normalizePhone } from '../domain/phoneNormalizer';
import { rupeesToPaise, paiseToRupees, formatIndianCurrency } from '../domain/amountFormatter';
import { pickContactFromDevice, ContactPhone } from '../services/contactPickerService';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Omit<Customer, 'id' | 'status'>, initialType?: 'credit' | 'payment') => Promise<Customer>;
  onUpdate?: (customer: Customer) => Promise<void>;
  editingCustomer?: Customer | null;
  existingCustomers?: Customer[];
  onViewExisting?: (customer: Customer) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingCustomer,
  existingCustomers = [],
  onViewExisting
}) => {
  const { triggerHaptic } = useDisplaySettings();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'payment'>('credit');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  // Contact picker multiple phone support & imported badge
  const [availablePhones, setAvailablePhones] = useState<ContactPhone[]>([]);
  const [importedContactName, setImportedContactName] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingContact, setIsPickingContact] = useState(false);

  // Initialize or reset form state
  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone.replace(/^91/, ''));
      setAmount(editingCustomer.amount !== 0 ? String(paiseToRupees(Math.abs(editingCustomer.amount))) : '');
      setTransactionType(editingCustomer.amount < 0 ? 'payment' : 'credit');
      setDueDate(editingCustomer.dueDate || '');
      setNote(editingCustomer.note || '');
    } else {
      setName('');
      setPhone('');
      setAmount('');
      setTransactionType('credit');
      setDueDate('');
      setNote('');
    }
    setAvailablePhones([]);
    setImportedContactName(null);
    setErrors({});
    setIsSubmitting(false);
  }, [editingCustomer, isOpen]);

  // Real-time phone normalization
  const phoneValidation = useMemo(() => {
    if (!phone.trim()) return null;
    return normalizePhone(phone);
  }, [phone]);

  // Check for duplicate customer
  const duplicateCustomer = useMemo(() => {
    if (!phoneValidation?.isValid || !phoneValidation.normalized) return undefined;
    return findDuplicateCustomer(existingCustomers, phoneValidation.normalized, editingCustomer?.id);
  }, [phoneValidation, existingCustomers, editingCustomer]);

  if (!isOpen) return null;

  // Handle Android Native or Web Contact Picker
  const handleSelectFromContacts = async () => {
    triggerHaptic('light');
    setIsPickingContact(true);
    setErrors((prev) => ({ ...prev, contact: '' }));

    try {
      const res = await pickContactFromDevice();
      if (res.success && res.contact) {
        triggerHaptic('success');
        const picked = res.contact;

        if (picked.name) {
          setName(picked.name);
          setImportedContactName(picked.name);
        }

        if (picked.phoneNumber) {
          const norm = normalizePhone(picked.phoneNumber);
          if (norm.isValid && norm.normalized) {
            setPhone(norm.normalized.replace(/^91/, ''));
          } else {
            const digits = picked.phoneNumber.replace(/\D/g, '').slice(-10);
            setPhone(digits);
          }
        }

        if (picked.allPhones && picked.allPhones.length > 1) {
          setAvailablePhones(picked.allPhones);
        } else {
          setAvailablePhones([]);
        }
      } else if (res.error && !res.cancelled) {
        setErrors((prev) => ({ ...prev, contact: res.error || 'Failed to select contact' }));
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, contact: err.message || 'Error selecting contact' }));
    } finally {
      setIsPickingContact(false);
    }
  };

  // Quick date presets
  const handleSetDatePreset = (daysFromNow: number) => {
    triggerHaptic('light');
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('standard');

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else {
      const phoneRes = normalizePhone(phone);
      if (!phoneRes.isValid) {
        newErrors.phone = phoneRes.error || 'Invalid 10-digit mobile number';
      }
    }

    let parsedPaise = 0;
    if (amount.trim()) {
      parsedPaise = rupeesToPaise(amount);
      if (parsedPaise < 0) {
        newErrors.amount = 'Amount cannot be negative';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerHaptic('warning');
      return;
    }

    const validatedPhone = normalizePhone(phone).normalized!;

    setIsSubmitting(true);
    try {
      if (editingCustomer && onUpdate) {
        await onUpdate({
          ...editingCustomer,
          name: name.trim(),
          phone: validatedPhone,
          dueDate: dueDate || null,
          note: note.trim() || undefined
        });
      } else {
        await onSubmit(
          {
            name: name.trim(),
            phone: validatedPhone,
            amount: parsedPaise,
            dueDate: dueDate || null,
            note: note.trim() || undefined
          },
          transactionType
        );
      }
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save customer record' });
      triggerHaptic('warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bk-text-primary/40 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[92dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1 bg-bk-border rounded-full mx-auto mt-2" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft/80">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight">
              {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
            </h3>
            <p className="text-xs text-bk-text-tertiary">
              {editingCustomer ? 'Update contact & due date' : 'Create ledger entry or import from phone contacts'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-bk-border/60 transition-colors text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 select-text">
          {/* General Form Error */}
          {errors.form && (
            <div className="p-3 bg-bk-status-overdue/10 border border-bk-status-overdue/20 rounded-xl text-xs text-bk-status-overdue flex items-center gap-2">
              <AlertCircleIcon size={16} />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Contact Picker Error */}
          {errors.contact && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 flex items-center gap-2">
              <AlertCircleIcon size={16} />
              <span>{errors.contact}</span>
            </div>
          )}

          {/* Native Android Contact Picker Button */}
          {!editingCustomer && (
            <div className="p-3 bg-bk-surface-soft border border-bk-border rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-bk-brand-primary/10 text-bk-brand-primary flex items-center justify-center shrink-0">
                  <ContactIcon size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-bk-text-primary">
                    {importedContactName ? `Selected: ${importedContactName}` : 'Add from Phone Contacts'}
                  </div>
                  <div className="text-[11px] text-bk-text-secondary">
                    Select any contact from your Android address book
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSelectFromContacts}
                disabled={isPickingContact}
                className="px-3 py-1.5 bg-white border border-bk-border hover:border-bk-brand-primary text-xs font-semibold text-bk-text-primary hover:text-bk-brand-primary rounded-lg shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isPickingContact ? 'Opening...' : importedContactName ? 'Change Contact' : 'Select Contact'}
              </button>
            </div>
          )}

          {/* Multiple Phone Numbers Selector (if imported contact has multiple) */}
          {availablePhones.length > 1 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
              <div className="text-[11px] font-bold text-blue-900">
                Multiple numbers found. Tap to select the WhatsApp number:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availablePhones.map((p, idx) => {
                  const clean = p.number.replace(/\D/g, '').slice(-10);
                  const isSelected = phone === clean;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setPhone(clean);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer font-medium ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-100'
                      }`}
                    >
                      {p.number} ({p.type || 'Phone'})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duplicate Customer Alert */}
          {duplicateCustomer && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
              <div className="flex items-start gap-2 text-xs text-amber-900">
                <AlertCircleIcon size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>Customer Already Exists:</strong> "{duplicateCustomer.name}" is already registered with this mobile number.
                  Current balance:{' '}
                  <span className="font-bold font-mono">
                    {formatIndianCurrency(duplicateCustomer.amount)}
                  </span>
                </div>
              </div>
              {onViewExisting && (
                <button
                  type="button"
                  onClick={() => {
                    onViewExisting(duplicateCustomer);
                    onClose();
                  }}
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                >
                  View Existing Ledger for {duplicateCustomer.name} &rarr;
                </button>
              )}
            </div>
          )}

          {/* Customer Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
              Customer Name <span className="text-bk-status-overdue">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Ramesh Patel, Sharma Ji, Priya"
              className={`w-full px-3.5 py-2.5 border rounded-xl bg-white text-bk-text-primary text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-bk-status-overdue focus:ring-bk-status-overdue/20'
                  : 'border-bk-border focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary'
              }`}
            />
            {errors.name && <p className="text-[11px] text-bk-status-overdue font-medium">{errors.name}</p>}
          </div>

          {/* Mobile Number (+91 prefix) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
              Mobile Number (WhatsApp) <span className="text-bk-status-overdue">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-bk-text-secondary pointer-events-none select-none">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={12}
                value={phone}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(cleaned);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="98765 43210"
                className={`w-full pl-12 pr-4 py-2.5 border rounded-xl bg-white text-bk-text-primary font-mono text-sm tracking-wide focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? 'border-bk-status-overdue focus:ring-bk-status-overdue/20'
                    : 'border-bk-border focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary'
                }`}
              />
            </div>
            {errors.phone ? (
              <p className="text-[11px] text-bk-status-overdue font-medium">{errors.phone}</p>
            ) : (
              phoneValidation?.isValid && (
                <p className="text-[11px] text-bk-status-paid font-medium">✓ Valid Indian mobile: {phoneValidation.formatted}</p>
              )
            )}
          </div>

          {/* Opening Balance (Only shown when adding new customer) */}
          {!editingCustomer && (
            <div className="space-y-2 pt-1 border-t border-bk-border/60">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider">
                  Opening Balance (Optional)
                </label>
                <span className="text-[11px] text-bk-text-tertiary">Can be ₹0</span>
              </div>

              {/* Transaction Type Segmented Toggle */}
              <div className="grid grid-cols-2 p-1 bg-bk-surface-soft border border-bk-border rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setTransactionType('credit');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    transactionType === 'credit'
                      ? 'bg-bk-status-overdue text-white shadow-2xs'
                      : 'text-bk-text-secondary hover:text-bk-text-primary'
                  }`}
                >
                  <ArrowUpRightIcon size={14} />
                  <span>You Gave (Credit / Udhaar)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setTransactionType('payment');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    transactionType === 'payment'
                      ? 'bg-bk-status-paid text-white shadow-2xs'
                      : 'text-bk-text-secondary hover:text-bk-text-primary'
                  }`}
                >
                  <ArrowDownLeftIcon size={14} />
                  <span>You Got (Payment / Jama)</span>
                </button>
              </div>

              {/* Amount Input */}
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-base font-bold text-bk-text-secondary pointer-events-none select-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-xl bg-white text-bk-text-primary font-mono text-base font-bold focus:outline-none focus:ring-2 transition-all ${
                    errors.amount
                      ? 'border-bk-status-overdue focus:ring-bk-status-overdue/20'
                      : 'border-bk-border focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-[11px] text-bk-status-overdue font-medium">{errors.amount}</p>}
            </div>
          )}

          {/* Due Date & Quick Presets */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider">
                Payment Due Date (Optional)
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[11px] text-bk-brand-primary hover:underline cursor-pointer"
                >
                  Clear date
                </button>
              )}
            </div>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-bk-border rounded-xl bg-white text-bk-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary transition-all"
            />

            {/* Quick Date Presets */}
            <div className="flex gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => handleSetDatePreset(1)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-bk-surface-soft hover:bg-bk-border/60 text-bk-text-secondary rounded-lg border border-bk-border cursor-pointer transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset(3)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-bk-surface-soft hover:bg-bk-border/60 text-bk-text-secondary rounded-lg border border-bk-border cursor-pointer transition-colors"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset(7)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-bk-surface-soft hover:bg-bk-border/60 text-bk-text-secondary rounded-lg border border-bk-border cursor-pointer transition-colors"
              >
                In 1 Week
              </button>
              <button
                type="button"
                onClick={() => handleSetDatePreset(30)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-bk-surface-soft hover:bg-bk-border/60 text-bk-text-secondary rounded-lg border border-bk-border cursor-pointer transition-colors"
              >
                In 1 Month
              </button>
            </div>
          </div>

          {/* Note / Memo */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
              Notes / Description (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Grocery bill #104, Tailoring order, Monthly fees"
              className="w-full px-3.5 py-2.5 border border-bk-border rounded-xl bg-white text-bk-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary transition-all"
            />
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-bk-border bg-bk-surface-soft/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-bk-border rounded-xl text-xs font-semibold text-bk-text-secondary hover:text-bk-text-primary hover:bg-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
          </button>
        </div>
      </div>
    </div>
  );
};
