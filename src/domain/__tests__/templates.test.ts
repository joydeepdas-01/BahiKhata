import { describe, it, expect } from 'vitest';
import { parseTemplate, DEFAULT_TEMPLATES } from '../templates';

describe('templates', () => {
  it('should parse placeholders correctly', () => {
    const templateText = 'Hello {{name}}, you owe {{amount}} due on {{due_date}}.';
    const parsed = parseTemplate(templateText, {
      name: 'Rahul',
      amount: '₹1,250',
      dueDate: '25 Aug'
    });
    expect(parsed).toBe('Hello Rahul, you owe ₹1,250 due on 25 Aug.');
  });

  it('should handle template variables with arbitrary whitespace inside brackets', () => {
    const templateText = 'Hey {{  name  }}, pay {{   amount   }} by {{due_date}}';
    const parsed = parseTemplate(templateText, {
      name: 'Rahul',
      amount: '₹1,250',
      dueDate: '25 Aug'
    });
    expect(parsed).toBe('Hey Rahul, pay ₹1,250 by 25 Aug');
  });

  it('should have all default templates defined for each language and tone', () => {
    const tones = ['pre_due', 'due_today', 'overdue', 'final'];
    const languages = ['en', 'hi', 'bn'];

    for (const lang of languages) {
      for (const tone of tones) {
        const found = DEFAULT_TEMPLATES.find(t => t.language === lang && t.toneKey === tone);
        expect(found).toBeDefined();
        expect(found?.text).toContain('{{name}}');
        expect(found?.text).toContain('{{amount}}');
        expect(found?.text).toContain('{{due_date}}');
      }
    }
  });
});
