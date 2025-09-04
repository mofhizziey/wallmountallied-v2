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
      const response = await fetch(`${this.baseUrl}/api/admin/users/`);
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
      const response = await fetch(`${this.baseUrl}/api/admin/transactions/`);
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
      const response = await fetch(`${this.baseUrl}/api/admin/users?id=${userId}/`);
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
      
      const response = await fetch(`${this.baseUrl}/api/admin/users/search?${queryParams}/`);
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

  // NEW: Update user
  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/users/${userId}/`, {
        method: 'PUT',
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
      const response = await fetch(`${this.baseUrl}/api/transactions/`, {
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
}