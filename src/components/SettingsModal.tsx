import React, { useState } from 'react';
import { CloseIcon, TrashIcon, DownloadIcon, UploadIcon, InfoIcon, WhatsAppIcon, AlertCircleIcon } from './Icons';
import { Customer } from '../domain/customer';
import { exportToCSV, parseCSV } from '../domain/csvHelper';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { DEFAULT_TEMPLATES, parseTemplate } from '../domain/templates';
import { 
  useDisplaySettings, 
  TextScale, 
  DensityMode, 
  ThemeMode, 
  HapticMode, 
  ReminderLangMode, 
  ReminderToneMode 
} from '../context/DisplaySettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onImportCustomers: (customers: Omit<Customer, 'id' | 'status'>[]) => Promise<void>;
  onClearAllData: () => Promise<void>;
}

type TabType = 'business' | 'appearance' | 'data' | 'about';

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
    theme,
    reduceMotion,
    hapticFeedback,
    reminderLang,
    reminderTone,
    reminderIncludeDueDate,
    reminderIncludeShopName,
    shopName,
    setTextScale,
    setDensity,
    setTheme,
    setReduceMotion,
    setHapticFeedback,
    setReminderLang,
    setReminderTone,
    setReminderIncludeDueDate,
    setReminderIncludeShopName,
    setShopName,
    triggerHaptic,
    resetAppearance,
    resetReminderSettings
  } = useDisplaySettings();

  const [activeTab, setActiveTab] = useState<TabType>('business');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen) return null;

  const totalPendingPaise = customers
    .filter((c) => c.amount > 0)
    .reduce((acc, c) => acc + c.amount, 0);

  const handleExportCSV = () => {
    triggerHaptic('light');
    exportToCSV(customers);
  };

  const handleExportJSON = () => {
    triggerHaptic('light');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bahikhata_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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

  const handleClearDataFinal = async () => {
    if (confirmInput.toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm data erasure.');
      return;
    }

    triggerHaptic('warning');
    await onClearAllData();
    setShowClearConfirm(false);
    setConfirmInput('');
    alert('All local data has been permanently cleared.');
    onClose();
  };

  // Reminder sample preview generator
  const getReminderPreviewText = () => {
    const defaultTemplate =
      DEFAULT_TEMPLATES.find(
        (t) =>
          t.language === reminderLang &&
          t.toneKey === (reminderTone === 'friendly' ? 'pre_due' : reminderTone === 'professional' ? 'due_today' : 'overdue')
      ) || DEFAULT_TEMPLATES[0];

    let body = parseTemplate(defaultTemplate.text, {
      name: 'Ramesh Patel',
      amount: '₹1,500.00',
      dueDate: reminderIncludeDueDate ? 'Tomorrow' : '',
      reason: 'Grocery items',
      language: reminderLang
    });

    if (reminderIncludeShopName && shopName) {
      body += `\n— ${shopName}`;
    }

    return body;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bk-text-primary/40 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl max-h-[92dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1 bg-bk-border rounded-full mx-auto mt-2" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft/80 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight">
              Settings & Preferences
            </h3>
            <p className="text-xs text-bk-text-tertiary">
              Customize business details, reminders, appearance, and backup
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

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-bk-border bg-bk-surface px-4 gap-2 overflow-x-auto scrollbar-none shrink-0 select-none">
          {(
            [
              { id: 'business', label: 'Business & Reminders' },
              { id: 'appearance', label: 'Appearance' },
              { id: 'data', label: 'Data & Backup' },
              { id: 'about', label: 'About & Privacy' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id);
              }}
              className={`py-3 px-2 text-xs font-bold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'border-bk-brand-primary text-bk-brand-primary'
                  : 'border-transparent text-bk-text-secondary hover:text-bk-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 select-text">
          {/* TAB 1: Business & Reminders */}
          {activeTab === 'business' && (
            <div className="space-y-4">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. My General Store, Ramesh Kirana"
                  className="w-full px-3.5 py-2.5 border border-bk-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
                />
                <p className="text-[11px] text-bk-text-tertiary">
                  This name will be signed at the bottom of WhatsApp payment reminder messages.
                </p>
              </div>

              {/* Reminder Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Default Reminder Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'en', label: 'English' },
                      { id: 'hi', label: 'हिंदी (Hindi)' },
                      { id: 'bn', label: 'বাংলা (Bengali)' }
                    ] as const
                  ).map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setReminderLang(lang.id as ReminderLangMode);
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        reminderLang === lang.id
                          ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                          : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Default Reminder Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'friendly', label: 'Gentle / Pre-due' },
                      { id: 'professional', label: 'Standard / Due Today' },
                      { id: 'short', label: 'Urgent / Overdue' }
                    ] as const
                  ).map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setReminderTone(tone.id as ReminderToneMode);
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        reminderTone === tone.id
                          ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                          : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3 bg-bk-surface-soft border border-bk-border rounded-xl space-y-2.5">
                <label className="flex items-center justify-between text-xs font-bold text-bk-text-primary cursor-pointer select-none">
                  <span>Include Due Date in reminder message</span>
                  <input
                    type="checkbox"
                    checked={reminderIncludeDueDate}
                    onChange={(e) => setReminderIncludeDueDate(e.target.checked)}
                    className="w-4 h-4 rounded text-bk-brand-primary focus:ring-bk-brand-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-bold text-bk-text-primary cursor-pointer select-none">
                  <span>Include Business Name signature in footer</span>
                  <input
                    type="checkbox"
                    checked={reminderIncludeShopName}
                    onChange={(e) => setReminderIncludeShopName(e.target.checked)}
                    className="w-4 h-4 rounded text-bk-brand-primary focus:ring-bk-brand-primary cursor-pointer"
                  />
                </label>
              </div>

              {/* Message Live Preview Box */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-bk-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <WhatsAppIcon size={14} className="text-bk-status-paid" />
                  <span>Sample WhatsApp Message Preview</span>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-950 whitespace-pre-wrap font-sans leading-relaxed">
                  {getReminderPreviewText()}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={resetReminderSettings}
                  className="text-xs text-bk-text-tertiary hover:text-bk-text-primary underline cursor-pointer"
                >
                  Reset Reminder Defaults
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Text Scale */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Text Size (Typography Scale)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'standard', label: 'Standard (100%)' },
                      { id: 'large', label: 'Large (110%)' },
                      { id: 'extra-large', label: 'Extra Large (120%)' }
                    ] as const
                  ).map((scale) => (
                    <button
                      key={scale.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTextScale(scale.id as TextScale);
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        textScale === scale.id
                          ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                          : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                      }`}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-bk-text-tertiary">
                  Scales text size cleanly without distorting layout width or button dimensions.
                </p>
              </div>

              {/* Density Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Layout Density
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'standard', label: 'Standard' },
                      { id: 'compact', label: 'Compact' }
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setDensity(d.id as DensityMode);
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        density === d.id
                          ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                          : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  App Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'system', label: 'System Default' },
                      { id: 'light', label: 'Light' },
                      { id: 'dark', label: 'Dark' }
                    ] as const
                  ).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setTheme(th.id as ThemeMode);
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        theme === th.id
                          ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                          : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Haptic Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Vibration & Haptic Feedback
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'standard', label: 'Standard' },
                      { id: 'light', label: 'Subtle' },
                      { id: 'off', label: 'Off' }
                    ] as const
                  ).map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setHapticFeedback(h.id as HapticMode);
                        if (h.id !== 'off' && typeof navigator !== 'undefined' && navigator.vibrate) {
                          navigator.vibrate(20);
                        }
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        hapticFeedback === h.id
                          ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                          : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduce Motion */}
              <label className="p-3 bg-bk-surface-soft border border-bk-border rounded-xl flex items-center justify-between text-xs font-bold text-bk-text-primary cursor-pointer select-none">
                <span>Reduce Animations and Transitions</span>
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={(e) => setReduceMotion(e.target.checked)}
                  className="w-4 h-4 rounded text-bk-brand-primary focus:ring-bk-brand-primary cursor-pointer"
                />
              </label>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={resetAppearance}
                  className="text-xs text-bk-text-tertiary hover:text-bk-text-primary underline cursor-pointer"
                >
                  Reset Appearance Defaults
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Data & Backup */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Data Summary Stats Card */}
              <div className="p-4 bg-bk-surface-soft border border-bk-border rounded-xl space-y-2">
                <div className="text-xs font-bold text-bk-text-primary uppercase tracking-wider">
                  Storage Summary
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="text-lg font-bold font-mono text-bk-text-primary">{customers.length}</div>
                    <div className="text-[11px] text-bk-text-secondary">Customer Ledgers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold font-mono text-bk-status-overdue">
                      {formatIndianCurrency(totalPendingPaise)}
                    </div>
                    <div className="text-[11px] text-bk-text-secondary">Total Active Dues</div>
                  </div>
                </div>
                <p className="text-[11px] text-bk-text-tertiary pt-1 border-t border-bk-border">
                  🔒 Stored 100% locally on your device in IndexedDB (`bahikhata_db`). Zero cloud servers.
                </p>
              </div>

              {/* Backup & Export */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Export & Backup Ledger
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="p-3 bg-white border border-bk-border hover:border-bk-brand-primary rounded-xl text-xs font-bold text-bk-text-primary flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all"
                  >
                    <DownloadIcon size={16} />
                    <span>Export as CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="p-3 bg-white border border-bk-border hover:border-bk-brand-primary rounded-xl text-xs font-bold text-bk-text-primary flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all"
                  >
                    <DownloadIcon size={16} />
                    <span>Backup Full JSON</span>
                  </button>
                </div>
              </div>

              {/* Import CSV */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
                  Import Customers from CSV
                </label>
                <label className="p-3 bg-white border border-dashed border-bk-border hover:border-bk-brand-primary rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-bk-brand-primary cursor-pointer transition-all">
                  <UploadIcon size={16} />
                  <span>Choose CSV File to Import</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportCSVClick}
                    className="hidden"
                  />
                </label>

                {importSuccess && (
                  <p className="text-xs text-bk-status-paid font-bold p-2 bg-green-50 rounded-lg">
                    {importSuccess}
                  </p>
                )}
                {importError && (
                  <p className="text-xs text-bk-status-overdue font-bold p-2 bg-red-50 rounded-lg">
                    {importError}
                  </p>
                )}
              </div>

              {/* Danger Zone: Clear Data */}
              <div className="pt-2 border-t border-bk-border space-y-2">
                <label className="text-xs font-bold text-bk-status-overdue uppercase tracking-wider block">
                  Danger Zone
                </label>

                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full p-2.5 bg-red-50 hover:bg-red-100 text-bk-status-overdue border border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <TrashIcon size={15} />
                    <span>Erase All Khata Data</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-xl space-y-2.5 animate-fade-in">
                    <div className="flex items-start gap-2 text-xs text-red-900 font-bold">
                      <AlertCircleIcon size={16} className="text-red-700 shrink-0 mt-0.5" />
                      <span>Permanently delete all customer records and transactions? This cannot be undone.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-red-800 font-semibold block">
                        Type <strong>DELETE</strong> to confirm:
                      </label>
                      <input
                        type="text"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        placeholder="Type DELETE"
                        className="w-full px-3 py-1.5 border border-red-300 rounded-lg text-xs font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowClearConfirm(false);
                          setConfirmInput('');
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleClearDataFinal}
                        className="px-4 py-1.5 bg-bk-status-overdue text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer hover:bg-red-700"
                      >
                        Permanently Delete Everything
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: About & Privacy */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 bg-bk-surface-soft border border-bk-border rounded-xl space-y-2">
                <h4 className="text-sm font-extrabold text-bk-text-primary">BahiKhata (बहीखाता)</h4>
                <p className="text-xs text-bk-text-secondary leading-relaxed">
                  A modern, privacy-focused, 100% offline-first digital ledger for shopkeepers, tutors, and small merchants.
                </p>
                <div className="text-[11px] font-mono text-bk-text-tertiary pt-1 border-t border-bk-border">
                  Version 2.0.0 • React 19 • TailwindCSS v4 • Capacitor v8 • IndexedDB
                </div>
              </div>

              <div className="p-3.5 bg-white border border-bk-border rounded-xl space-y-2">
                <div className="text-xs font-bold text-bk-text-primary flex items-center gap-1.5">
                  <InfoIcon size={15} className="text-bk-brand-primary" />
                  <span>Privacy & Security Guarantees</span>
                </div>
                <ul className="text-xs text-bk-text-secondary space-y-1 list-disc pl-4 leading-relaxed">
                  <li><strong>Zero Cloud Tracking:</strong> No remote servers, no user accounts, no analytics.</li>
                  <li><strong>Integer Paise Precision:</strong> Currency dues are calculated in integer paise to eliminate floating-point rounding errors.</li>
                  <li><strong>Device Privacy:</strong> Contacts selected via the Android contact picker are processed entirely on-device and never transmitted anywhere.</li>
                  <li><strong>Controlled Sending:</strong> Reminders open standard WhatsApp links on your device; you always retain final control before sending.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-bk-border bg-bk-surface-soft/80 flex items-center justify-between text-xs text-bk-text-tertiary">
          <span>BahiKhata • 100% Offline Digital Ledger</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-bk-border rounded-xl font-bold text-bk-text-secondary hover:text-bk-text-primary transition-all cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
