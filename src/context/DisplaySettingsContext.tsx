import React, { createContext, useContext, useState, useEffect } from 'react';

export type TextScale = 'standard' | 'large' | 'extra-large';
export type DensityMode = 'compact' | 'standard';
export type ThemeMode = 'system' | 'light' | 'dark';
export type HapticMode = 'off' | 'light' | 'standard';
export type ReminderLangMode = 'en' | 'hi' | 'bn';
export type ReminderToneMode = 'professional' | 'friendly' | 'short';
export type DefaultFilterMode = 'all' | 'pending' | 'due_today' | 'overdue' | 'paid';

export interface AppPreferencesState {
  textScale: TextScale;
  density: DensityMode;
  theme: ThemeMode;
  reduceMotion: boolean;
  hapticFeedback: HapticMode;
  reminderLang: ReminderLangMode;
  reminderTone: ReminderToneMode;
  reminderIncludeDueDate: boolean;
  reminderIncludeShopName: boolean;
  shopName: string;
  defaultFilter: DefaultFilterMode;
  confirmDelete: boolean;
}

export interface DisplaySettingsContextType extends AppPreferencesState {
  setTextScale: (val: TextScale) => void;
  setDensity: (val: DensityMode) => void;
  setTheme: (val: ThemeMode) => void;
  setReduceMotion: (val: boolean) => void;
  setHapticFeedback: (val: HapticMode) => void;
  setReminderLang: (val: ReminderLangMode) => void;
  setReminderTone: (val: ReminderToneMode) => void;
  setReminderIncludeDueDate: (val: boolean) => void;
  setReminderIncludeShopName: (val: boolean) => void;
  setShopName: (val: string) => void;
  setDefaultFilter: (val: DefaultFilterMode) => void;
  setConfirmDelete: (val: boolean) => void;

