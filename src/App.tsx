import { useState, useEffect } from 'react';
import { useCustomers } from './hooks/useCustomers';
import { CustomerList } from './components/CustomerList';
import { CustomerForm } from './components/CustomerForm';
import { SettingsModal } from './components/SettingsModal';
import { WhatsAppPreview } from './components/WhatsAppPreview';
import { OnboardingModal } from './components/OnboardingModal';
import { BulkPasteSheet } from './components/BulkPasteSheet';
import { BahiKhataLogo } from './components/BahiKhataLogo';
import { SettingsIcon, PlusIcon, FileSpreadsheetIcon } from './components/Icons';
import { Customer } from './domain/customer';

function App() {
  const {
    customers,
    loading,
    error,
    addCustomer,
    addBulkCustomers,
    updateCustomer,
    deleteCustomer,
    markAsPaid,
    clearAllData,
    summary
  } = useCustomers();

  // Dialog and Modal toggles
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState(false);

  // Focus targets
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Check first-run onboarding eligibility
  useEffect(() => {
    const onboarded = localStorage.getItem('bk_onboarded');
    if (!onboarded) {
      setIsOnboardingOpen(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem('bk_onboarded', 'true');
    setIsOnboardingOpen(false);
  };

  // Android Native Back Button Handling
  useEffect(() => {
    let unmounted = false;
    let backButtonListener: any = null;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backButtonListener = await App.addListener('backButton', () => {
          if (unmounted) return;

          if (isAddFormOpen) {
            handleCloseAddForm();
          } else if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else if (isWhatsAppOpen) {
            setIsWhatsAppOpen(false);
          } else if (isBulkPasteOpen) {
            setIsBulkPasteOpen(false);
          } else if (isOnboardingOpen) {
            handleCloseOnboarding();
          } else {
            App.exitApp();
          }
        });
      } catch (e) {
        console.log('Running in standard web browser - native back-button listening disabled.', e);
      }
    };

    setupBackButton();

    return () => {
      unmounted = true;
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [isAddFormOpen, isSettingsOpen, isWhatsAppOpen, isBulkPasteOpen, isOnboardingOpen]);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddFormOpen(true);
  };

  const handleCloseAddForm = () => {
    setEditingCustomer(null);
    setIsAddFormOpen(false);
  };

  const handlePrepareReminder = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsWhatsAppOpen(true);
  };

  const handleReminderSent = async (customerId: string, timestamp: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    await updateCustomer({
      ...customer,
      lastReminderSentAt: timestamp
    });
  };

  const handleDelete = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    if (window.confirm(`Are you sure you want to delete the ledger for ${customer.name}? This action cannot be undone.`)) {
      try {
        await deleteCustomer(id);
      } catch (err: any) {
        alert(err.message || 'Delete operation failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bk-canvas flex flex-col">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-bk-surface/90 backdrop-blur-md border-b border-bk-border pt-safe">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BahiKhataLogo size={26} />
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-bk-text-primary">BahiKhata</span>
            <span className="hidden sm:inline-block text-[10px] font-bold bg-bk-surface-soft border border-bk-border text-bk-text-secondary px-2.5 py-0.5 rounded-bk-pill uppercase tracking-wider select-none">V1 (Local)</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 border border-bk-border rounded-bk-md bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary cursor-pointer transition-colors duration-150"
              title="Open Settings"
            >
              <SettingsIcon size={18} />
            </button>
            <button
              onClick={() => setIsBulkPasteOpen(true)}
              className="h-9 px-2.5 sm:px-3 border border-bk-border rounded-bk-md bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-brand-primary cursor-pointer transition-colors duration-150 text-xs font-semibold flex items-center gap-1.5"
              title="Bulk Paste Spreadsheet Rows"
            >
              <FileSpreadsheetIcon size={14} />
              <span className="hidden xs:inline">Bulk Paste</span>
            </button>
            <button
              onClick={() => setIsAddFormOpen(true)}
              className="h-9 px-2.5 sm:px-3 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-xs font-semibold rounded-bk-md flex items-center gap-1.5 cursor-pointer transition-all duration-150 shadow-sm active:translate-y-[1px]"
            >
              <PlusIcon size={14} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-bk-md pb-bk-xxl">
        {loading ? (
          <div className="space-y-bk-md animate-pulse mt-4">
            <div className="h-28 bg-bk-surface border border-bk-border rounded-bk-lg" />
            <div className="h-10 bg-bk-surface border border-bk-border rounded-bk-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-bk-sm">
              <div className="h-40 bg-bk-surface border border-bk-border rounded-bk-lg" />
              <div className="h-40 bg-bk-surface border border-bk-border rounded-bk-lg" />
            </div>
          </div>
        ) : error ? (
          <div className="p-bk-md bg-bk-status-overdue/10 border border-bk-status-overdue/30 text-bk-status-overdue rounded-bk-lg mt-4 text-sm">
            <strong>Error:</strong> {error}. Please reload the web page.
          </div>
        ) : (
          <CustomerList
            customers={customers}
            summary={summary}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkPaid={markAsPaid}
            onPrepareReminder={handlePrepareReminder}
            onOpenAddForm={() => setIsAddFormOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Overlay Sheets & Drawers */}
      <CustomerForm
        isOpen={isAddFormOpen}
        onClose={handleCloseAddForm}
        onSubmit={addCustomer}
        onUpdate={updateCustomer}
        editingCustomer={editingCustomer}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customers={customers}
        onImportCustomers={addBulkCustomers}
        onClearAllData={clearAllData}
      />

      <WhatsAppPreview
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        customer={selectedCustomer}
        onReminderSent={handleReminderSent}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
      />

      <BulkPasteSheet
        isOpen={isBulkPasteOpen}
        onClose={() => setIsBulkPasteOpen(false)}
        onImportBulk={addBulkCustomers}
      />
    </div>
  );
}

export default App;
