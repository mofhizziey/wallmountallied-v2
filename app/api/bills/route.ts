import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase';

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
  recentActivity: any[];
}

// Calculate bill statistics
function calculateBillStats(bills: any[]): BillStats {
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

// Map Supabase snake_case to camelCase
const mapBill = (b: any) => ({
  id: b.id,
  userId: b.user_id,
  company: b.company,
  amount: b.amount,
  dueDate: b.due_date,
  category: b.category,
  status: b.status,
  accountNumber: b.account_number,
  description: b.description,
  createdAt: b.created_at,
  updatedAt: b.updated_at
});

// GET: Get all bills for admin with optional filtering and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const includeStats = searchParams.get('includeStats') === 'true';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    let query = supabase.from('bills').select('*');
    
    if (userId) query = query.eq('user_id', userId);
    if (status && ['pending', 'paid', 'overdue'].includes(status)) query = query.eq('status', status);
    if (category) query = query.ilike('category', `%${category}%`);
    
    query = query.order('updated_at', { ascending: false });

    // For stats we need all bills (filtered only by user/status/category but not paginated)
    const { data: allBills, error } = await query;
    if (error) throw new Error(error.message);

    const camelBills = (allBills || []).map(mapBill);

    // Apply pagination if specified (in JS since stats need all records anyway)
    let paginatedBills = [...camelBills];
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      paginatedBills = paginatedBills.slice(offsetNum, offsetNum + limitNum);
    }
    
    const response: any = {
      success: true,
      bills: paginatedBills,
      count: paginatedBills.length,
      totalCount: camelBills.length
    };
    
    if (includeStats) {
      response.stats = calculateBillStats(camelBills);
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
    const data = await request.json();
    
    const required = ['userId', 'company', 'amount', 'dueDate', 'category'];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }
    
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }
    
    if (isNaN(new Date(data.dueDate).getTime())) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
    }
    
    const newId = `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: inserted, error } = await supabase
      .from('bills')
      .insert({
        id: newId,
        user_id: data.userId,
        company: data.company,
        amount: data.amount,
        due_date: data.dueDate,
        category: data.category,
        status: data.status || 'pending',
        account_number: data.accountNumber,
        description: data.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    
    return NextResponse.json({
      success: true,
      bill: mapBill(inserted),
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
    const data = await request.json();
    const { billIds, updateData } = data;
    
    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json({ error: 'billIds array is required' }, { status: 400 });
    }
    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json({ error: 'updateData object is required' }, { status: 400 });
    }

    const sbUpdate: any = { updated_at: new Date().toISOString() };
    if (updateData.company) sbUpdate.company = updateData.company;
    if (updateData.amount) sbUpdate.amount = updateData.amount;
    if (updateData.dueDate) sbUpdate.due_date = updateData.dueDate;
    if (updateData.category) sbUpdate.category = updateData.category;
    if (updateData.status) sbUpdate.status = updateData.status;
    if (updateData.accountNumber) sbUpdate.account_number = updateData.accountNumber;
    if (updateData.description) sbUpdate.description = updateData.description;
    
    const { data: updatedBills, error } = await supabase
      .from('bills')
      .update(sbUpdate)
      .in('id', billIds)
      .select();

    if (error) throw new Error(error.message);
    
    const foundIds = updatedBills.map(b => b.id);
    const notFoundIds = billIds.filter(id => !foundIds.includes(id));
    
    return NextResponse.json({
      success: true,
      updatedBills: updatedBills.map(mapBill),
      notFoundIds,
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
    const { searchParams } = new URL(request.url);
    const billIdsParam = searchParams.get('billIds');
    
    if (!billIdsParam) {
      return NextResponse.json({ error: 'billIds parameter is required' }, { status: 400 });
    }
    
    const billIds = billIdsParam.split(',');
    
    const { data: deletedBills, error } = await supabase
      .from('bills')
      .delete()
      .in('id', billIds)
      .select();

    if (error) throw new Error(error.message);
    
    const foundIds = deletedBills.map(b => b.id);
    const notFoundIds = billIds.filter(id => !foundIds.includes(id));
    
    return NextResponse.json({
      success: true,
      deletedBills: deletedBills.map(mapBill),
      notFoundIds,
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