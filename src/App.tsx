import { useState, useEffect, useCallback } from 'react';
import { useCustomers } from './hooks/useCustomers';
import { CustomerList } from './components/CustomerList';
import { CustomerForm } from './components/CustomerForm';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { TransactionsFeed } from './components/TransactionsFeed';
import { RemindersQueue } from './components/RemindersQueue';
import { SettingsModal } from './components/SettingsModal';
import { WhatsAppPreview } from './components/WhatsAppPreview';
import { OnboardingModal } from './components/OnboardingModal';
import { BulkPasteSheet } from './components/BulkPasteSheet';
import { BahiKhataLogo } from './components/BahiKhataLogo';
import { 
  SettingsIcon, PlusIcon, FileSpreadsheetIcon, 
  ContactIcon, ClockIcon, BellIcon, ArrowUpRightIcon 
} from './components/Icons';
import { Customer } from './domain/customer';
import { useDisplaySettings } from './context/DisplaySettingsContext';

type ActiveTab = 'khata' | 'activity' | 'reminders';

function App() {
  const {
    customers,
    allTransactions,
    loading,
    error,
    addCustomer,
    recordTransaction,
    deleteTransaction,
    getCustomerTransactions,
    addBulkCustomers,
    updateCustomer,
    deleteCustomer,
    clearAllData,
    summary
  } = useCustomers();

  const { shopName, triggerHaptic } = useDisplaySettings();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('khata');

  // Modals and Drawers
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuickTransOpen, setIsQuickTransOpen] = useState(false);

  // Focus targets
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [quickTransInitialType, setQuickTransInitialType] = useState<'credit' | 'payment'>('credit');

  // Onboarding state initialized without cascading render
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !localStorage.getItem('bk_onboarded');
  });

  const handleCloseOnboarding = () => {
    localStorage.setItem('bk_onboarded', 'true');
    setIsOnboardingOpen(false);
  };

  const handleCloseAddForm = useCallback(() => {
    setEditingCustomer(null);
    setIsAddFormOpen(false);
  }, []);

  // Android Native Back Button Handling
  useEffect(() => {
    let unmounted = false;
    let backButtonListener: any = null;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backButtonListener = await App.addListener('backButton', () => {
          if (unmounted) return;

          if (isQuickTransOpen) {
            setIsQuickTransOpen(false);
          } else if (isDetailOpen) {
            setIsDetailOpen(false);
          } else if (isAddFormOpen) {
            handleCloseAddForm();
          } else if (isWhatsAppOpen) {
            setIsWhatsAppOpen(false);
          } else if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else if (isBulkPasteOpen) {
            setIsBulkPasteOpen(false);
          } else if (isOnboardingOpen) {
            handleCloseOnboarding();
          } else if (activeTab !== 'khata') {
            setActiveTab('khata');
          } else {
            App.exitApp();
          }
        });
      } catch (e) {
        console.log('Native back-button listener initialized for web/browser', e);
      }
    };

    setupBackButton();

    return () => {
      unmounted = true;
      if (backButtonListener && backButtonListener.remove) {
        backButtonListener.remove();
      }
    };
  }, [
    isQuickTransOpen,
    isDetailOpen,
    isAddFormOpen,
    isWhatsAppOpen,
    isSettingsOpen,
    isBulkPasteOpen,
    isOnboardingOpen,
    activeTab,
    handleCloseAddForm
  ]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddFormOpen(true);
  };

  const handlePrepareReminder = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsWhatsAppOpen(true);
  };

  const handleQuickTransaction = (customer: Customer, type: 'credit' | 'payment') => {
    setSelectedCustomer(customer);
    setQuickTransInitialType(type);
    setIsQuickTransOpen(true);
  };

  const handleReminderSent = async (customerId: string, timestamp: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    await updateCustomer({
      ...cust,
      lastReminderSentAt: timestamp
    });
  };

  return (
    <div className="min-h-screen bg-bk-canvas flex flex-col text-bk-text-primary antialiased">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-bk-surface/95 backdrop-blur-md border-b border-bk-border pt-safe select-none">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
          {/* Brand Logo & Shop Name */}
          <div className="flex items-center gap-2.5">
            <BahiKhataLogo size={26} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-bk-text-primary">
                  {shopName || 'BahiKhata'}
                </span>
                <span className="hidden sm:inline-block text-[9px] font-extrabold bg-bk-surface-soft border border-bk-border text-bk-text-tertiary px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Offline Khata
                </span>
              </div>
              <p className="text-[10px] text-bk-text-tertiary font-medium leading-none hidden sm:block">
                Digital Credit Ledger & Reminders
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsBulkPasteOpen(true);
              }}
              className="h-8.5 px-2.5 border border-bk-border rounded-xl bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-brand-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="Bulk Paste from Spreadsheet"
            >
              <FileSpreadsheetIcon size={14} />
              <span className="hidden sm:inline">Bulk Paste</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsSettingsOpen(true);
              }}
              className="p-2 border border-bk-border rounded-xl bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary cursor-pointer transition-colors shadow-2xs"
              title="Settings"
            >
              <SettingsIcon size={16} />
            </button>

            <button
              onClick={() => {
                triggerHaptic('standard');
                setIsAddFormOpen(true);
              }}
              className="h-8.5 px-3 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:translate-y-[1px]"
            >
              <PlusIcon size={15} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Screen */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4 pb-24">
        {loading ? (
          <div className="space-y-4 animate-pulse mt-4">
            <div className="h-28 bg-bk-surface border border-bk-border rounded-2xl" />
            <div className="h-10 bg-bk-surface border border-bk-border rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-36 bg-bk-surface border border-bk-border rounded-2xl" />
              <div className="h-36 bg-bk-surface border border-bk-border rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-bk-status-overdue/10 border border-bk-status-overdue/30 text-bk-status-overdue rounded-2xl mt-4 text-xs font-semibold">
            <strong>Database Notice:</strong> {error}. Please refresh the application.
          </div>
        ) : activeTab === 'khata' ? (
          <CustomerList
            customers={customers}
            summary={summary}
            onSelectCustomer={handleSelectCustomer}
            onEdit={handleEditCustomer}
            onDelete={deleteCustomer}
            onPrepareReminder={handlePrepareReminder}
            onOpenAddForm={() => setIsAddFormOpen(true)}
            onQuickTransaction={handleQuickTransaction}
          />
        ) : activeTab === 'activity' ? (
          <TransactionsFeed
            transactions={allTransactions}
            customers={customers}
            onSelectCustomer={handleSelectCustomer}
          />
        ) : (
          <RemindersQueue
            customers={customers}
            onPrepareReminder={handlePrepareReminder}
            onSelectCustomer={handleSelectCustomer}
          />
        )}
      </main>

      {/* Modern Bottom Navigation Bar (Android Thumb-Zone) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-bk-surface/95 backdrop-blur-md border-t border-bk-border pb-safe select-none">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-around">
          {/* Tab 1: Khata Customers */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('khata');
            }}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'khata'
                ? 'text-bk-brand-primary font-bold'
                : 'text-bk-text-tertiary hover:text-bk-text-primary'
            }`}
          >
            <ContactIcon size={20} />
            <span className="text-[10px] tracking-tight leading-none">Customers</span>
          </button>

          {/* Tab 2: Activity / Transactions */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('activity');
            }}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'activity'
                ? 'text-bk-brand-primary font-bold'
                : 'text-bk-text-tertiary hover:text-bk-text-primary'
            }`}
          >
            <ClockIcon size={20} />
            <span className="text-[10px] tracking-tight leading-none">Transactions</span>
          </button>

          {/* Quick Transaction Action Shortcut in Center */}
          <button
            onClick={() => {
              triggerHaptic('standard');
              if (customers.length > 0) {
                setSelectedCustomer(customers[0]);
                setIsQuickTransOpen(true);
              } else {
                setIsAddFormOpen(true);
              }
            }}
            className="w-10 h-10 -mt-3 rounded-full bg-bk-brand-primary text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
            title="Quick Transaction Entry"
          >
            <ArrowUpRightIcon size={20} />
          </button>

          {/* Tab 3: Reminders Queue */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('reminders');
            }}
            className={`relative flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'reminders'
                ? 'text-bk-brand-primary font-bold'
                : 'text-bk-text-tertiary hover:text-bk-text-primary'
            }`}
          >
            <BellIcon size={20} />
            <span className="text-[10px] tracking-tight leading-none">Reminders</span>
            {summary.pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-bk-status-overdue text-white text-[9px] font-extrabold rounded-full">
                {summary.pendingCount}
              </span>
            )}
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsSettingsOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-1 text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer transition-colors"
          >
            <SettingsIcon size={20} />
            <span className="text-[10px] tracking-tight leading-none">Settings</span>
          </button>
        </div>
      </nav>

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={isAddFormOpen}
        onClose={handleCloseAddForm}
        onSubmit={addCustomer}
        onUpdate={updateCustomer}
        editingCustomer={editingCustomer}
        existingCustomers={customers}
        onViewExisting={(c) => {
          handleSelectCustomer(c);
        }}
      />

      {/* Customer Detail & Full Transaction Ledger Sheet */}
      <CustomerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        customer={selectedCustomer}
        onEditCustomer={(c) => {
          setIsDetailOpen(false);
          handleEditCustomer(c);
        }}
        onDeleteCustomer={(id) => {
          deleteCustomer(id);
        }}
        onPrepareReminder={(c) => {
          handlePrepareReminder(c);
        }}
        getCustomerTransactions={getCustomerTransactions}
        onRecordTransaction={recordTransaction}
        onDeleteTransaction={deleteTransaction}
      />

      {/* Quick Transaction Entry Modal */}
      <QuickTransactionModal
        isOpen={isQuickTransOpen}
        onClose={() => setIsQuickTransOpen(false)}
        customers={customers}
        initialCustomer={selectedCustomer}
        initialType={quickTransInitialType}
        onRecordTransaction={recordTransaction}
      />

      {/* WhatsApp Message Preview */}
      <WhatsAppPreview
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        customer={selectedCustomer}
        onReminderSent={handleReminderSent}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customers={customers}
        onImportCustomers={addBulkCustomers}
        onClearAllData={clearAllData}
      />

      {/* Onboarding Dialog */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
      />

      {/* Bulk Spreadsheet Rows Import Sheet */}
      <BulkPasteSheet
        isOpen={isBulkPasteOpen}
        onClose={() => setIsBulkPasteOpen(false)}
        onImportBulk={addBulkCustomers}
      />
    </div>
  );
}

export default App;
