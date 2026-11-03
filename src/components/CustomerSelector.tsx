import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from '../domain/customer';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { SearchIcon, ChevronRightIcon, CloseIcon } from './Icons';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  disabled?: boolean;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.note && c.note.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatPhone = (phone: string) => {
    if (phone.startsWith('91') && phone.length === 12) {
      return `+91 ${phone.substring(2, 7)} ${phone.substring(7)}`;
    }
    return phone;
  };

  const getInitials = (name: string) => {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'BK'
    );
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button: Shows selected customer in high-fidelity preview */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-bk-border rounded-xl bg-white hover:bg-bk-surface-soft/60 focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary flex items-center justify-between text-left transition-colors cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {selectedCustomer ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-bk-surface-soft border border-bk-border text-bk-text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(selectedCustomer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-bk-text-primary text-xs sm:text-sm truncate">
                  {selectedCustomer.name}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    selectedCustomer.amount > 0
                      ? 'bg-red-50 text-bk-status-overdue'
                      : selectedCustomer.amount === 0
                      ? 'bg-emerald-50 text-bk-status-paid'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {formatIndianCurrency(selectedCustomer.amount)}
                </span>
              </div>
              <p className="text-[11px] font-mono text-bk-text-tertiary truncate">
                {formatPhone(selectedCustomer.phone)}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-bk-text-tertiary">Select a customer...</span>
        )}

        <div className="text-bk-text-tertiary ml-2 shrink-0">
          <ChevronRightIcon size={16} className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-bk-border rounded-xl shadow-lg overflow-hidden animate-fade-in flex flex-col max-h-72">
          {/* Search Header */}
          <div className="p-2 border-b border-bk-border bg-bk-surface-soft/60 shrink-0">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-bk-text-tertiary pointer-events-none">
                <SearchIcon size={14} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-bk-border rounded-lg text-xs text-bk-text-primary focus:outline-none focus:ring-1 focus:ring-bk-brand-primary"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-bk-text-tertiary hover:text-bk-text-primary"
                >
                  <CloseIcon size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Customer Options List */}
          <div className="overflow-y-auto flex-1 divide-y divide-bk-border/40">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-xs text-bk-text-tertiary">
                No matching customers found.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = c.id === selectedCustomer?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCustomer(c.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-red-50/70 text-bk-brand-primary'
                        : 'hover:bg-bk-surface-soft text-bk-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-red-100 border-red-200 text-bk-brand-primary'
                            : 'bg-bk-surface-soft border-bk-border text-bk-text-secondary'
                        }`}
                      >
                        {getInitials(c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{c.name}</div>
                        <div className="text-[10px] font-mono text-bk-text-tertiary truncate">
                          {formatPhone(c.phone)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-xs font-mono font-bold ${
                          c.amount > 0
                            ? 'text-bk-status-overdue'
                            : c.amount === 0
                            ? 'text-bk-status-paid'
                            : 'text-blue-600'
                        }`}
                      >
                        {formatIndianCurrency(c.amount)}
                      </span>
                      <span className="text-[9px] text-bk-text-tertiary uppercase">
                        {c.amount > 0 ? 'Due' : c.amount === 0 ? 'Settled' : 'Advance'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
