// lib/data-store.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  licenseNumber: string;
  licenseState: string;
  licenseUrl: string | null;
  accountNumber: string;
  checkingBalance: number;
  savingsBalance: number;
  availableCheckingBalance?: number;
  availableSavingsBalance?: number;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
  accountStatus?: string;
  verificationStatus?: string;
  kycCompleted?: boolean;
  loginAttempts?: number;
  lockReason?: string;
  suspensionReason?: string;
  occupation?: string;
  monthlyIncome?: number;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  password: string;
  pin: string;
  licenseNumber: string;
  licenseState: string;
  licenseUrl: string | null;
  accountNumber: string;
  checkingBalance: number;
  savingsBalance: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  description: string;
  date: string;
  category: string;
  status: string;
  fromAccount?: string;
  toAccount?: string;
}

export interface Bill {
  id: string;
  userId: string;
  company: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'pending' | 'paid' | 'overdue';
  accountNumber?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  status: string;
  verification: string;
  balanceRange: { min: number; max: number };
  dateRange: { start: string; end: string };
  hasTransactions: boolean | null;
}

export class DataStore {
  private static instance: DataStore;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  // Create a new user account
  async createUser(userData: CreateUserData): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create account'
        };
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Authenticate user credentials (first step)
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          step: 'credentials'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Validate PIN (second step)
  async validatePin(userId: string, pin: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/validate-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          pin
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'PIN validation failed'
        };
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Error validating PIN:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users?id=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'User not found'
        };
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'User not found'
        };
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // NEW: Get all users for admin
  async getAllUsersAPI(): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users`);
      const data = await response.json();
      console.log("Data: ", data)

      if (!response.ok) {
        console.error('Failed to fetch all users:', data.error);
        return [];
      }

      return data.users || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // NEW: Get all transactions for admin
  async getAllTransactionsAPI(): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/transactions`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch all transactions:', data.error);
        return [];
      }

      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  }

  // NEW: Get user by ID for admin (with more detailed data)
  async getUserByIdAPI(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users?id=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch user:', data.error);
        return null;
      }

      return data.user || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // NEW: Search users with filters
  async searchUsersAPI(searchTerm: string, filters: UserFilters): Promise<User[]> {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.verification !== 'all') queryParams.append('verification', filters.verification);
      
      const response = await fetch(`${this.baseUrl}/api/admin/users/search?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to search users:', data.error);
        return [];
      }

      return data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // NEW: Update user - FIXED: Changed from PUT to PATCH
  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users/${userId}`, {
        method: 'PATCH', // Changed from PUT to PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to update user:', data.error);
        return null;
      }

      return data.user || null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // NEW: Lock user account
  async lockUserAccount(userId: string, reason: string): Promise<User | null> {
    return this.updateUser(userId, {
      accountStatus: 'locked',
      lockReason: reason,
    });
  }

  // NEW: Unlock user account
  async unlockUserAccount(userId: string): Promise<User | null> {
    return this.updateUser(userId, {
      accountStatus: 'verified',
      lockReason: undefined,
    });
  }

  // NEW: Suspend user account
  async suspendUserAccount(userId: string, reason: string): Promise<User | null> {
    return this.updateUser(userId, {
      accountStatus: 'suspended',
      suspensionReason: reason,
    });
  }

  // NEW: Close user account
  async closeUserAccount(userId: string): Promise<User | null> {
    return this.updateUser(userId, {
      accountStatus: 'closed',
      isActive: false,
    });
  }

  // NEW: Get user by ID (sync version for compatibility)
  getUserByIdSync(userId: string): User | null {
    // This is a fallback - in reality, we'd need to make this async
    // For now, return null to indicate not found
    console.warn('getUserByIdSync called - this should be replaced with async version');
    return null;
  }

  // NEW: Export data for admin
  async exportDataAPI(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/export`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to export data');
      }

      return JSON.stringify(data.data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Check if user is authenticated (client-side helper)
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isAuth = localStorage.getItem('isAuthenticated');
    const userId = localStorage.getItem('currentUserId');
    
    return isAuth === 'true' && userId !== null;
  }

  // Get current user ID (client-side helper)
  getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('currentUserId');
  }

  // Sign out user (client-side helper)
  signOut(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUserId');
  }

  // Debug methods for development
  async getDataStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug?action=stats`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to get stats:', data.error);
        return null;
      }

      return data.stats;
    } catch (error) {
      console.error('Error fetching debug stats:', error);
      return null;
    }
  }

  async exportData(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug?action=export`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to export data');
      }

      return JSON.stringify(data.data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug`, {
        method: 'DELETE',
        headers: {
          'x-debug-mode': 'true'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to clear data:', data.error);
        return false;
      }

      // Clear local session data as well
      this.signOut();
      
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Transaction management methods
  async getTransactionsByUserId(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/transactions?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch transactions:', data.error);
        return [];
      }

      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async createTransaction(transactionData: {
    userId: string;
    type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'credit' | 'debit';
    amount: number;
    description?: string;
    category?: string;
    fromAccount?: string;
    toAccount?: string;
  }): Promise<{ success: boolean; transaction?: any; newBalance?: number; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create transaction'
        };
      }

      return {
        success: true,
        transaction: data.transaction,
        newBalance: data.newBalance
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Helper method to format transactions for the dashboard
  formatTransactionsForDashboard(transactions: any[]): any[] {
    return transactions.map((txn) => ({
      id: txn.id,
      type: txn.type === 'deposit' ? 'credit' : 'debit',
      description: txn.description || `${txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}`,
      amount: txn.amount,
      date: new Date(txn.date).toLocaleDateString(),
      category: txn.category || 'general',
      status: txn.status || 'completed'
    }));
  }

  // Admin authentication methods
  async authenticateAdmin(username: string, password: string): Promise<{ success: boolean; admin?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      return {
        success: true,
        admin: data.admin
      };
    } catch (error) {
      console.error('Error authenticating admin:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  async getAdminById(adminId: string): Promise<{ success: boolean; admin?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/auth?id=${adminId}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Admin not found'
        };
      }

      return {
        success: true,
        admin: data.admin
      };
    } catch (error) {
      console.error('Error fetching admin:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Admin session helpers
  isAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isAuth = localStorage.getItem('isAdminAuthenticated');
    const adminId = localStorage.getItem('currentAdminId');
    
    return isAuth === 'true' && adminId !== null;
  }

  getCurrentAdminId(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('currentAdminId');
  }

  signOutAdmin(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('currentAdminId');
  }

  // ===== BILLS MANAGEMENT METHODS =====

  // Get bills by user ID
  async getBillsByUserId(userId: string): Promise<Bill[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bills?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch bills:', data.error);
        return [];
      }

      return data.bills || [];
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  // Create a new bill
  async createBill(billData: {
    userId: string;
    company: string;
    amount: number;
    dueDate: string;
    category: string;
    accountNumber?: string;
    description?: string;
  }): Promise<{ success: boolean; bill?: Bill; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...billData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create bill'
        };
      }

      return {
        success: true,
        bill: data.bill
      };
    } catch (error) {
      console.error('Error creating bill:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Update bill status or details
  async updateBill(billId: string, updateData: Partial<Bill>): Promise<Bill | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bills/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updateData,
          updatedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to update bill:', data.error);
        return null;
      }

      return data.bill || null;
    } catch (error) {
      console.error('Error updating bill:', error);
      return null;
    }
  }

  // Delete a bill
  async deleteBill(billId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bills/${billId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete bill');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting bill:', error);
      return false;
    }
  }

  // Get all bills for admin
  async getAllBillsAPI(): Promise<Bill[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/bills`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch all bills:', data.error);
        return [];
      }

      return data.bills || [];
    } catch (error) {
      console.error('Error fetching all bills:', error);
      return [];
    }
  }

  // Mark bill as paid
  async markBillAsPaid(billId: string): Promise<Bill | null> {
    return this.updateBill(billId, {
      status: 'paid'
    });
  }

  // Mark bill as overdue
  async markBillAsOverdue(billId: string): Promise<Bill | null> {
    return this.updateBill(billId, {
      status: 'overdue'
    });
  }

  // Get bills by status
  async getBillsByStatus(userId: string, status: 'pending' | 'paid' | 'overdue'): Promise<Bill[]> {
    try {
      const allBills = await this.getBillsByUserId(userId);
      return allBills.filter(bill => bill.status === status);
    } catch (error) {
      console.error('Error filtering bills by status:', error);
      return [];
    }
  }

  // Get overdue bills for a user
  async getOverdueBills(userId: string): Promise<Bill[]> {
    try {
      const allBills = await this.getBillsByUserId(userId);
      const currentDate = new Date();
      
      return allBills.filter(bill => {
        const dueDate = new Date(bill.dueDate);
        return bill.status === 'pending' && dueDate < currentDate;
      });
    } catch (error) {
      console.error('Error fetching overdue bills:', error);
      return [];
    }
  }

  // Get upcoming bills (due in next 7 days)
  async getUpcomingBills(userId: string): Promise<Bill[]> {
    try {
      const allBills = await this.getBillsByUserId(userId);
      const currentDate = new Date();
      const nextWeek = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return allBills.filter(bill => {
        const dueDate = new Date(bill.dueDate);
        return bill.status === 'pending' && dueDate >= currentDate && dueDate <= nextWeek;
      });
    } catch (error) {
      console.error('Error fetching upcoming bills:', error);
      return [];
    }
  }

  // Sync version for compatibility (fallback)
  getBillsByUserIdSync(userId: string): Bill[] {
    console.warn('getBillsByUserIdSync called - this should be replaced with async version');
    // For backward compatibility, return empty array
    // In a real implementation, you might want to cache bills or use a different approach
    return [];
  }
}