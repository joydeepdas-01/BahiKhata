import React from 'react';
import { BahiKhataLogo } from './BahiKhataLogo';
import { PlusIcon, FileSpreadsheetIcon, SettingsIcon } from './Icons';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface AppHeaderProps {
  onOpenAddCustomer: () => void;
  onOpenBulkPaste: () => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenAddCustomer,
  onOpenBulkPaste,
  onOpenSettings
}) => {
  const { shopName, triggerHaptic } = useDisplaySettings();

  return (
    <header className="sticky top-0 z-40 bg-bk-surface/95 backdrop-blur-md border-b border-bk-border pt-safe select-none">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-4 h-13 sm:h-14 flex items-center justify-between">
        {/* Brand & Shop Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <BahiKhataLogo size={24} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-bk-text-primary truncate">
                {shopName || 'BahiKhata'}
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold bg-bk-surface-soft border border-bk-border text-bk-text-tertiary px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                Offline
              </span>
            </div>
            <p className="text-[10px] text-bk-text-tertiary font-medium leading-none hidden sm:block">
              Digital Credit Ledger & Reminders
            </p>
          </div>
        </div>

        {/* Header Action Buttons: Standardized sizes and balanced hierarchy */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenBulkPaste();
            }}
            className="h-8 px-2.5 border border-bk-border rounded-xl bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Bulk Paste from Spreadsheet"
            aria-label="Bulk Paste"
          >
            <FileSpreadsheetIcon size={14} />
            <span className="hidden sm:inline">Bulk Paste</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenSettings();
            }}
            className="w-8 h-8 border border-bk-border rounded-xl bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon size={15} />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('standard');
              onOpenAddCustomer();
            }}
            className="h-8 px-3 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
            aria-label="Add Customer"
          >
            <PlusIcon size={14} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>
    </header>
  );
};

