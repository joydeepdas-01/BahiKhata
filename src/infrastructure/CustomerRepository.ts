import { 
  Customer, 
  Transaction, 
  LedgerTransaction, 
  FinancialTransactionType,
  CustomerFinancialSummary,
  calculateCustomerLedger,
  calculateBalanceFromTransactions,
  normalizeTransactionType
} from '../domain/customer';

const DB_NAME = 'BahiKhataDB';
const DB_VERSION = 3;
const CUSTOMER_STORE = 'customers';
const TRANSACTION_STORE = 'transactions';

let dbInstance: IDBDatabase | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open BahiKhata Local Database'));
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store 1: Customers
      if (!db.objectStoreNames.contains(CUSTOMER_STORE)) {
        db.createObjectStore(CUSTOMER_STORE, { keyPath: 'id' });
      }

      // Store 2: Transactions
      if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
        const transStore = db.createObjectStore(TRANSACTION_STORE, { keyPath: 'id' });
        transStore.createIndex('customerId', 'customerId', { unique: false });
        transStore.createIndex('date', 'date', { unique: false });
        transStore.createIndex('type', 'type', { unique: false });
      } else {
        const transStore = (event.target as any).transaction.objectStore(TRANSACTION_STORE);
        if (!transStore.indexNames.contains('type')) {
          transStore.createIndex('type', 'type', { unique: false });
        }
      }
    };
  });
}

/**
 * Normalizes customer object from storage, ensuring all independent financial fields exist.
 */
function normalizeCustomerRecord(c: any): Customer {
  const amount = Math.round(Number(c.amount) || 0);
  const receivablePaise = typeof c.receivablePaise === 'number' 
    ? c.receivablePaise 
    : (amount > 0 ? amount : 0);
  const payablePaise = typeof c.payablePaise === 'number'
    ? c.payablePaise
    : 0;
  const customerAdvancePaise = typeof c.customerAdvancePaise === 'number'
    ? c.customerAdvancePaise
    : (amount < 0 ? Math.abs(amount) : 0);
  const supplierAdvancePaise = typeof c.supplierAdvancePaise === 'number'
    ? c.supplierAdvancePaise
    : 0;

  return {
    ...c,
    amount,
    receivablePaise,
    payablePaise,
    customerAdvancePaise,
    supplierAdvancePaise,
    status: (receivablePaise > 0 || payablePaise > 0) ? 'pending' : (c.status || 'paid')
  };
}

