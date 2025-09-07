// app/api/admin/bills/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface Bill {
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

interface BillStats {
  totalBills: number;
  pendingBills: number;
  paidBills: number;
  overdueBills: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  billsByCategory: { [key: string]: number };
  billsByUser: { [key: string]: number };
  recentActivity: Bill[];
}

// Get bills data (shared with other routes)
function getBillsData(): Bill[] {
  if (typeof global !== 'undefined' && (global as any).billsData) {
    return (global as any).billsData;
  }
  return [];
}

// Calculate bill statistics
function calculateBillStats(bills: Bill[]): BillStats {
  const stats: BillStats = {
    totalBills: bills.length,
    pendingBills: 0,
    paidBills: 0,
    overdueBills: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0,
    billsByCategory: {},
    billsByUser: {},
    recentActivity: []
  };

  bills.forEach(bill => {
    // Count by status
    switch (bill.status) {
      case 'pending':
        stats.pendingBills++;
        stats.pendingAmount += bill.amount;
        break;
      case 'paid':
        stats.paidBills++;
        stats.paidAmount += bill.amount;
        break;
      case 'overdue':
        stats.overdueBills++;
        stats.overdueAmount += bill.amount;
        break;
    }

    // Total amount
    stats.totalAmount += bill.amount;

    // Count by category
    if (stats.billsByCategory[bill.category]) {
      stats.billsByCategory[bill.category]++;
    } else {
      stats.billsByCategory[bill.category] = 1;
    }

    // Count by user
    if (stats.billsByUser[bill.userId]) {
      stats.billsByUser[bill.userId]++;
    } else {
      stats.billsByUser[bill.userId] = 1;
    }
  });

  // Get recent activity (bills updated in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  stats.recentActivity = bills
    .filter(bill => new Date(bill.updatedAt) > sevenDaysAgo)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10); // Latest 10 activities

  return stats;
}

// GET: Get all bills for admin with optional filtering and stats
export async function GET(request: NextRequest) {
  try {
    const bills = getBillsData();
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const includeStats = searchParams.get('includeStats') === 'true';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    let filteredBills = [...bills];
    
    // Apply filters
    if (userId) {
      filteredBills = filteredBills.filter(bill => bill.userId === userId);
    }
    
    if (status && ['pending', 'paid', 'overdue'].includes(status)) {
      filteredBills = filteredBills.filter(bill => bill.status === status);
    }
    
    if (category) {
      filteredBills = filteredBills.filter(bill => 
        bill.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Sort by most recent first
    filteredBills.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Apply pagination if specified
    const totalCount = filteredBills.length;
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      filteredBills = filteredBills.slice(offsetNum, offsetNum + limitNum);
    }
    
    const response: any = {
      success: true,
      bills: filteredBills,
      count: filteredBills.length,
      totalCount: totalCount
    };
    
    // Include statistics if requested
    if (includeStats) {
      response.stats = calculateBillStats(bills);
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching bills for admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Admin create bill for any user
export async function POST(request: NextRequest) {
  try {
    const bills = getBillsData();
    const data = await request.json();
    
    // Validate required fields
    const required = ['userId', 'company', 'amount', 'dueDate', 'category'];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }
    
    if (isNaN(new Date(data.dueDate).getTime())) {
      return NextResponse.json(
        { error: 'Invalid due date' },
        { status: 400 }
      );
    }
    
    const newBill: Bill = {
      id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      company: data.company,
      amount: data.amount,
      dueDate: data.dueDate,
      category: data.category,
      status: data.status || 'pending',
      accountNumber: data.accountNumber,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    bills.push(newBill);
    
    // Update global data
    if (typeof global !== 'undefined') {
      (global as any).billsData = bills;
    }
    
    return NextResponse.json({
      success: true,
      bill: newBill,
      message: 'Bill created successfully by admin'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating bill (admin):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Admin bulk update bills
export async function PUT(request: NextRequest) {
  try {
    const bills = getBillsData();
    const data = await request.json();
    
    const { billIds, updateData } = data;
    
    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json(
        { error: 'billIds array is required' },
        { status: 400 }
      );
    }
    
    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json(
        { error: 'updateData object is required' },
        { status: 400 }
      );
    }
    
    const updatedBills: Bill[] = [];
    const notFoundIds: string[] = [];
    
    billIds.forEach((billId: string) => {
      const billIndex = bills.findIndex(b => b.id === billId);
      
      if (billIndex === -1) {
        notFoundIds.push(billId);
      } else {
        const updatedBill: Bill = {
          ...bills[billIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        bills[billIndex] = updatedBill;
        updatedBills.push(updatedBill);
      }
    });
    
    // Update global data
    if (typeof global !== 'undefined') {
      (global as any).billsData = bills;
    }
    
    return NextResponse.json({
      success: true,
      updatedBills: updatedBills,
      notFoundIds: notFoundIds,
      message: `${updatedBills.length} bills updated successfully`
    });
    
  } catch (error) {
    console.error('Error bulk updating bills (admin):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Admin bulk delete bills
export async function DELETE(request: NextRequest) {
  try {
    const bills = getBillsData();
    const { searchParams } = new URL(request.url);
    
    const billIdsParam = searchParams.get('billIds');
    
    if (!billIdsParam) {
      return NextResponse.json(
        { error: 'billIds parameter is required' },
        { status: 400 }
      );
    }
    
    const billIds = billIdsParam.split(',');
    const deletedBills: Bill[] = [];
    const notFoundIds: string[] = [];
    
    billIds.forEach(billId => {
      const billIndex = bills.findIndex(b => b.id === billId);
      
      if (billIndex === -1) {
        notFoundIds.push(billId);
      } else {
        const deletedBill = bills.splice(billIndex, 1)[0];
        deletedBills.push(deletedBill);
      }
    });
    
    // Update global data
    if (typeof global !== 'undefined') {
      (global as any).billsData = bills;
    }
    
    return NextResponse.json({
      success: true,
      deletedBills: deletedBills,
      notFoundIds: notFoundIds,
      message: `${deletedBills.length} bills deleted successfully`
    });
    
  } catch (error) {
    console.error('Error bulk deleting bills (admin):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}