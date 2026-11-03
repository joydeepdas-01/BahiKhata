import { useState, useEffect, useMemo, useCallback } from 'react';
import { Customer, CustomerSummary, Transaction } from '../domain/customer';
import { CustomerRepository } from '../infrastructure/CustomerRepository';
import { classifyDueDate } from '../domain/dateClassifier';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [custList, transList] = await Promise.all([
        CustomerRepository.getAll(),
        CustomerRepository.getAllTransactions()
      ]);
      setCustomers(custList);
      setAllTransactions(transList);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Adds a new customer, optionally creating an opening transaction if initial balance is provided.
   */
  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'status'>,
    initialType: 'credit' | 'payment' = 'credit'
  ): Promise<Customer> => {
    const customerId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const initialAmount = customerData.amount || 0;
    const computedAmount = initialType === 'credit' ? initialAmount : -initialAmount;

    const newCustomer: Customer = {
      ...customerData,
      id: customerId,
      amount: computedAmount,
      status: computedAmount <= 0 ? (computedAmount === 0 ? 'paid' : 'paid') : 'pending',
      createdAt: now,
      updatedAt: now
    };

    try {
      await CustomerRepository.save(newCustomer);

      // If initial amount > 0, generate an opening transaction
      if (initialAmount > 0) {
        const initialTransaction: Transaction = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
          customerId,
          type: initialType,
          amount: initialAmount,
          date: today,
          note: customerData.note ? `Opening balance (${customerData.note})` : 'Opening balance',
          createdAt: now
        };
        await CustomerRepository.recordTransaction(initialTransaction);
        setAllTransactions((prev) => [initialTransaction, ...prev]);
      }

      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add customer');
    }
  };

  /**
   * Records a new transaction (credit given or payment received) and updates customer balance.
   */
  const recordTransaction = async (
    customerId: string,
    type: 'credit' | 'payment',
    amountPaise: number,
    note?: string,
    date?: string
  ): Promise<{ customer: Customer; transaction: Transaction }> => {
    if (amountPaise <= 0) {
      throw new Error('Transaction amount must be greater than zero');
    }

    const now = new Date().toISOString();
    const transDate = date || now.split('T')[0];

    const transaction: Transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
      customerId,
      type,
      amount: amountPaise,
      date: transDate,
      note: note?.trim() || undefined,
      createdAt: now
    };

    try {
      const res = await CustomerRepository.recordTransaction(transaction);
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? res.customer : c)));
      setAllTransactions((prev) => [transaction, ...prev]);
      return res;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to record transaction');
    }
  };

  /**
   * Deletes a transaction and recalculates the customer balance.
   */
  const deleteTransaction = async (transactionId: string, customerId: string): Promise<Customer> => {
    try {
      const updatedCustomer = await CustomerRepository.deleteTransaction(transactionId, customerId);
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? updatedCustomer : c)));
      setAllTransactions((prev) => prev.filter((t) => t.id !== transactionId));
      return updatedCustomer;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete transaction');
    }
  };

  /**
   * Fetches all transactions for a single customer.
   */
  const getCustomerTransactions = async (customerId: string): Promise<Transaction[]> => {
    try {
      return await CustomerRepository.getTransactions(customerId);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to load customer transactions');
    }
  };

  /**
   * Bulk import customer records.
   */
  const addBulkCustomers = async (newCustomers: Omit<Customer, 'id' | 'status'>[]) => {
    const now = new Date().toISOString();
    const prepared = newCustomers.map((c) => ({
      ...c,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
      status: (c.amount > 0 ? 'pending' : 'paid') as 'pending' | 'paid',
      createdAt: now,
      updatedAt: now
    }));

    try {
      await CustomerRepository.saveBulk(prepared);
      setCustomers((prev) => [...prepared, ...prev]);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add bulk customers');
    }
  };

  /**
   * Updates customer profile details.
   */
  const updateCustomer = async (updated: Customer) => {
    try {
      const payload: Customer = {
        ...updated,
        updatedAt: new Date().toISOString()
      };
      await CustomerRepository.save(payload);
      setCustomers((prev) => prev.map((c) => (c.id === payload.id ? payload : c)));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update customer');
    }
  };

  /**
   * Deletes a customer and all their transactions.
   */
  const deleteCustomer = async (id: string) => {
    try {
      await CustomerRepository.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setAllTransactions((prev) => prev.filter((t) => t.customerId !== id));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete customer');
    }
  };

  /**
   * Settles a customer's remaining due by recording a payment transaction for the full pending balance.
   */
  const markAsPaid = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    if (customer.amount > 0) {
      // Record payment transaction for the full balance
      await recordTransaction(customer.id, 'payment', customer.amount, 'Full settlement');
    } else {
      const updated: Customer = { ...customer, status: 'paid', amount: 0 };
      await updateCustomer(updated);
    }
  };

  /**
   * Clears all local data.
   */
  const clearAllData = async () => {
    try {
      await CustomerRepository.clearAll();
      setCustomers([]);
      setAllTransactions([]);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to clear database');
    }
  };

  /**
   * Summary calculations for dashboard and KPI bars.
   */
  const summary: CustomerSummary = useMemo(() => {
    let totalPendingPaise = 0;
    let pendingCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let settledCount = 0;

    customers.forEach((c) => {
      if (c.amount > 0 && c.status !== 'archived') {
        totalPendingPaise += c.amount;
        pendingCount++;

        const dueStatus = classifyDueDate(c.dueDate);
        if (dueStatus === 'due_today') {
          dueTodayCount++;
        } else if (dueStatus === 'overdue') {
          overdueCount++;
        }
      } else {
        settledCount++;
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    let todayTransactionsCount = 0;
    let todayCreditPaise = 0;
    let todayPaymentPaise = 0;

    allTransactions.forEach((t) => {
      if (t.date === todayStr) {
        todayTransactionsCount++;
        if (t.type === 'credit') {
          todayCreditPaise += t.amount;
        } else if (t.type === 'payment') {
          todayPaymentPaise += t.amount;
        }
      }
    });

    return {
      totalPendingPaise,
      totalCustomersCount: customers.length,
      pendingCount,
      dueTodayCount,
      overdueCount,
      settledCount,
      todayTransactionsCount,
      todayCreditPaise,
      todayPaymentPaise
    };
  }, [customers, allTransactions]);

  return {
    customers,
    allTransactions,
    loading,
    error,
    addCustomer,
    recordTransaction,
    deleteTransaction,
    getCustomerTransactions,
    addBulkCustomers,
    updateCustomer,
    deleteCustomer,
    markAsPaid,
    clearAllData,
    summary,
    refresh: loadData
  };
}
