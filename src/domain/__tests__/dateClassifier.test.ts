import { describe, it, expect } from 'vitest';
import { classifyDueDate, formatDaysDifference, formatDisplayDate } from '../dateClassifier';

describe('dateClassifier', () => {
  const getRelativeDate = (daysOffset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  describe('classifyDueDate', () => {
    it('should classify today as due_today', () => {
      const today = getRelativeDate(0);
      expect(classifyDueDate(today)).toBe('due_today');
    });

    it('should classify past date as overdue', () => {
      const past = getRelativeDate(-3);
      expect(classifyDueDate(past)).toBe('overdue');
    });

    it('should classify future date as pre_due', () => {
      const future = getRelativeDate(5);
      expect(classifyDueDate(future)).toBe('pre_due');
    });

    it('should default to pre_due if no date is provided', () => {
      expect(classifyDueDate(null)).toBe('pre_due');
      expect(classifyDueDate(undefined)).toBe('pre_due');
    });
  });

  describe('formatDaysDifference', () => {
    it('should print Due today for today', () => {
      const today = getRelativeDate(0);
      expect(formatDaysDifference(today)).toBe('Due today');
    });

    it('should print X days overdue for past dates', () => {
      const past1 = getRelativeDate(-1);
      const past3 = getRelativeDate(-3);
      expect(formatDaysDifference(past1)).toBe('1 day overdue');
      expect(formatDaysDifference(past3)).toBe('3 days overdue');
    });

    it('should print Due in X days for future dates', () => {
      const future1 = getRelativeDate(1);
      const future5 = getRelativeDate(5);
      expect(formatDaysDifference(future1)).toBe('Due in 1 day');
      expect(formatDaysDifference(future5)).toBe('Due in 5 days');
    });
  });

  describe('formatDisplayDate', () => {
    it('should format date to DD MMM for current year', () => {
      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear, 7, 25); // 25 August
      expect(formatDisplayDate(date)).toBe('25 Aug');
    });

    it('should format date to DD MMM YYYY for different years', () => {
      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear - 1, 7, 25); // 25 August last year
      expect(formatDisplayDate(date)).toBe(`25 Aug ${currentYear - 1}`);
    });
  });
});
