import React, { useState, useMemo } from 'react';
import { CloseIcon, WhatsAppIcon } from './Icons';
import { Customer } from '../domain/customer';
import { ToneKey, LanguageKey, DEFAULT_TEMPLATES, parseTemplate } from '../domain/templates';
import { formatIndianCurrency } from '../domain/amountFormatter';
import { formatDisplayDate } from '../domain/dateClassifier';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

interface WhatsAppPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onReminderSent: (customerId: string, timestamp: string) => Promise<void>;
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
  isOpen,
  onClose,
  customer,
  onReminderSent
}) => {
  const { reminderLang, reminderIncludeDueDate, reminderIncludeShopName, shopName, triggerHaptic } = useDisplaySettings();

  const [language, setLanguage] = useState<LanguageKey>(reminderLang);
  const [tone, setTone] = useState<ToneKey>('due_today');
  const [editedText, setEditedText] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  // Compute default suggested tone based on customer due date
  const suggestedTone: ToneKey = useMemo(() => {
    if (!customer?.dueDate) return 'pre_due';
    const today = new Date().toISOString().split('T')[0];
    if (customer.dueDate === today) return 'due_today';
    if (customer.dueDate < today) return 'overdue';
    return 'pre_due';
  }, [customer?.dueDate]);

  // Active tone defaults to suggested tone unless manually switched
  const currentTone = tone || suggestedTone;

  // Generate rendered reminder message
  const generatedMessage = useMemo(() => {
    if (!customer) return '';

    const template =
      DEFAULT_TEMPLATES.find((t) => t.language === language && t.toneKey === currentTone) ||
      DEFAULT_TEMPLATES[0];

    const duePaise = customer.receivablePaise ?? (customer.amount > 0 ? customer.amount : 0);
    const formattedAmount = formatIndianCurrency(duePaise);
    const formattedDueDate = reminderIncludeDueDate && customer.dueDate ? formatDisplayDate(customer.dueDate) : '';

    let parsed = parseTemplate(template.text, {
      name: customer.name,
      amount: formattedAmount,
      dueDate: formattedDueDate || 'due date',
      reason: customer.note || '',
      language: language
    });

    if (reminderIncludeShopName && shopName) {
      parsed += `\n— ${shopName}`;
    }

    return parsed;
  }, [customer, language, currentTone, reminderIncludeDueDate, reminderIncludeShopName, shopName]);

  const activeMessageText = editedText !== null ? editedText : generatedMessage;

  if (!isOpen || !customer) return null;

  const handleSend = () => {
    triggerHaptic('standard');

    // 1. Encode text
    const encodedText = encodeURIComponent(activeMessageText);

    // 2. Build deep link
    const waLink = `https://wa.me/${customer.phone}?text=${encodedText}`;

    // 3. Mark sent timestamp in local ledger
    const timestamp = new Date().toISOString();
    onReminderSent(customer.id, timestamp);
    setIsSent(true);

    // 4. Open WhatsApp
    window.open(waLink, '_blank');
  };

  const formattedPhone =
    customer.phone.startsWith('91') && customer.phone.length === 12
      ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
      : customer.phone;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-bk-text-primary/40 backdrop-blur-xs select-none p-0 sm:p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[92dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1 bg-bk-border rounded-full mx-auto mt-2" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-bk-border flex items-center justify-between bg-bk-surface-soft/80 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-bk-text-primary tracking-tight">
              Prepare WhatsApp Reminder
            </h3>
            <p className="text-xs text-bk-text-tertiary">
              For {customer.name} ({formattedPhone})
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

        {/* Composer & Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 select-text">
          {/* Tone Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
              Reminder Tone
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'pre_due', label: 'Gentle' },
                  { id: 'due_today', label: 'Due Today' },
                  { id: 'overdue', label: 'Overdue' },
                  { id: 'final', label: 'Final' }
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setTone(t.id);
                    setEditedText(null); // Reset manual edits when tone changes
                  }}
                  className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    currentTone === t.id
                      ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                      : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider block">
              Message Language
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
                    setLanguage(lang.id);
                    setEditedText(null); // Reset manual edits when language changes
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    language === lang.id
                      ? 'bg-bk-brand-primary text-white border-bk-brand-primary shadow-2xs'
                      : 'bg-white text-bk-text-secondary border-bk-border hover:bg-bk-surface-soft'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Realistic WhatsApp Chat Bubble Mockup */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-bk-text-secondary uppercase tracking-wider">
                Live WhatsApp Message Preview
              </label>
              {editedText !== null && (
                <button
                  type="button"
                  onClick={() => setEditedText(null)}
                  className="text-[11px] text-bk-brand-primary hover:underline cursor-pointer"
                >
                  Reset to Template
                </button>
              )}
            </div>

            {/* Chat Canvas */}
            <div className="bg-[#efeae2] p-4 rounded-2xl border border-[#d1d7db] shadow-inner space-y-2">
              <div className="text-center">
                <span className="text-[10px] font-bold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full shadow-2xs uppercase">
                  Today
                </span>
              </div>

              {/* Chat Bubble */}
              <div className="max-w-[85%] ml-auto bg-[#d9fdd3] text-[#111b21] p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text font-sans">
                {activeMessageText}
                <div className="text-[9px] text-[#667781] text-right mt-1 select-none flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-blue-500">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Direct Editor */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-bk-text-secondary uppercase">
              Edit Message Text Manually
            </label>
            <textarea
              rows={3}
              value={activeMessageText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-2.5 border border-bk-border rounded-xl text-xs bg-white text-bk-text-primary focus:outline-none focus:ring-2 focus:ring-bk-brand-primary/20 focus:border-bk-brand-primary"
            />
          </div>

          {isSent && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-900 flex items-center gap-2">
              <span>✓ WhatsApp opened. Reminder timestamp saved to customer ledger.</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-bk-border bg-bk-surface-soft/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-bk-border rounded-xl text-xs font-bold text-bk-text-secondary hover:text-bk-text-primary bg-white cursor-pointer shadow-2xs"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="px-6 py-2.5 bg-[#25d366] hover:bg-[#20ba5a] active:bg-[#1caa51] text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all active:translate-y-[1px]"
          >
            <WhatsAppIcon size={16} />
            <span>Open in WhatsApp &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