  triggerHaptic: (pattern?: 'light' | 'standard' | 'success' | 'warning') => void;
  resetAppearance: () => void;
  resetReminderSettings: () => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

const KEYS = {
  TEXT_SCALE: 'bk_text_scale',
  DENSITY: 'bk_density',
  THEME: 'bk_theme',
  REDUCE_MOTION: 'bk_reduce_motion',
  HAPTIC_FEEDBACK: 'bk_haptic_feedback',
  REMINDER_LANG: 'bk_reminder_lang',
  REMINDER_TONE: 'bk_reminder_tone',
  REMINDER_DUE_DATE: 'bk_reminder_include_due_date',
  REMINDER_SHOP_NAME: 'bk_reminder_include_shop_name',
  SHOP_NAME: 'bk_shop_name',
  DEFAULT_FILTER: 'bk_default_filter',
  CONFIRM_DELETE: 'bk_confirm_delete'
};

export const DisplaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [textScale, setTextScaleState] = useState<TextScale>(() => (localStorage.getItem(KEYS.TEXT_SCALE) as TextScale) || 'standard');
  const [density, setDensityState] = useState<DensityMode>(() => (localStorage.getItem(KEYS.DENSITY) as DensityMode) || 'standard');
  const [theme, setThemeState] = useState<ThemeMode>(() => (localStorage.getItem(KEYS.THEME) as ThemeMode) || 'system');
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => localStorage.getItem(KEYS.REDUCE_MOTION) === 'true');
  const [hapticFeedback, setHapticFeedbackState] = useState<HapticMode>(() => (localStorage.getItem(KEYS.HAPTIC_FEEDBACK) as HapticMode) || 'standard');

  const [reminderLang, setReminderLangState] = useState<ReminderLangMode>(() => (localStorage.getItem(KEYS.REMINDER_LANG) as ReminderLangMode) || 'en');
  const [reminderTone, setReminderToneState] = useState<ReminderToneMode>(() => (localStorage.getItem(KEYS.REMINDER_TONE) as ReminderToneMode) || 'professional');
  const [reminderIncludeDueDate, setReminderIncludeDueDateState] = useState<boolean>(() => localStorage.getItem(KEYS.REMINDER_DUE_DATE) !== 'false');
  const [reminderIncludeShopName, setReminderIncludeShopNameState] = useState<boolean>(() => localStorage.getItem(KEYS.REMINDER_SHOP_NAME) !== 'false');
  const [shopName, setShopNameState] = useState<string>(() => localStorage.getItem(KEYS.SHOP_NAME) || 'My Khata');

  const [defaultFilter, setDefaultFilterState] = useState<DefaultFilterMode>(() => (localStorage.getItem(KEYS.DEFAULT_FILTER) as DefaultFilterMode) || 'all');
  const [confirmDelete, setConfirmDeleteState] = useState<boolean>(() => localStorage.getItem(KEYS.CONFIRM_DELETE) !== 'false');

  useEffect(() => {
    document.documentElement.setAttribute('data-text-scale', textScale);
    localStorage.setItem(KEYS.TEXT_SCALE, textScale);
  }, [textScale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem(KEYS.DENSITY, density);
  }, [density]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-motion', reduceMotion ? 'true' : 'false');
    localStorage.setItem(KEYS.REDUCE_MOTION, reduceMotion ? 'true' : 'false');
  }, [reduceMotion]);

  useEffect(() => {
    localStorage.setItem(KEYS.HAPTIC_FEEDBACK, hapticFeedback);
  }, [hapticFeedback]);

  useEffect(() => {
    localStorage.setItem(KEYS.REMINDER_LANG, reminderLang);
    localStorage.setItem('bk_default_lang', reminderLang);
  }, [reminderLang]);

  useEffect(() => {
    localStorage.setItem(KEYS.REMINDER_TONE, reminderTone);
  }, [reminderTone]);

  useEffect(() => {
    localStorage.setItem(KEYS.REMINDER_DUE_DATE, reminderIncludeDueDate ? 'true' : 'false');
  }, [reminderIncludeDueDate]);

  useEffect(() => {
    localStorage.setItem(KEYS.REMINDER_SHOP_NAME, reminderIncludeShopName ? 'true' : 'false');
  }, [reminderIncludeShopName]);

  useEffect(() => {
    localStorage.setItem(KEYS.SHOP_NAME, shopName);
  }, [shopName]);

  useEffect(() => {
    localStorage.setItem(KEYS.DEFAULT_FILTER, defaultFilter);
  }, [defaultFilter]);

  useEffect(() => {
    localStorage.setItem(KEYS.CONFIRM_DELETE, confirmDelete ? 'true' : 'false');
  }, [confirmDelete]);

  const setTextScale = (val: TextScale) => setTextScaleState(val);
  const setDensity = (val: DensityMode) => setDensityState(val);
  const setTheme = (val: ThemeMode) => setThemeState(val);
  const setReduceMotion = (val: boolean) => setReduceMotionState(val);
  const setHapticFeedback = (val: HapticMode) => setHapticFeedbackState(val);

  const setReminderLang = (val: ReminderLangMode) => setReminderLangState(val);
  const setReminderTone = (val: ReminderToneMode) => setReminderToneState(val);
  const setReminderIncludeDueDate = (val: boolean) => setReminderIncludeDueDateState(val);
  const setReminderIncludeShopName = (val: boolean) => setReminderIncludeShopNameState(val);
  const setShopName = (val: string) => setShopNameState(val);

  const setDefaultFilter = (val: DefaultFilterMode) => setDefaultFilterState(val);
  const setConfirmDelete = (val: boolean) => setConfirmDeleteState(val);

  const triggerHaptic = (pattern: 'light' | 'standard' | 'success' | 'warning' = 'light') => {
    if (hapticFeedback === 'off' || typeof navigator === 'undefined' || !navigator.vibrate) return;

    try {
      if (pattern === 'light') {
        navigator.vibrate(10);
      } else if (pattern === 'standard') {
        navigator.vibrate(25);
      } else if (pattern === 'success') {
        navigator.vibrate([15, 40, 15]);
      } else if (pattern === 'warning') {
        navigator.vibrate([30, 60, 30]);
      }
    } catch {
      // Ignore vibration errors on unsupported runtimes
    }
  };

  const resetAppearance = () => {
    setTextScale('standard');
    setDensity('standard');
    setTheme('system');
    setReduceMotion(false);
    setHapticFeedback('standard');
  };

  const resetReminderSettings = () => {
    setReminderLang('en');
    setReminderTone('professional');
    setReminderIncludeDueDate(true);
    setReminderIncludeShopName(true);
    setShopName('My Khata');
  };

  return (
    <DisplaySettingsContext.Provider
      value={{
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
        defaultFilter,
        confirmDelete,
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
        setDefaultFilter,
        setConfirmDelete,
        triggerHaptic,
        resetAppearance,
        resetReminderSettings
      }}
    >
      {children}
    </DisplaySettingsContext.Provider>
  );
};

export const useDisplaySettings = (): DisplaySettingsContextType => {
  const context = useContext(DisplaySettingsContext);
  if (!context) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
};
