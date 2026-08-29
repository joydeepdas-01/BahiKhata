import React from 'react';
import { InfoIcon, CheckIcon } from './Icons';
import { BahiKhataLogo } from './BahiKhataLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bk-text-primary/30 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-bk-surface border border-bk-border rounded-bk-lg shadow-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Decorative Header Accent (Khaata Red gradient rail) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-bk-brand-primary via-bk-brand-accent to-bk-brand-primary" />
        
        <div className="p-bk-lg overflow-y-auto flex-1">
          {/* App Logo & Title */}
          <div className="flex flex-col items-center mb-bk-md">
            <BahiKhataLogo size={44} className="mb-bk-xs text-bk-brand-primary" />
            <h2 className="text-2xl font-extrabold tracking-tight text-bk-text-primary">Welcome to BahiKhata</h2>
            <p className="text-sm text-bk-text-secondary mt-1 text-center">Your simple, privacy-first ledger & payment reminder assistant.</p>
          </div>

          {/* Privacy Banner */}
          <div className="flex items-start gap-3 p-bk-sm bg-bk-surface-soft border border-bk-border rounded-bk-md mb-bk-md text-sm text-bk-text-secondary">
            <div className="text-bk-brand-primary shrink-0 mt-0.5">
              <InfoIcon size={18} />
            </div>
            <div>
              <span className="font-bold text-bk-text-primary">100% Offline & Private:</span> Your customer and transaction data is stored only on this device. We have no servers, no logins, and zero cloud tracking. Your data belongs entirely to you.
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-bk-md">
            <h3 className="text-xs font-bold text-bk-text-tertiary uppercase tracking-wider">How to use BahiKhata:</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-bk-brand-primary/10 text-bk-brand-primary text-xs font-bold shrink-0">1</span>
                <div>
                  <h4 className="font-semibold text-bk-text-primary">Add Customers & Credit</h4>
                  <p className="text-xs text-bk-text-secondary mt-0.5">Add customer names, mobile numbers, and credit amounts. You can set optional due dates.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-bk-brand-primary/10 text-bk-brand-primary text-xs font-bold shrink-0">2</span>
                <div>
                  <h4 className="font-semibold text-bk-text-primary">Choose Reminder Tones</h4>
                  <p className="text-xs text-bk-text-secondary mt-0.5">Select English, Hindi, or Bengali templates. Choose tone levels ranging from Gentle reminders to Final notices.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-bk-brand-primary/10 text-bk-brand-primary text-xs font-bold shrink-0">3</span>
                <div>
                  <h4 className="font-semibold text-bk-text-primary">Send via WhatsApp</h4>
                  <p className="text-xs text-bk-text-secondary mt-0.5">Tap send to automatically compile the message and open WhatsApp on your phone or web browser to send it.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-bk-brand-primary/10 text-bk-brand-primary text-xs font-bold shrink-0">4</span>
                <div>
                  <h4 className="font-semibold text-bk-text-primary">Keep Backups</h4>
                  <p className="text-xs text-bk-text-secondary mt-0.5">Use spreadsheet copy-paste or CSV export in settings to keep safe backups of your customers on your device.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-bk-md bg-bk-surface-soft border-t border-bk-border flex justify-end">
          <button
            onClick={onClose}
            className="px-bk-lg py-2 bg-bk-brand-primary hover:bg-bk-brand-primary-hover active:bg-bk-brand-primary-pressed text-white text-sm font-semibold rounded-bk-md transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-sm active:translate-y-[1px]"
          >
            <CheckIcon size={16} />
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};
