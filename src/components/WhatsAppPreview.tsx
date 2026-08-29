import React, { useState, useEffect } from 'react';
import { CloseIcon, WhatsAppIcon } from './Icons';
import { Customer } from '../domain/customer';
import { ToneKey, LanguageKey, Template, DEFAULT_TEMPLATES, parseTemplate } from '../domain/templates';
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
  const [language, setLanguage] = useState<LanguageKey>('en');
  const [tone, setTone] = useState<ToneKey>('due_today');
  const [messageText, setMessageText] = useState('');
  
  // App opened status flag
  const [whatsappOpened, setWhatsappOpened] = useState(false);

  // Load custom templates and initialize language
  const [templates, setTemplates] = useState<Template[]>([]);

  const { reminderLang, reminderIncludeDueDate, reminderIncludeShopName, shopName } = useDisplaySettings();

  useEffect(() => {
    if (!customer) return;

    setLanguage(reminderLang);

    // Set tone based on due date classification
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (!customer.dueDate) {
      setTone('pre_due');
    } else if (customer.dueDate === todayStr) {
      setTone('due_today');
    } else if (customer.dueDate < todayStr) {
      setTone('overdue');
    } else {
      setTone('pre_due');
    }

    // Load templates
    const saved = localStorage.getItem('bk_custom_templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch {
        setTemplates([...DEFAULT_TEMPLATES]);
      }
    } else {
      setTemplates([...DEFAULT_TEMPLATES]);
    }
    
    setWhatsappOpened(false);
  }, [customer, isOpen, reminderLang]);

  // Re-generate message text when language, tone, customer details, or templates change
  useEffect(() => {
    if (!customer || templates.length === 0) return;

    const template = templates.find(t => t.language === language && t.toneKey === tone) 
      || DEFAULT_TEMPLATES.find(t => t.language === language && t.toneKey === tone);

    if (template) {
      const formattedAmount = formatIndianCurrency(customer.amount);
      const formattedDueDate = (reminderIncludeDueDate && customer.dueDate) ? formatDisplayDate(customer.dueDate) : '';
      
      let parsed = parseTemplate(template.text, {
        name: customer.name,
        amount: formattedAmount,
        dueDate: formattedDueDate || 'due date'
      });

      if (reminderIncludeShopName && shopName) {
        parsed += `\n— ${shopName}`;
      }

      setMessageText(parsed);
    }
  }, [customer, language, tone, templates, reminderIncludeDueDate, reminderIncludeShopName, shopName]);

  if (!isOpen || !customer) return null;

  const handleSend = () => {
    // 1. Encode text
    const encodedText = encodeURIComponent(messageText);
    
    // 2. Build deep link
    const waLink = `https://wa.me/${customer.phone}?text=${encodedText}`;
    
    // 3. Mark in UI
    setWhatsappOpened(true);
    
    // 4. Update reminder timestamp in database
    const timestamp = new Date().toISOString();
    onReminderSent(customer.id, timestamp);

    // 5. Open URL link
    window.open(waLink, '_blank');
  };

  const formattedPhone = customer.phone.startsWith('91') && customer.phone.length === 12
    ? `+91 ${customer.phone.substring(2, 7)} ${customer.phone.substring(7)}`
    : customer.phone;

  // Get initials for profile placeholder
  const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-bk-text-primary/40 backdrop-blur-xs animate-fade-in select-none p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Mobile-First Sliding Sheet Panel */}
      <div className="relative w-full max-w-xl max-h-[90dvh] sm:max-h-[85dvh] bg-bk-surface border-t sm:border border-bk-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="p-bk-md border-b border-bk-border flex items-center justify-between bg-bk-surface-soft">
          <h2 className="text-lg font-extrabold text-bk-text-primary">Prepare Payment Reminder</h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-bk-border transition-colors text-bk-text-tertiary hover:text-bk-text-primary cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Composer & Realistic Mockup Container */}
        <div className="flex-1 overflow-y-auto p-bk-md space-y-bk-md flex flex-col justify-between select-text">
          <div className="space-y-bk-md text-sm">
            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">Reminder Tone Level</label>
              <div className="grid grid-cols-4 gap-2">
                {(['pre_due', 'due_today', 'overdue', 'final'] as const).map(tKey => {
                  const label = tKey === 'pre_due' ? 'Gentle' : tKey === 'due_today' ? 'Due Today' : tKey === 'overdue' ? 'Overdue' : 'Final';
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => setTone(tKey)}
                      className={`py-2 rounded-bk-md border font-bold text-xs text-center cursor-pointer transition-all duration-150 ${
                        tone === tKey 
                          ? 'border-bk-brand-primary bg-bk-brand-primary/5 text-bk-brand-primary shadow-xs' 
                          : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">Message Language</label>
              <div className="grid grid-cols-3 gap-2">
                {(['en', 'hi', 'bn'] as const).map(langKey => (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => setLanguage(langKey)}
                    className={`py-2 rounded-bk-md border font-bold text-xs text-center cursor-pointer transition-all duration-150 ${
                      language === langKey 
                        ? 'border-bk-brand-primary bg-bk-brand-primary/5 text-bk-brand-primary shadow-xs' 
                        : 'border-bk-border bg-white text-bk-text-secondary hover:bg-bk-surface-soft'
                    }`}
                  >
                    {langKey === 'en' ? 'English' : langKey === 'hi' ? 'हिंदी (Hindi)' : 'বাংলা (Bengali)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Customizer Text Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-bk-text-secondary uppercase tracking-wider block">Message Text Editor</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full text-xs p-3 border border-bk-border rounded-bk-md bg-white text-bk-text-primary h-28 focus:outline-none focus:ring-1 focus:ring-bk-brand-primary focus:border-bk-brand-primary resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Premium WhatsApp Message Mockup Bubble */}
          <div className="space-y-2 mt-4 select-none">
            <span className="text-[10px] font-bold text-bk-text-tertiary uppercase tracking-wider block">WhatsApp Output Preview</span>
            <div className="w-full bg-[#efeae2] border border-bk-border rounded-bk-lg overflow-hidden relative shadow-inner">
              {/* WhatsApp Mock Navbar */}
              <div className="bg-[#075e54] text-white p-2.5 flex items-center gap-2.5">
                <span className="text-white">←</span>
                {/* Avatar Placeholder */}
                <div className="w-8 h-8 rounded-full bg-[#128c7e] border border-white/20 flex items-center justify-center text-xs font-black text-white">
                  {initials}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight text-white">{customer.name}</h4>
                  <p className="text-[9px] text-white/80 leading-none">{formattedPhone}</p>
                </div>
              </div>

              {/* Wallpaper chat area */}
              <div className="relative p-bk-md h-40 overflow-y-auto flex flex-col justify-end">
                {/* Wallpaper pattern backing */}
                <div className="absolute inset-0 opacity-[0.03] bg-repeat pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }} />
                
                {/* Outgoing Message bubble */}
                <div className="relative self-end max-w-[85%] bg-[#d9fdd3] text-[#111b21] rounded-bk-lg p-2.5 shadow-xs text-xs border border-[#c1e2b9] whitespace-pre-wrap leading-relaxed">
                  {messageText}
                  {/* Bubble Mock Arrow */}
                  <div className="absolute top-0 -right-1 w-2 h-2.5 bg-[#d9fdd3] border-r border-[#c1e2b9]" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                  
                  {/* Message timestamp */}
                  <div className="text-[8px] text-[#667781] text-right mt-1 font-semibold">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Prepared
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 pb-safe border-t border-bk-border bg-bk-surface-soft flex flex-col gap-2 shrink-0">
          {whatsappOpened && (
            <div className="p-2 border border-bk-brand-accent/20 bg-bk-brand-accent/5 text-bk-brand-accent rounded-bk-md text-[10px] font-bold text-center flex items-center justify-center gap-1">
              <span>ℹ️</span> WhatsApp link opened. Send the message in WhatsApp to finish delivery!
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-bk-border bg-white hover:bg-bk-surface-soft text-bk-text-secondary hover:text-bk-text-primary font-semibold rounded-bk-md transition-colors duration-150 cursor-pointer text-center text-sm"
            >
              Back
            </button>
            <button
              onClick={handleSend}
              className="flex-2 h-10 bg-[#25d366] hover:bg-[#128c7e] text-white font-bold rounded-bk-md transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2 text-sm shadow-sm active:translate-y-[1px]"
            >
              <WhatsAppIcon size={18} />
              Open in WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