export const CustomerRepository = {
  /**
   * Retrieves all customer records with normalized independent ledger positions.
   */
  async getAll(): Promise<Customer[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CUSTOMER_STORE, 'readonly');
      const store = tx.objectStore(CUSTOMER_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const list = (request.result || []).map(normalizeCustomerRecord);
        resolve(list);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve customers from local storage'));
      };
    });
  },

  /**
   * Retrieves a single customer by ID.
   */
  async getById(id: string): Promise<Customer | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CUSTOMER_STORE, 'readonly');
      const store = tx.objectStore(CUSTOMER_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        if (!request.result) {
          resolve(null);
        } else {
          resolve(normalizeCustomerRecord(request.result));
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to retrieve customer with ID ${id}`));
      };
    });
  },

  /**
   * Saves or updates a customer record.
   */
  async save(customer: Customer): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CUSTOMER_STORE, 'readwrite');
      const store = tx.objectStore(CUSTOMER_STORE);
      const request = store.put(customer);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save customer to local storage'));
      };
    });
  },

  /**
   * Bulk save customer records.
   */
  async saveBulk(customers: Customer[]): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CUSTOMER_STORE, 'readwrite');
      const store = tx.objectStore(CUSTOMER_STORE);

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(new Error('Failed to perform bulk customer save'));
      };

      for (const customer of customers) {
        store.put(customer);
      }
    });
  },

  /**
   * Deletes a customer and cascade-deletes their transactions.
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CUSTOMER_STORE, TRANSACTION_STORE], 'readwrite');
      const customerStore = tx.objectStore(CUSTOMER_STORE);
      const transactionStore = tx.objectStore(TRANSACTION_STORE);

      customerStore.delete(id);

      // Cascade delete customer transactions
      const index = transactionStore.index('customerId');
      const req = index.openCursor(IDBKeyRange.only(id));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(new Error('Failed to delete customer and transactions from local storage'));
      };
    });
  },

  /**
   * Retrieves all transactions for a specific customer, ordered newest first.
   */
  async getTransactions(customerId: string): Promise<Transaction[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSACTION_STORE, 'readonly');
      const store = tx.objectStore(TRANSACTION_STORE);
      const index = store.index('customerId');
      const request = index.getAll(IDBKeyRange.only(customerId));

      request.onsuccess = () => {
        const list: Transaction[] = (request.result || []).map((t: any) => ({
          ...t,
          type: normalizeTransactionType(t.type)
        }));
        // Sort newest first
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };

      request.onerror = () => {
        reject(new Error(`Failed to retrieve transactions for customer ${customerId}`));
      };
    });
  },

  /**
   * Retrieves all transactions across the entire ledger.
   */
  async getAllTransactions(): Promise<Transaction[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSACTION_STORE, 'readonly');
      const store = tx.objectStore(TRANSACTION_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const list: Transaction[] = (request.result || []).map((t: any) => ({
          ...t,
          type: normalizeTransactionType(t.type)
        }));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve all transactions'));
      };
    });
  },

  /**
   * Calculates and returns the full CustomerFinancialSummary.
   */
  async getCustomerFinancialSummary(customerId: string): Promise<CustomerFinancialSummary> {
    const transactions = await this.getTransactions(customerId);
    return calculateCustomerLedger(customerId, transactions);
  },

  /**
   * Records a financial transaction and atomically updates the customer's
   * independent receivable, payable, and advance positions.
   */
  async recordFinancialTransaction(transaction: LedgerTransaction): Promise<{
    customer: Customer;
    transaction: LedgerTransaction;
    summary: CustomerFinancialSummary;
  }> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CUSTOMER_STORE, TRANSACTION_STORE], 'readwrite');
      const custStore = tx.objectStore(CUSTOMER_STORE);
      const transStore = tx.objectStore(TRANSACTION_STORE);

      // Save transaction
      transStore.put(transaction);

      // Query all transactions for customer to compute updated financials
      const index = transStore.index('customerId');
      const req = index.getAll(IDBKeyRange.only(transaction.customerId));

      let updatedCustomer: Customer | null = null;
      let computedSummary: CustomerFinancialSummary | null = null;

      req.onsuccess = () => {
        const allTx: LedgerTransaction[] = req.result || [];
        computedSummary = calculateCustomerLedger(transaction.customerId, allTx);

        const custReq = custStore.get(transaction.customerId);
        custReq.onsuccess = () => {
          const rawCustomer = custReq.result;
          if (!rawCustomer || !computedSummary) {
            tx.abort();
            reject(new Error(`Customer ${transaction.customerId} not found or calculation failed`));
            return;
          }

          const summary = computedSummary;
          const hasOpenDebts = summary.receivablePaise > 0 || summary.payablePaise > 0;

          updatedCustomer = {
            ...rawCustomer,
            receivablePaise: summary.receivablePaise,
            payablePaise: summary.payablePaise,
            customerAdvancePaise: summary.customerAdvancePaise,
            supplierAdvancePaise: summary.supplierAdvancePaise,
            amount: summary.netPaise,
            status: hasOpenDebts ? 'pending' : 'paid',
            updatedAt: new Date().toISOString()
          };

          custStore.put(updatedCustomer);
        };
      };

      tx.oncomplete = () => {
        if (updatedCustomer && computedSummary) {
          resolve({
            customer: normalizeCustomerRecord(updatedCustomer),
            transaction,
            summary: computedSummary
          });
        } else {
          reject(new Error('Failed to finalize customer transaction calculation'));
        }
      };

      tx.onerror = () => {
        reject(new Error('Failed to record transaction in database'));
      };
    });
  },

  /**
   * Reverses an existing transaction traceably, preserving audit history.
   */
  async reverseTransaction(
    transactionId: string,
    customerId: string,
    reason?: string
  ): Promise<{ customer: Customer; reversalTransaction: LedgerTransaction }> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CUSTOMER_STORE, TRANSACTION_STORE], 'readwrite');
      const transStore = tx.objectStore(TRANSACTION_STORE);
      const custStore = tx.objectStore(CUSTOMER_STORE);

      const origReq = transStore.get(transactionId);
      origReq.onsuccess = () => {
        const original: LedgerTransaction = origReq.result;
        if (!original) {
          tx.abort();
          reject(new Error(`Transaction ${transactionId} not found`));
          return;
        }

        if (original.isReversed) {
          tx.abort();
          reject(new Error('Transaction has already been reversed'));
          return;
        }

        // Mark original as reversed
        original.isReversed = true;
        transStore.put(original);

        // Create reversal entry
        const now = new Date().toISOString();
        const reversal: LedgerTransaction = {
          id: crypto.randomUUID ? crypto.randomUUID() : 'rev_' + Math.random().toString(36).substring(2) + Date.now().toString(),
          customerId,
          type: 'reversal',
          amount: original.amount,
          date: now.split('T')[0],
          note: reason?.trim() || `Reversal of ${original.type} dated ${original.date}`,
          reversalOfId: original.id,
          createdAt: now
        };
        transStore.put(reversal);

        // Recompute customer balance
        const index = transStore.index('customerId');
        const allReq = index.getAll(IDBKeyRange.only(customerId));
        allReq.onsuccess = () => {
          const allTx: LedgerTransaction[] = allReq.result || [];
          const summary = calculateCustomerLedger(customerId, allTx);

          const custReq = custStore.get(customerId);
          custReq.onsuccess = () => {
            const rawCust = custReq.result;
            if (rawCust) {
              const updatedCust: Customer = {
                ...rawCust,
                receivablePaise: summary.receivablePaise,
                payablePaise: summary.payablePaise,
                customerAdvancePaise: summary.customerAdvancePaise,
                supplierAdvancePaise: summary.supplierAdvancePaise,
                amount: summary.netPaise,
                status: (summary.receivablePaise > 0 || summary.payablePaise > 0) ? 'pending' : 'paid',
                updatedAt: now
              };
              custStore.put(updatedCust);

              tx.oncomplete = () => {
                resolve({
                  customer: normalizeCustomerRecord(updatedCust),
                  reversalTransaction: reversal
                });
              };
            }
          };
        };
      };

      tx.onerror = () => {
        reject(new Error('Failed to reverse transaction'));
      };
    });
  },

  /**
   * Records a mutual adjustment offsetting receivable and payable positions.
   */
  async recordMutualAdjustment(
    customerId: string,
    amountPaise: number,
    note?: string
  ): Promise<{ customer: Customer; transaction: LedgerTransaction }> {
    if (amountPaise <= 0) {
      throw new Error('Mutual adjustment amount must be greater than zero');
    }

    const now = new Date().toISOString();
    const adjustmentTx: LedgerTransaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'adj_' + Math.random().toString(36).substring(2) + Date.now().toString(),
      customerId,
      type: 'mutual_adjustment',
      amount: amountPaise,
      date: now.split('T')[0],
      note: note?.trim() || 'Mutual bilateral settlement offset',
      paymentMethod: 'other',
      createdAt: now
    };

    const res = await this.recordFinancialTransaction(adjustmentTx);
    return { customer: res.customer, transaction: res.transaction };
  },

  /**
   * Legacy wrapper for recordTransaction.
   */
  async recordTransaction(transaction: Transaction): Promise<{ customer: Customer; transaction: Transaction }> {
    const res = await this.recordFinancialTransaction({
      ...transaction,
      type: normalizeTransactionType(transaction.type)
    });
    return {
      customer: res.customer,
      transaction: res.transaction as Transaction
    };
  },

  /**
   * Deletes a single transaction permanently and recalculates balance.
   */
  async deleteTransaction(transactionId: string, customerId: string): Promise<Customer> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CUSTOMER_STORE, TRANSACTION_STORE], 'readwrite');
      const custStore = tx.objectStore(CUSTOMER_STORE);
      const transStore = tx.objectStore(TRANSACTION_STORE);

      transStore.delete(transactionId);

      const index = transStore.index('customerId');
      const req = index.getAll(IDBKeyRange.only(customerId));

      req.onsuccess = () => {
        const remaining: LedgerTransaction[] = req.result || [];
        const summary = calculateCustomerLedger(customerId, remaining);

        const custReq = custStore.get(customerId);
        custReq.onsuccess = () => {
          const rawCustomer = custReq.result;
          if (rawCustomer) {
            const updatedCustomer: Customer = {
              ...rawCustomer,
              receivablePaise: summary.receivablePaise,
              payablePaise: summary.payablePaise,
              customerAdvancePaise: summary.customerAdvancePaise,
              supplierAdvancePaise: summary.supplierAdvancePaise,
              amount: summary.netPaise,
              status: (summary.receivablePaise > 0 || summary.payablePaise > 0) ? 'pending' : 'paid',
              updatedAt: new Date().toISOString()
            };
            custStore.put(updatedCustomer);
          }
        };
      };

      tx.oncomplete = () => {
        CustomerRepository.getById(customerId).then(c => {
          if (c) resolve(c);
          else reject(new Error('Failed to retrieve updated customer after deletion'));
        });
      };

      tx.onerror = () => {
        reject(new Error('Failed to delete transaction'));
      };
    });
  },

  /**
   * Clears all customer and transaction data permanently.
   */
  async clearAll(): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CUSTOMER_STORE, TRANSACTION_STORE], 'readwrite');
      tx.objectStore(CUSTOMER_STORE).clear();
      tx.objectStore(TRANSACTION_STORE).clear();

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(new Error('Failed to clear database'));
      };
    });
  }
};
