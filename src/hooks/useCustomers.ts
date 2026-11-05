import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Customer, 
  CustomerSummary, 
  Transaction, 
  LedgerTransaction,
  FinancialTransactionType,
  CustomerFinancialSummary,
  PaymentAllocation,
  PaymentMethod,
  normalizeTransactionType
} from '../domain/customer';
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
    initialType: 'credit' | 'payment' | 'credit_given' | 'debt_incurred' = 'credit_given'
  ): Promise<Customer> => {
    const customerId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    const initialAmount = Math.max(0, customerData.amount || 0);
    const isPayable = initialType === 'debt_incurred' || initialType === 'payment';
    
    const receivablePaise = isPayable ? 0 : initialAmount;
    const payablePaise = isPayable ? initialAmount : 0;
    const computedAmount = isPayable ? -initialAmount : initialAmount;

    const newCustomer: Customer = {
      ...customerData,
      id: customerId,
      amount: computedAmount,
      receivablePaise,
      payablePaise,
      customerAdvancePaise: 0,
      supplierAdvancePaise: 0,
      status: initialAmount === 0 ? 'paid' : 'pending',
      createdAt: now,
      updatedAt: now
    };

    try {
      await CustomerRepository.save(newCustomer);

      // If initial amount > 0, generate opening transaction
      if (initialAmount > 0) {
        const openingType: FinancialTransactionType = isPayable ? 'debt_incurred' : 'credit_given';
        const initialTransaction: LedgerTransaction = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
          customerId,
          type: openingType,
          amount: initialAmount,
          date: today,
          note: customerData.note ? `Opening balance (${customerData.note})` : 'Opening balance',
          createdAt: now
        };
        const res = await CustomerRepository.recordFinancialTransaction(initialTransaction);
        setAllTransactions((prev) => [res.transaction as Transaction, ...prev]);
        setCustomers((prev) => [res.customer, ...prev]);
        return res.customer;
      }

      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add customer');
    }
  };

  /**
   * Records a full financial transaction and updates customer balance atomically.
   */
  const recordFinancialTransaction = async (
    transaction: LedgerTransaction
  ): Promise<{ customer: Customer; transaction: LedgerTransaction; summary: CustomerFinancialSummary }> => {
    if (transaction.amount <= 0) {
      throw new Error('Transaction amount must be strictly greater than zero');
    }

    try {
      const res = await CustomerRepository.recordFinancialTransaction(transaction);
      setCustomers((prev) => prev.map((c) => (c.id === transaction.customerId ? res.customer : c)));
      setAllTransactions((prev) => [res.transaction as Transaction, ...prev.filter(t => t.id !== res.transaction.id)]);
      return res;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to record transaction');
    }
  };

  /**
   * Convenience helper to record a transaction with optional payment method and allocations.
   */
  const recordTransaction = async (
    customerId: string,
    type: string,
    amountPaise: number,
    note?: string,
    date?: string,
    options?: {
      paymentMethod?: PaymentMethod;
      referenceNumber?: string;
      dueDate?: string | null;
      allocations?: PaymentAllocation[];
    }
  ): Promise<{ customer: Customer; transaction: Transaction }> => {
    const normalizedType = normalizeTransactionType(type);
    const now = new Date().toISOString();
    const transDate = date || now.split('T')[0];

    const tx: LedgerTransaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
      customerId,
      type: normalizedType,
      amount: amountPaise,
      date: transDate,
      note: note?.trim() || undefined,
      paymentMethod: options?.paymentMethod,
      referenceNumber: options?.referenceNumber?.trim() || undefined,
      dueDate: options?.dueDate,
      allocations: options?.allocations,
      createdAt: now
    };

    const res = await recordFinancialTransaction(tx);
    return { customer: res.customer, transaction: res.transaction as Transaction };
  };

  /**
   * Records a payment with specific debt allocations or FIFO distribution.
   */
  const recordPaymentWithAllocation = async (
    customerId: string,
    direction: 'receive' | 'pay',
    amountPaise: number,
    allocations?: PaymentAllocation[],
    paymentMethod: PaymentMethod = 'cash',
    referenceNumber?: string,
    note?: string,
    date?: string
  ): Promise<{ customer: Customer; transaction: Transaction }> => {
    const type: FinancialTransactionType = direction === 'receive' ? 'payment_received' : 'payment_made';
    return recordTransaction(customerId, type, amountPaise, note, date, {
      paymentMethod,
      referenceNumber,
      allocations
    });
  };

  /**
   * Records an explicit mutual settlement between receivable and payable balances.
   */
  const recordMutualAdjustment = async (
    customerId: string,
    amountPaise: number,
    note?: string
  ): Promise<{ customer: Customer; transaction: Transaction }> => {
    try {
      const res = await CustomerRepository.recordMutualAdjustment(customerId, amountPaise, note);
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? res.customer : c)));
      setAllTransactions((prev) => [res.transaction as Transaction, ...prev]);
      return { customer: res.customer, transaction: res.transaction as Transaction };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to record mutual adjustment');
    }
  };

  /**
   * Traceably reverses a transaction.
   */
  const reverseTransaction = async (
    transactionId: string,
    customerId: string,
    reason?: string
  ): Promise<{ customer: Customer; reversalTransaction: Transaction }> => {
    try {
      const res = await CustomerRepository.reverseTransaction(transactionId, customerId, reason);
      setCustomers((prev) => prev.map((c) => (c.id === customerId ? res.customer : c)));
      // Update local transaction state: mark original as isReversed and append reversal
      setAllTransactions((prev) => [
        res.reversalTransaction as Transaction,
        ...prev.map(t => t.id === transactionId ? { ...t, isReversed: true } : t)
      ]);
      return { customer: res.customer, reversalTransaction: res.reversalTransaction as Transaction };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to reverse transaction');
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
   * Retrieves the detailed financial summary (receivables, payables, advances, open debts) for a customer.
   */
  const getCustomerFinancialSummary = async (customerId: string): Promise<CustomerFinancialSummary> => {
    try {
      return await CustomerRepository.getCustomerFinancialSummary(customerId);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to calculate customer financial summary');
    }
  };

  /**
   * Bulk import customer records.
   */
  const addBulkCustomers = async (newCustomers: Omit<Customer, 'id' | 'status'>[]) => {
    const now = new Date().toISOString();
    const prepared: Customer[] = newCustomers.map((c) => {
      const amount = Math.round(c.amount || 0);
      return {
        ...c,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(),
        amount,
        receivablePaise: amount > 0 ? amount : 0,
        payablePaise: amount < 0 ? Math.abs(amount) : 0,
        customerAdvancePaise: 0,
        supplierAdvancePaise: 0,
        status: amount !== 0 ? 'pending' : 'paid',
        createdAt: now,
        updatedAt: now
      };
    });

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

    const receivable = customer.receivablePaise ?? (customer.amount > 0 ? customer.amount : 0);
    const payable = customer.payablePaise ?? 0;

    if (receivable > 0) {
      await recordTransaction(customer.id, 'payment_received', receivable, 'Full settlement of receivable');
    } else if (payable > 0) {
      await recordTransaction(customer.id, 'payment_made', payable, 'Full settlement of payable');
    } else {
      const updated: Customer = { ...customer, status: 'paid', amount: 0, receivablePaise: 0, payablePaise: 0 };
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
   * Comprehensive summary calculations for dashboard, financial reports, and KPI metrics.
   */
  const summary: CustomerSummary = useMemo(() => {
    let totalPendingPaise = 0;
    let totalReceivablePaise = 0;
    let totalPayablePaise = 0;
    let totalCustomerAdvancesPaise = 0;
    let totalSupplierAdvancesPaise = 0;

    let pendingCount = 0;
    let receivableCustomersCount = 0;
    let payableCustomersCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let settledCount = 0;

    customers.forEach((c) => {
      const rec = c.receivablePaise ?? (c.amount > 0 ? c.amount : 0);
      const pay = c.payablePaise ?? 0;
      const custAdv = c.customerAdvancePaise ?? (c.amount < 0 ? Math.abs(c.amount) : 0);
      const suppAdv = c.supplierAdvancePaise ?? 0;

      totalReceivablePaise += rec;
      totalPayablePaise += pay;
      totalCustomerAdvancesPaise += custAdv;
      totalSupplierAdvancesPaise += suppAdv;

      if (rec > 0) {
        totalPendingPaise += rec;
        pendingCount++;
        receivableCustomersCount++;

        const dueStatus = classifyDueDate(c.dueDate);
        if (dueStatus === 'due_today') {
          dueTodayCount++;
        } else if (dueStatus === 'overdue') {
          overdueCount++;
        }
      }

      if (pay > 0) {
        payableCustomersCount++;
      }

      if (rec === 0 && pay === 0) {
        settledCount++;
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    let todayTransactionsCount = 0;
    let todayCreditPaise = 0;
    let todayPaymentPaise = 0;
    let todayCashInflowPaise = 0;
    let todayCashOutflowPaise = 0;

    allTransactions.forEach((t) => {
      if (t.isReversed) return;
      if (t.date === todayStr) {
        todayTransactionsCount++;
        const normType = normalizeTransactionType(t.type);

        if (normType === 'credit_given') {
          todayCreditPaise += t.amount;
        } else if (normType === 'payment_received' || normType === 'advance_received') {
          todayPaymentPaise += t.amount;
          todayCashInflowPaise += t.amount;
        } else if (normType === 'payment_made' || normType === 'advance_paid') {
          todayCashOutflowPaise += t.amount;
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
      todayPaymentPaise,
      totalReceivablePaise,
      totalPayablePaise,
      totalCustomerAdvancesPaise,
      totalSupplierAdvancesPaise,
      netLedgerPositionPaise: totalReceivablePaise - totalPayablePaise,
      todayCashInflowPaise,
      todayCashOutflowPaise,
      payableCustomersCount,
      receivableCustomersCount
    };
  }, [customers, allTransactions]);

  return {
    customers,
    allTransactions,
    loading,
    error,
    addCustomer,
    recordTransaction,
    recordFinancialTransaction,
    recordPaymentWithAllocation,
    recordMutualAdjustment,
    reverseTransaction,
    deleteTransaction,
    getCustomerTransactions,
    getCustomerFinancialSummary,
    addBulkCustomers,
    updateCustomer,
    deleteCustomer,
    markAsPaid,
    clearAllData,
    summary,
    refresh: loadData
  };
}
