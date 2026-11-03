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
import { AppHeader } from './components/AppHeader';
import { BottomNavigation, NavTab } from './components/BottomNavigation';
import { Customer } from './domain/customer';

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

  // Navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('khata');

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
      {/* Unified App Header */}
      <AppHeader
        onOpenAddCustomer={() => setIsAddFormOpen(true)}
        onOpenBulkPaste={() => setIsBulkPasteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Screen with Safe Bottom Clearance */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pt-2 pb-32">
        {loading ? (
          <div className="space-y-3.5 animate-pulse mt-2">
            <div className="h-28 bg-bk-surface border border-bk-border rounded-2xl" />
            <div className="h-10 bg-bk-surface border border-bk-border rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-32 bg-bk-surface border border-bk-border rounded-2xl" />
              <div className="h-32 bg-bk-surface border border-bk-border rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-bk-status-overdue rounded-2xl mt-4 text-xs font-semibold">
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

      {/* 5-Destination Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAction={() => {
          if (customers.length > 0) {
            setSelectedCustomer(customers[0]);
            setIsQuickTransOpen(true);
          } else {
            setIsAddFormOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        pendingRemindersCount={summary.pendingCount}
      />

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
