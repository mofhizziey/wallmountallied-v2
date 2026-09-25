import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/export - Export all data
export async function GET(request: NextRequest) {
  try {
    const isAdminAuth = request.headers.get('x-admin-auth');
    
    // Fetch all users and transactions
    const [{ data: users, error: usersErr }, { data: transactions, error: txErr }] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('transactions').select('*')
    ]);
    
    if (usersErr) throw new Error(usersErr.message);
    if (txErr) throw new Error(txErr.message);

    const safeUsers = users || [];
    const safeTx = transactions || [];

    // Calculate statistics
    const stats = {
      totalUsers: safeUsers.length,
      totalTransactions: safeTx.length,
      verifiedUsers: safeUsers.filter((u: any) => u.account_status === 'verified').length,
      pendingUsers: safeUsers.filter((u: any) => u.account_status === 'pending').length,
      suspendedUsers: safeUsers.filter((u: any) => u.account_status === 'suspended').length,
      lockedUsers: safeUsers.filter((u: any) => u.account_status === 'locked').length,
      totalCheckingBalance: safeUsers.reduce((sum: number, u: any) => sum + (u.checking_balance || 0), 0),
      totalSavingsBalance: safeUsers.reduce((sum: number, u: any) => sum + (u.savings_balance || 0), 0),
    }
    
    // Prepare export data with metadata
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin',
        version: '1.0.0',
        statistics: stats
      },
      users: safeUsers.map((user: any) => ({
        ...user,
        ssn: user.ssn ? `***-**-${user.ssn.slice(-4)}` : null,
        totalBalance: (user.checking_balance || 0) + (user.savings_balance || 0),
        accountAge: user.created_at ? 
          Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) + ' days' 
          : 'N/A'
      })),
      transactions: safeTx.map((txn: any) => ({
        ...txn,
        userName: (() => {
          const user = safeUsers.find((u: any) => u.id === txn.user_id)
          return user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
        })()
      })),
      summary: {
        dateRange: {
          start: safeTx.length > 0 ? 
            safeTx.reduce((earliest: string, t: any) => 
              new Date(t.date) < new Date(earliest) ? t.date : earliest, 
              safeTx[0].date
            ) : null,
          end: safeTx.length > 0 ?
            safeTx.reduce((latest: string, t: any) => 
              new Date(t.date) > new Date(latest) ? t.date : latest, 
              safeTx[0].date
            ) : null
        },
        usersByStatus: {
          pending: safeUsers.filter((u: any) => u.account_status === 'pending').length,
          verified: safeUsers.filter((u: any) => u.account_status === 'verified').length,
          suspended: safeUsers.filter((u: any) => u.account_status === 'suspended').length,
          locked: safeUsers.filter((u: any) => u.account_status === 'locked').length,
          closed: safeUsers.filter((u: any) => u.account_status === 'closed').length,
        },
        transactionsByType: {
          credit: safeTx.filter((t: any) => t.type === 'credit').length,
          debit: safeTx.filter((t: any) => t.type === 'debit').length,
          deposit: safeTx.filter((t: any) => t.type === 'deposit').length,
          withdrawal: safeTx.filter((t: any) => t.type === 'withdrawal').length,
          transfer: safeTx.filter((t: any) => t.type === 'transfer').length,
        },
        totalVolume: {
          credits: safeTx
            .filter((t: any) => t.type === 'credit' || t.type === 'deposit')
            .reduce((sum: number, t: any) => sum + t.amount, 0),
          debits: safeTx
            .filter((t: any) => t.type === 'debit' || t.type === 'withdrawal')
            .reduce((sum: number, t: any) => sum + t.amount, 0),
        }
      }
    }
    
    return NextResponse.json({ success: true, data: exportData })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

// POST /api/admin/export - Export with filters (optional)
export async function POST(request: NextRequest) {
  try {
    const filters = await request.json()
    
    let uQuery = supabase.from('users').select('*');
    let tQuery = supabase.from('transactions').select('*');

    if (filters.dateRange?.start) {
      uQuery = uQuery.gte('created_at', filters.dateRange.start);
      tQuery = tQuery.gte('date', filters.dateRange.start);
    }
    if (filters.dateRange?.end) {
      uQuery = uQuery.lte('created_at', filters.dateRange.end);
      tQuery = tQuery.lte('date', filters.dateRange.end);
    }
    
    if (filters.userStatus) {
      uQuery = uQuery.eq('account_status', filters.userStatus);
    }

    const [{ data: users, error: usersErr }, { data: transactions, error: txErr }] = await Promise.all([
      uQuery, tQuery
    ]);

    if (usersErr) throw new Error(usersErr.message);
    if (txErr) throw new Error(txErr.message);

    let filteredUsers = users || [];
    let filteredTransactions = transactions || [];
    
    // Filter transactions by user status
    if (filters.userStatus) {
      const userIds = filteredUsers.map((u: any) => u.id);
      filteredTransactions = filteredTransactions.filter((t: any) => userIds.includes(t.user_id));
    }

    if (filters.minBalance !== undefined) {
      filteredUsers = filteredUsers.filter((u: any) => 
        ((u.checking_balance || 0) + (u.savings_balance || 0)) >= filters.minBalance
      )
    }
    
    if (filters.maxBalance !== undefined) {
      filteredUsers = filteredUsers.filter((u: any) => 
        ((u.checking_balance || 0) + (u.savings_balance || 0)) <= filters.maxBalance
      )
    }
    
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin',
        version: '1.0.0',
        filters: filters,
        recordCount: {
          users: filteredUsers.length,
          transactions: filteredTransactions.length
        }
      },
      users: filteredUsers.map((user: any) => ({
        ...user,
        ssn: user.ssn ? `***-**-${user.ssn.slice(-4)}` : null,
        totalBalance: (user.checking_balance || 0) + (user.savings_balance || 0)
      })),
      transactions: filteredTransactions.map((txn: any) => ({
        ...txn,
        userName: (() => {
          const user = filteredUsers.find((u: any) => u.id === txn.user_id)
          return user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
        })()
      }))
    }
    
    return NextResponse.json({ success: true, data: exportData })
  } catch (error) {
    console.error('Error exporting filtered data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}