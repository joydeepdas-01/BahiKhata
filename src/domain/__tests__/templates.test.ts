import { describe, it, expect } from 'vitest';
import { parseTemplate, DEFAULT_TEMPLATES } from '../templates';

describe('templates', () => {
  it('should parse placeholders correctly including reason', () => {
    const templateText = 'Hello {{name}}, your pending balance of {{amount}}{{reason}} is due on {{due_date}}.';
    const parsed = parseTemplate(templateText, {
      name: 'Rahul',
      amount: '₹1,250',
      dueDate: '25 Aug',
      reason: 'Grocery items'
    });
    expect(parsed).toBe('Hello Rahul, your pending balance of ₹1,250 for "Grocery items" is due on 25 Aug.');
  });

  it('should handle template variables with arbitrary whitespace inside brackets', () => {
    const templateText = 'Hey {{  name  }}, pay {{   amount   }}{{  reason  }} by {{due_date}}';
    const parsed = parseTemplate(templateText, {
      name: 'Rahul',
      amount: '₹1,250',
      dueDate: '25 Aug',
      reason: 'Milk bill'
    });
    expect(parsed).toBe('Hey Rahul, pay ₹1,250 for "Milk bill" by 25 Aug');
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
        expect(found?.text).toContain('{{reason}}');
      }
    }
  });
});
