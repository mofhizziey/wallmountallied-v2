// app/api/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'bank-data.json')

// Ensure data directory and file exist
async function ensureDataFile() {
  const dir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
  
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ users: [], transactions: [], admins: [] }))
  }
}

// GET /api/admin/export - Export all data
export async function GET(request: NextRequest) {
  try {
    // Check if admin is authenticated (you can add more robust auth check here)
    const isAdminAuth = request.headers.get('x-admin-auth')
    
    await ensureDataFile()
    
    // Read the data file
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // Calculate statistics
    const stats = {
      totalUsers: data.users.length,
      totalTransactions: data.transactions.length,
      verifiedUsers: data.users.filter((u: any) => u.accountStatus === 'verified').length,
      pendingUsers: data.users.filter((u: any) => u.accountStatus === 'pending').length,
      suspendedUsers: data.users.filter((u: any) => u.accountStatus === 'suspended').length,
      lockedUsers: data.users.filter((u: any) => u.accountStatus === 'locked').length,
      totalCheckingBalance: data.users.reduce((sum: number, u: any) => sum + (u.checkingBalance || 0), 0),
      totalSavingsBalance: data.users.reduce((sum: number, u: any) => sum + (u.savingsBalance || 0), 0),
    }
    
    // Prepare export data with metadata
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin',
        version: '1.0.0',
        statistics: stats
      },
      users: data.users.map((user: any) => ({
        ...user,
        // Mask sensitive data partially
        ssn: user.ssn ? `***-**-${user.ssn.slice(-4)}` : null,
        // Include calculated fields
        totalBalance: (user.checkingBalance || 0) + (user.savingsBalance || 0),
        accountAge: user.createdAt ? 
          Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + ' days' 
          : 'N/A'
      })),
      transactions: data.transactions.map((txn: any) => ({
        ...txn,
        // Add user info for context
        userName: (() => {
          const user = data.users.find((u: any) => u.id === txn.userId)
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
        })()
      })),
      summary: {
        dateRange: {
          start: data.transactions.length > 0 ? 
            data.transactions.reduce((earliest: string, t: any) => 
              new Date(t.date) < new Date(earliest) ? t.date : earliest, 
              data.transactions[0].date
            ) : null,
          end: data.transactions.length > 0 ?
            data.transactions.reduce((latest: string, t: any) => 
              new Date(t.date) > new Date(latest) ? t.date : latest, 
              data.transactions[0].date
            ) : null
        },
        usersByStatus: {
          pending: data.users.filter((u: any) => u.accountStatus === 'pending').length,
          verified: data.users.filter((u: any) => u.accountStatus === 'verified').length,
          suspended: data.users.filter((u: any) => u.accountStatus === 'suspended').length,
          locked: data.users.filter((u: any) => u.accountStatus === 'locked').length,
          closed: data.users.filter((u: any) => u.accountStatus === 'closed').length,
        },
        transactionsByType: {
          credit: data.transactions.filter((t: any) => t.type === 'credit').length,
          debit: data.transactions.filter((t: any) => t.type === 'debit').length,
          deposit: data.transactions.filter((t: any) => t.type === 'deposit').length,
          withdrawal: data.transactions.filter((t: any) => t.type === 'withdrawal').length,
          transfer: data.transactions.filter((t: any) => t.type === 'transfer').length,
        },
        totalVolume: {
          credits: data.transactions
            .filter((t: any) => t.type === 'credit' || t.type === 'deposit')
            .reduce((sum: number, t: any) => sum + t.amount, 0),
          debits: data.transactions
            .filter((t: any) => t.type === 'debit' || t.type === 'withdrawal')
            .reduce((sum: number, t: any) => sum + t.amount, 0),
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: exportData
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

// POST /api/admin/export - Export with filters (optional)
export async function POST(request: NextRequest) {
  try {
    await ensureDataFile()
    
    const filters = await request.json()
    
    // Read the data file
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8')
    const data = JSON.parse(fileContent)
    
    let filteredUsers = [...data.users]
    let filteredTransactions = [...data.transactions]
    
    // Apply filters if provided
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      if (start) {
        const startDate = new Date(start)
        filteredTransactions = filteredTransactions.filter((t: any) => 
          new Date(t.date) >= startDate
        )
        filteredUsers = filteredUsers.filter((u: any) => 
          new Date(u.createdAt) >= startDate
        )
      }
      if (end) {
        const endDate = new Date(end)
        filteredTransactions = filteredTransactions.filter((t: any) => 
          new Date(t.date) <= endDate
        )
        filteredUsers = filteredUsers.filter((u: any) => 
          new Date(u.createdAt) <= endDate
        )
      }
    }
    
    if (filters.userStatus) {
      filteredUsers = filteredUsers.filter((u: any) => 
        u.accountStatus === filters.userStatus
      )
      // Also filter transactions for these users
      const userIds = filteredUsers.map((u: any) => u.id)
      filteredTransactions = filteredTransactions.filter((t: any) => 
        userIds.includes(t.userId)
      )
    }
    
    if (filters.minBalance !== undefined) {
      filteredUsers = filteredUsers.filter((u: any) => 
        (u.checkingBalance + u.savingsBalance) >= filters.minBalance
      )
    }
    
    if (filters.maxBalance !== undefined) {
      filteredUsers = filteredUsers.filter((u: any) => 
        (u.checkingBalance + u.savingsBalance) <= filters.maxBalance
      )
    }
    
    // Prepare filtered export data
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
        totalBalance: (user.checkingBalance || 0) + (user.savingsBalance || 0)
      })),
      transactions: filteredTransactions.map((txn: any) => ({
        ...txn,
        userName: (() => {
          const user = data.users.find((u: any) => u.id === txn.userId)
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
        })()
      }))
    }
    
    return NextResponse.json({
      success: true,
      data: exportData
    })
  } catch (error) {
    console.error('Error exporting filtered data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}