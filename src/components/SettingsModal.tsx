import React, { useState } from 'react';
import { CloseIcon, TrashIcon } from './Icons';
import { Customer } from '../domain/customer';
import { exportToCSV, parseCSV } from '../domain/csvHelper';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { DEFAULT_TEMPLATES, parseTemplate } from '../domain/templates';
import { 
  useDisplaySettings, 
  TextScale, 
  DensityMode, 
  ContentWidthMode, 
  ThemeMode, 
  HapticMode, 
  ReminderLangMode, 
  ReminderToneMode, 
  WhatsappBehaviorMode, 
  DefaultFilterMode 
} from '../context/DisplaySettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onImportCustomers: (customers: Omit<Customer, 'id' | 'status'>[]) => Promise<void>;
  onClearAllData: () => Promise<void>;
}

type TabType = 'appearance' | 'reminders' | 'preferences' | 'data' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customers,
  onImportCustomers,
  onClearAllData
}) => {
  const {
    textScale,
    density,
    contentWidth,
    theme,
    reduceMotion,
    hapticFeedback,
    reminderLang,
    reminderTone,
    reminderIncludeDueDate,
    reminderIncludeShopName,
    shopName,
    whatsappBehavior,
    defaultFilter,
    confirmDelete,
    setTextScale,
    setDensity,
    setContentWidth,
    setTheme,
    setReduceMotion,
    setHapticFeedback,
    setReminderLang,
    setReminderTone,
    setReminderIncludeDueDate,
    setReminderIncludeShopName,
    setShopName,
    setWhatsappBehavior,
    setDefaultFilter,
    setConfirmDelete,
    triggerHaptic,
    resetAppearance,
    resetReminderSettings
  } = useDisplaySettings();

  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPendingPaise = customers
    .filter(c => c.status === 'pending')
    .reduce((acc, c) => acc + c.amount, 0);

  const handleExportCSV = () => {
    triggerHaptic('light');
    exportToCSV(customers);
  };

  const handleImportCSVClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.customers.length === 0) {
          setImportError('No valid customer records found in CSV.');
          return;
        }
        await onImportCustomers(parsed.customers);
        triggerHaptic('success');
        setImportSuccess(`Successfully imported ${parsed.customers.length} customers!`);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearDataClick = async () => {
    if (window.confirm('CRITICAL WARNING: This will permanently erase ALL customer records from local storage. Are you absolutely sure?')) {
      triggerHaptic('warning');
      await onClearAllData();
      alert('All local ledger data has been permanently cleared.');
      onClose();
    }
  };

  // Generate Reminder Live Preview Text
  const getReminderPreviewText = () => {
    const sampleReason = 'Groceries & Supplies';
    const amount = '₹1,250.00';
    const dueDate = reminderIncludeDueDate ? '29 Aug 2026' : '';

    const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.language === reminderLang && t.toneKey === (reminderTone === 'professional' ? 'due_today' : reminderTone === 'friendly' ? 'pre_due' : 'final'))
      || DEFAULT_TEMPLATES[0];

    let body = parseTemplate(defaultTemplate.text, {
      name: 'Dhrubesh',
      amount: amount,
      dueDate: dueDate || 'due date',
      reason: sampleReason,
      language: reminderLang
    });

    if (reminderIncludeShopName && shopName) {
      body += `\n— ${shopName}`;
    }

    return body;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bk-text-primary/40 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Settings Modal Container */}
      <div className="relative w-full max-w-lg max-h-[90dvh] sm:max-h-[85dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up sm:animate-fade-in">
        
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft shrink-0">
          <h2 className="font-extrabold text-bk-text-primary" style={{ fontSize: 'var(--app-heading-scale)' }}>
            Settings & Customization
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bk-border transition-colors text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Settings Category Navigation Tabs */}
        <div className="flex border-b border-bk-border bg-bk-surface-soft shrink-0 overflow-x-auto scrollbar-none px-2">
          {[
            { id: 'appearance', label: 'Appearance' },
            { id: 'reminders', label: 'Reminders' },
            { id: 'preferences', label: 'Preferences' },
            { id: 'data', label: 'Data & CSV' },
            { id: 'about', label: 'About' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id as TabType);
              }}
              className={`py-2.5 px-3 border-b-2 font-extrabold text-xs whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'border-bk-brand-primary text-bk-brand-primary'
                  : 'border-transparent text-bk-text-secondary hover:text-bk-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scroll Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 text-xs select-text">

          {/* 1. APPEARANCE & DISPLAY */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              
              {/* Text Size Section with Live Aa Previews */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2.5">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Text Size (Typography Only)</span>
                <p className="text-[11px] text-bk-text-tertiary">Adjusts typography readable scale without modifying layout geometry or screen bounds.</p>

                <div className="grid grid-cols-4 gap-1.5 select-none pt-1">
                  {[
                    { id: 'small', label: 'Small', sample: 'Aa' },
                    { id: 'standard', label: 'Standard', sample: 'Aa' },
                    { id: 'large', label: 'Large', sample: 'Aa' },
                    { id: 'extra-large', label: 'XL', sample: 'Aa' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTextScale(item.id as TextScale);
                      }}
                      className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        textScale === item.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      <span className={`font-black ${item.id === 'small' ? 'text-xs' : item.id === 'standard' ? 'text-sm' : item.id === 'large' ? 'text-base' : 'text-lg'}`}>
                        {item.sample}
                      </span>
                      <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* UI Density */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2.5">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">UI Density</span>
                <p className="text-[11px] text-bk-text-tertiary">Adjusts card paddings and component gaps subtle spacing.</p>

                <div className="grid grid-cols-3 gap-2 select-none">
                  {[
                    { id: 'compact', label: 'Compact', desc: 'Tighter spacing' },
                    { id: 'standard', label: 'Standard', desc: 'Balanced default' },
                    { id: 'comfortable', label: 'Comfortable', desc: 'Spacious padding' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setDensity(item.id as DensityMode);
                      }}
                      className={`py-2 px-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        density === item.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      <span className="font-bold text-xs">{item.label}</span>
                      <span className="text-[9px] text-bk-text-tertiary mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Width / Outer Screen Margin */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2.5">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Content Width & Screen Outer Margin</span>
                <p className="text-[11px] text-bk-text-tertiary">Prevents cards and controls from touching extreme screen edges on Android.</p>

                <div className="grid grid-cols-3 gap-2 select-none">
                  {[
                    { id: 'full', label: 'Full Width', margin: '0px' },
                    { id: 'standard', label: 'Standard (10px)', margin: '10px' },
                    { id: 'comfortable', label: 'Comfortable (16px)', margin: '16px' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setContentWidth(item.id as ContentWidthMode);
                      }}
                      className={`py-2 px-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        contentWidth === item.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      <span className="font-bold text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme / Appearance */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2.5">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Theme & Appearance</span>
                
                <div className="grid grid-cols-3 gap-2 select-none">
                  {[
                    { id: 'system', label: 'System Default' },
                    { id: 'light', label: 'Light Theme' },
                    { id: 'dark', label: 'Dark Theme' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTheme(t.id as ThemeMode);
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        theme === t.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion & Accessibility Toggles */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-3">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Motion & Feedback</span>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="font-semibold text-bk-text-primary">Reduce Animations & Transitions</span>
                  <input
                    type="checkbox"
                    checked={reduceMotion}
                    onChange={(e) => {
                      triggerHaptic('light');
                      setReduceMotion(e.target.checked);
                    }}
                    className="w-4 h-4 text-bk-brand-primary rounded border-bk-border focus:ring-bk-brand-primary accent-bk-brand-primary cursor-pointer"
                  />
                </label>

                <div className="flex items-center justify-between border-t border-bk-border/60 pt-2">
                  <span className="font-semibold text-bk-text-primary">Haptic Vibration Feedback</span>
                  <div className="flex gap-1">
                    {(['off', 'light', 'standard'] as HapticMode[]).map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setHapticFeedback(h);
                          if (h !== 'off') triggerHaptic('standard');
                        }}
                        className={`py-1 px-2 rounded-md border text-[11px] font-bold ${
                          hapticFeedback === h
                            ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary'
                            : 'border-bk-border bg-white text-bk-text-secondary'
                        }`}
                      >
                        {h === 'off' ? 'Off' : h === 'light' ? 'Light' : 'Std'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset Appearance Action */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset appearance settings to default recommended values?')) {
                    triggerHaptic('warning');
                    resetAppearance();
                  }
                }}
                className="w-full py-2 px-3 border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-brand-primary font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Reset Appearance Settings
              </button>

            </div>
          )}

          {/* 2. REMINDER SETTINGS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              
              {/* Language Selector */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Reminder Language</span>
                <div className="grid grid-cols-3 gap-2 select-none">
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'हिंदी (Hindi)' },
                    { id: 'bn', label: 'বাংলা (Bengali)' }
                  ].map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setReminderLang(l.id as ReminderLangMode);
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        reminderLang === l.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template / Tone Selector */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Reminder Tone & Style</span>
                <div className="grid grid-cols-3 gap-2 select-none">
                  {[
                    { id: 'professional', label: 'Professional' },
                    { id: 'friendly', label: 'Friendly' },
                    { id: 'short', label: 'Short / Minimal' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setReminderTone(t.id as ReminderToneMode);
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        reminderTone === t.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variables & Business Name Inputs */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-3">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Message Variables & Details</span>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="font-semibold text-bk-text-primary">Include Due Date in Reminder</span>
                  <input
                    type="checkbox"
                    checked={reminderIncludeDueDate}
                    onChange={(e) => {
                      triggerHaptic('light');
                      setReminderIncludeDueDate(e.target.checked);
                    }}
                    className="w-4 h-4 text-bk-brand-primary rounded border-bk-border focus:ring-bk-brand-primary accent-bk-brand-primary cursor-pointer"
                  />
                </label>

                <div className="space-y-2 border-t border-bk-border/60 pt-2">
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <span className="font-semibold text-bk-text-primary">Include Business / Store Name</span>
                    <input
                      type="checkbox"
                      checked={reminderIncludeShopName}
                      onChange={(e) => {
                        triggerHaptic('light');
                        setReminderIncludeShopName(e.target.checked);
                      }}
                      className="w-4 h-4 text-bk-brand-primary rounded border-bk-border focus:ring-bk-brand-primary accent-bk-brand-primary cursor-pointer"
                    />
                  </label>

                  {reminderIncludeShopName && (
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Gupta General Store"
                      className="w-full px-3 py-2 border border-bk-border rounded-lg bg-white text-bk-text-primary text-xs focus:outline-none focus:border-bk-brand-primary"
                    />
                  )}
                </div>
              </div>

              {/* WhatsApp Behavior Option */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">WhatsApp Action Behavior</span>
                <div className="grid grid-cols-2 gap-2 select-none">
                  {[
                    { id: 'confirm', label: 'Open with Preview' },
                    { id: 'direct', label: 'Open Directly' }
                  ].map(wb => (
                    <button
                      key={wb.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setWhatsappBehavior(wb.id as WhatsappBehaviorMode);
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        whatsappBehavior === wb.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      {wb.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Live Reminder Preview Card */}
              <div className="border-t border-bk-border pt-2 space-y-1.5">
                <span className="text-[10px] font-bold text-bk-text-tertiary uppercase tracking-wider block">Live Reminder Message Preview</span>
                <div className="bg-bk-surface border border-bk-border rounded-xl p-3.5 text-xs text-bk-text-primary leading-relaxed shadow-xs whitespace-pre-wrap font-sans">
                  {getReminderPreviewText()}
                </div>
              </div>

              {/* Reset Reminder Settings Action */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset reminder settings to standard defaults?')) {
                    triggerHaptic('warning');
                    resetReminderSettings();
                  }
                }}
                className="w-full py-2 px-3 border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-brand-primary font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Reset Reminder Settings
              </button>

            </div>
          )}

          {/* 3. PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              
              {/* Default Home Filter */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Default Home Filter</span>
                <div className="grid grid-cols-3 gap-1.5 select-none">
                  {[
                    { id: 'all', label: 'All Accounts' },
                    { id: 'pending', label: 'Pending Dues' },
                    { id: 'due_today', label: 'Due Today' },
                    { id: 'overdue', label: 'Overdue' },
                    { id: 'paid', label: 'Settled Paid' }
                  ].map(df => (
                    <button
                      key={df.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setDefaultFilter(df.id as DefaultFilterMode);
                      }}
                      className={`py-2 px-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                        defaultFilter === df.id
                          ? 'border-bk-brand-primary bg-bk-brand-primary/10 text-bk-brand-primary shadow-xs'
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      {df.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Confirmation Toggle */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Data Safety Toggles</span>

                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="font-semibold text-bk-text-primary">Confirm Before Deleting Customer Ledger</span>
                  <input
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={(e) => {
                      triggerHaptic('light');
                      setConfirmDelete(e.target.checked);
                    }}
                    className="w-4 h-4 text-bk-brand-primary rounded border-bk-border focus:ring-bk-brand-primary accent-bk-brand-primary cursor-pointer"
                  />
                </label>
              </div>

            </div>
          )}

          {/* 4. DATA & STORAGE */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              
              {/* Storage Overview */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-2">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">Local Ledger Overview</span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-lg border border-bk-border">
                    <span className="text-[10px] text-bk-text-tertiary font-bold uppercase block">Total Customers</span>
                    <span className="text-lg font-black text-bk-text-primary font-tabular-nums">{customers.length}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-bk-border">
                    <span className="text-[10px] text-bk-text-tertiary font-bold uppercase block">Total Outstanding Dues</span>
                    <span className="text-lg font-black text-bk-brand-primary font-tabular-nums">{formatIndianCurrency(totalPendingPaise)}</span>
                  </div>
                </div>
              </div>

              {/* CSV Import/Export */}
              <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-3.5 space-y-3">
                <span className="font-extrabold text-bk-text-primary uppercase tracking-wider block">CSV Data Backup & Import</span>

                {importError && (
                  <div className="p-2.5 bg-bk-status-overdue/10 border border-bk-status-overdue/30 text-bk-status-overdue rounded-lg text-xs font-semibold">
                    {importError}
                  </div>
                )}
                {importSuccess && (
                  <div className="p-2.5 bg-bk-status-paid/10 border border-bk-status-paid/30 text-bk-status-paid rounded-lg text-xs font-semibold">
                    {importSuccess}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 py-2 px-3 border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Export CSV Backup
                  </button>

                  <label className="flex-1 py-2 px-3 border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center">
                    Import CSV Backup
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSVClick}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-bk-status-overdue/5 border border-bk-status-overdue/20 rounded-xl p-3.5 space-y-2">
                <span className="font-extrabold text-bk-status-overdue uppercase tracking-wider block">Danger Zone</span>
                <button
                  onClick={handleClearDataClick}
                  className="w-full py-2.5 px-3 bg-bk-status-overdue text-white hover:bg-bk-brand-primary-pressed text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <TrashIcon size={14} />
                  Permanently Clear All Local Ledger Data
                </button>
              </div>

            </div>
          )}

          {/* 5. ABOUT */}
          {activeTab === 'about' && (
            <div className="bg-bk-surface-soft border border-bk-border rounded-xl p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="font-extrabold text-bk-text-primary text-base">BahiKhata (बहीखाता)</h3>
                <p className="text-bk-text-tertiary text-xs">Offline-First Mobile Ledger & Udhaar Management System</p>
              </div>

              <div className="border-t border-bk-border/60 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-bk-text-secondary">App Version</span>
                  <span className="font-bold text-bk-text-primary">1.0.0 (Production Release)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-bk-text-secondary">Storage Engine</span>
                  <span className="font-bold text-bk-status-paid">IndexedDB (100% Offline)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-bk-text-secondary">Data Privacy</span>
                  <span className="font-bold text-bk-status-paid">Private Local Device Storage</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Close Button */}
        <div className="p-4 pb-safe border-t border-bk-border bg-bk-surface-soft shrink-0">
          <button
            type="button"
            onClick={onClose}
            style={{ 
              height: 'var(--ui-button-height)', 
              fontSize: 'var(--app-input-scale)',
              borderRadius: 'var(--ui-border-radius)'
            }}
            className="w-full bg-bk-brand-primary text-white font-semibold cursor-pointer transition-all shadow-sm active:translate-y-[1px]"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
