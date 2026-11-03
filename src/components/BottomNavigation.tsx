import React from 'react';
import { 
  ContactIcon, ClockIcon, BellIcon, SettingsIcon, PlusIcon 
} from './Icons';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

export type NavTab = 'khata' | 'activity' | 'reminders';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickAction: () => void;
  onOpenSettings: () => void;
  pendingRemindersCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onQuickAction,
  onOpenSettings,
  pendingRemindersCount
}) => {
  const { triggerHaptic } = useDisplaySettings();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-bk-surface/95 backdrop-blur-md border-t border-bk-border pb-safe select-none shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto px-3 h-14 flex items-center justify-between">
        {/* Destination 1: Customers */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onTabChange('khata');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-colors ${
            activeTab === 'khata'
              ? 'text-bk-brand-primary font-bold'
              : 'text-bk-text-tertiary hover:text-bk-text-primary'
          }`}
          aria-label="Customers Tab"
        >
          <ContactIcon size={19} />
          <span className="text-[10px] tracking-tight leading-none mt-1">Customers</span>
        </button>

        {/* Destination 2: Transactions */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onTabChange('activity');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-colors ${
            activeTab === 'activity'
              ? 'text-bk-brand-primary font-bold'
              : 'text-bk-text-tertiary hover:text-bk-text-primary'
          }`}
          aria-label="Transactions Tab"
        >
          <ClockIcon size={19} />
          <span className="text-[10px] tracking-tight leading-none mt-1">Transactions</span>
        </button>

        {/* Destination 3: Central Quick Transaction Button */}
        <div className="flex-1 flex justify-center -mt-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('standard');
              onQuickAction();
            }}
            className="w-11 h-11 rounded-full bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer border-2 border-white"
            title="Record New Transaction"
            aria-label="Quick Transaction"
          >
            <PlusIcon size={20} />
          </button>
        </div>

        {/* Destination 4: Reminders */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onTabChange('reminders');
          }}
          className={`relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-colors ${
            activeTab === 'reminders'
              ? 'text-bk-brand-primary font-bold'
              : 'text-bk-text-tertiary hover:text-bk-text-primary'
          }`}
          aria-label="Reminders Tab"
        >
          <div className="relative">
            <BellIcon size={19} />
            {pendingRemindersCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-bk-status-overdue text-white text-[8px] font-black rounded-full min-w-3.5 text-center leading-tight">
                {pendingRemindersCount > 99 ? '99+' : pendingRemindersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-1">Reminders</span>
        </button>

        {/* Destination 5: Settings */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onOpenSettings();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer transition-colors"
          aria-label="Settings Tab"
        >
          <SettingsIcon size={19} />
          <span className="text-[10px] tracking-tight leading-none mt-1">Settings</span>
        </button>
      </div>
    </nav>
  );
};

