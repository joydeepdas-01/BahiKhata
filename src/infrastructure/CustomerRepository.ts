import { Customer, Transaction, calculateBalanceFromTransactions } from '../domain/customer';

const DB_NAME = 'BahiKhataDB';
const DB_VERSION = 2;
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
      }
    };
  });
}

export const CustomerRepository = {
  /**
   * Retrieves all customer records.
   */
  async getAll(): Promise<Customer[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CUSTOMER_STORE, 'readonly');
      const store = tx.objectStore(CUSTOMER_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
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
        resolve(request.result || null);
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
   * Retrieves all transactions for a specific customer, ordered by date descending.
   */
  async getTransactions(customerId: string): Promise<Transaction[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSACTION_STORE, 'readonly');
      const store = tx.objectStore(TRANSACTION_STORE);
      const index = store.index('customerId');
      const request = index.getAll(IDBKeyRange.only(customerId));

      request.onsuccess = () => {
        const list: Transaction[] = request.result || [];
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
   * Retrieves all transactions across the entire ledger (for the Recent Transactions feed).
   */
  async getAllTransactions(): Promise<Transaction[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSACTION_STORE, 'readonly');
      const store = tx.objectStore(TRANSACTION_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const list: Transaction[] = request.result || [];
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve all transactions'));
      };
    });
  },

  /**
   * Saves a transaction and recalculates the customer's balance.
   */
  async recordTransaction(transaction: Transaction): Promise<{ customer: Customer; transaction: Transaction }> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([CUSTOMER_STORE, TRANSACTION_STORE], 'readwrite');
      const custStore = tx.objectStore(CUSTOMER_STORE);
      const transStore = tx.objectStore(TRANSACTION_STORE);

      // Save transaction
      transStore.put(transaction);

      // Read all customer transactions to compute updated balance
      const index = transStore.index('customerId');
      const req = index.getAll(IDBKeyRange.only(transaction.customerId));

      req.onsuccess = () => {
        const allTransactions: Transaction[] = req.result || [];
        const newBalance = calculateBalanceFromTransactions(allTransactions);

        const custReq = custStore.get(transaction.customerId);
        custReq.onsuccess = () => {
          const customer: Customer = custReq.result;
          if (!customer) {
            tx.abort();
            reject(new Error(`Customer ${transaction.customerId} not found`));
            return;
          }

          customer.amount = newBalance;
          customer.status = newBalance <= 0 ? 'paid' : 'pending';
          customer.updatedAt = new Date().toISOString();

          custStore.put(customer);
        };
      };

      tx.oncomplete = () => {
        // Fetch updated customer to return
        CustomerRepository.getById(transaction.customerId).then(updatedCust => {
          if (updatedCust) {
            resolve({ customer: updatedCust, transaction });
          } else {
            reject(new Error('Failed to retrieve updated customer'));
          }
        });
      };

      tx.onerror = () => {
        reject(new Error('Failed to record transaction'));
      };
    });
  },

  /**
   * Deletes a single transaction and updates customer balance.
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
        const remaining: Transaction[] = req.result || [];
        const newBalance = calculateBalanceFromTransactions(remaining);

        const custReq = custStore.get(customerId);
        custReq.onsuccess = () => {
          const customer: Customer = custReq.result;
          if (customer) {
            customer.amount = newBalance;
            customer.status = newBalance <= 0 ? 'paid' : 'pending';
            customer.updatedAt = new Date().toISOString();
            custStore.put(customer);
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
