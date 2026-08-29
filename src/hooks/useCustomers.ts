import { useState, useEffect, useMemo } from 'react';
import { Customer, CustomerSummary } from '../domain/customer';
import { CustomerRepository } from '../infrastructure/CustomerRepository';
import { classifyDueDate } from '../domain/dateClassifier';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await CustomerRepository.getAll();
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'status'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
      status: 'pending'
    };
    try {
      await CustomerRepository.save(newCustomer);
      setCustomers((prev) => [...prev, newCustomer]);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add customer');
    }
  };

  const addBulkCustomers = async (newCustomers: Omit<Customer, 'id' | 'status'>[]) => {
    const prepared = newCustomers.map(c => ({
      ...c,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
      status: 'pending' as const
    }));
    try {
      await CustomerRepository.saveBulk(prepared);
      setCustomers((prev) => [...prev, ...prepared]);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add bulk customers');
    }
  };

  const updateCustomer = async (updated: Customer) => {
    try {
      await CustomerRepository.save(updated);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await CustomerRepository.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete customer');
    }
  };

  const markAsPaid = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    const updated: Customer = { ...customer, status: 'paid' };
    await updateCustomer(updated);
  };

  const clearAllData = async () => {
    try {
      await CustomerRepository.clearAll();
      setCustomers([]);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to clear database');
    }
  };

  const summary: CustomerSummary = useMemo(() => {
    let totalPendingPaise = 0;
    let pendingCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;

    customers.forEach((c) => {
      if (c.status === 'pending') {
        totalPendingPaise += c.amount;
        pendingCount++;
        
        const dueStatus = classifyDueDate(c.dueDate);
        if (dueStatus === 'due_today') {
          dueTodayCount++;
        } else if (dueStatus === 'overdue') {
          overdueCount++;
        }
      }
    });

    return {
      totalPendingPaise,
      totalCustomersCount: customers.length,
      pendingCount,
      dueTodayCount,
      overdueCount
    };
  }, [customers]);

  return {
    customers,
    loading,
    error,
    addCustomer,
    addBulkCustomers,
    updateCustomer,
    deleteCustomer,
    markAsPaid,
    clearAllData,
    summary,
    refresh: loadCustomers
  };
}
