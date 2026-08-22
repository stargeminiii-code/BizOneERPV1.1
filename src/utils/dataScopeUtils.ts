import { UserAccount, Customer, Order, CrmTask, PurchaseOrder, StockIssue, StockTransfer, CashTransaction } from '../types';

/**
 * Filter customers based on User's Data Scope and Role
 */
export function filterCustomersByScope(customers: Customer[], user: UserAccount | null | undefined): Customer[] {
  if (!user) return customers;
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'ceo' || user.dataScope === 'company_wide') {
    return customers;
  }

  // Branch level
  if (user.dataScope === 'division' && user.branchId) {
    return customers.filter((c) => !c.branchId || c.branchId === user.branchId || c.branchId === 'ALL');
  }

  // Individual / Assigned staff
  if (user.dataScope === 'individual') {
    return customers.filter((c) => {
      const isAssigned = Boolean(c.assignedStaff && (c.assignedStaff.includes(user.name) || (user.username && c.assignedStaff.includes(user.username))));
      const isCreator = Boolean(c.creator && (c.creator.includes(user.name) || (user.username && c.creator.includes(user.username))));
      const isCreatedBy = Boolean(c.createdBy && (c.createdBy.includes(user.name) || (user.username && c.createdBy.includes(user.username))));
      return isAssigned || isCreator || isCreatedBy || !c.assignedStaff;
    });
  }

  return customers;
}

/**
 * Filter orders based on User's Data Scope and Role
 */
export function filterOrdersByScope(orders: Order[], user: UserAccount | null | undefined): Order[] {
  if (!user) return orders;
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'ceo' || user.dataScope === 'company_wide') {
    return orders;
  }

  // Branch level
  if (user.dataScope === 'division' && user.branchId) {
    return orders.filter((o) => !o.branchId || o.branchId === user.branchId || o.branchId === 'ALL');
  }

  // Individual / Staff creator
  if (user.dataScope === 'individual') {
    return orders.filter((o) => {
      const isCreator = o.creator && (o.creator.includes(user.name) || o.creator.includes(user.username || ''));
      return isCreator;
    });
  }

  return orders;
}

/**
 * Filter CRM tasks based on User's Data Scope
 */
export function filterTasksByScope(tasks: CrmTask[], user: UserAccount | null | undefined): CrmTask[] {
  if (!user) return tasks;
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'ceo' || user.dataScope === 'company_wide') {
    return tasks;
  }

  // Department level
  if (user.dataScope === 'department') {
    return tasks;
  }

  // Individual level
  if (user.dataScope === 'individual') {
    return tasks.filter((t) => {
      const isAssigned = t.assignedTo && (t.assignedTo.includes(user.name) || t.assignedTo.includes(user.username || ''));
      return isAssigned;
    });
  }

  return tasks;
}

/**
 * Filter Cashflow transactions by user
 */
export function filterCashTransactionsByScope(txs: CashTransaction[], user: UserAccount | null | undefined): CashTransaction[] {
  if (!user) return txs;
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'ceo' || user.role === 'accountant' || user.dataScope === 'company_wide') {
    return txs;
  }

  // Individual sales reps only see their own transactions
  if (user.dataScope === 'individual') {
    return txs.filter((t) => t.createdBy && (t.createdBy.includes(user.name) || t.createdBy.includes(user.username || '')));
  }

  return txs;
}
