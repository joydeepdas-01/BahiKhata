import { describe, it, expect } from 'vitest';
import { parseCSV, exportToCSV } from '../csvHelper';
import { Customer } from '../customer';

describe('csvHelper', () => {
  describe('exportToCSV', () => {
    it('should compile customer list into a CSV format', () => {
      const customers: Customer[] = [
        {
          id: '1',
          name: 'Rahul Sharma',
          phone: '919876543210',
          amount: 125000,
          dueDate: '2026-08-25',
          note: 'Tailoring charges',
          status: 'pending'
        }
      ];
      
      const csv = exportToCSV(customers);
      expect(csv).toContain('Name,Phone,Amount (Rs),Due Date,Notes,Last Reminder Sent');
      expect(csv).toContain('"Rahul Sharma","919876543210",1250.00,"2026-08-25","Tailoring charges"');
    });
  });

  describe('parseCSV', () => {
    it('should parse valid CSV strings and auto-map headers', () => {
      const csvData = `
Name,Contact,Credit,Due Date,Notes
Rahul Sharma,9876543210,1250.50,2026-08-25,Pending tailors
Amit Kumar,+91 99999 88888,500,2026-09-01,Advance
      `.trim();
      
      const result = parseCSV(csvData);
      expect(result.errors.length).toBe(0);
      expect(result.customers.length).toBe(2);
      
      expect(result.customers[0].name).toBe('Rahul Sharma');
      expect(result.customers[0].phone).toBe('919876543210');
      expect(result.customers[0].amount).toBe(125050); // 1250.50 * 100
      expect(result.customers[0].dueDate).toBe('2026-08-25');
      expect(result.customers[0].note).toBe('Pending tailors');
    });

    it('should catch validation errors for invalid numbers and phone formatting', () => {
      const csvData = `
name,phone,amount,date
Rahul Sharma,12345,1200,2026-08-25
Amit Kumar,9876543210,-500,2026-09-01
Suresh Singh,9876543210,500,invalid-date
      `.trim();
      
      const result = parseCSV(csvData);
      expect(result.customers.length).toBe(0);
      expect(result.errors.length).toBe(3);
      
      expect(result.errors[0].column).toBe('Phone');
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[1].column).toBe('Amount');
      expect(result.errors[1].row).toBe(3);
      expect(result.errors[2].column).toBe('Due Date');
      expect(result.errors[2].row).toBe(4);
    });
  });
});
