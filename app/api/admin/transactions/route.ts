import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Map Supabase to camelCase
const mapTx = (tx: any) => ({
  id: tx.id,
  userId: tx.user_id,
  type: tx.type,
  amount: tx.amount,
  description: tx.description,
  date: tx.date,
  category: tx.category,
  status: tx.status,
  fromAccount: tx.from_account,
  toAccount: tx.to_account,
  createdBy: tx.created_by,
  updatedAt: tx.updated_at,
  updatedBy: tx.updated_by
});

// GET - Get all transactions for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    let query = supabase.from('transactions').select('*');

    if (userId) query = query.eq('user_id', userId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('type', type);

    query = query.order('date', { ascending: false });

    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: transactions, error } = await query;
    
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      transactions: (transactions || []).map(mapTx)
    });

  } catch (error) {
    console.error('Error fetching transactions for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Create new transaction (admin)
export async function POST(request: NextRequest) {
  try {
    const transactionData = await request.json();

    const newTxId = generateId();
    const { data: newTx, error } = await supabase
      .from('transactions')
      .insert({
        id: newTxId,
        user_id: transactionData.userId,
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        description: transactionData.description || '',
        category: transactionData.category || 'general',
        status: transactionData.status || 'completed',
        date: new Date().toISOString(),
        from_account: transactionData.fromAccount,
        to_account: transactionData.toAccount,
        created_by: 'admin'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      transaction: mapTx(newTx)
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

// PUT - Update transaction (admin)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    const sbUpdate: any = {
      updated_at: new Date().toISOString(),
      updated_by: 'admin'
    };

    if (updateData.type) sbUpdate.type = updateData.type;
    if (updateData.amount) sbUpdate.amount = parseFloat(updateData.amount);
    if (updateData.description !== undefined) sbUpdate.description = updateData.description;
    if (updateData.category) sbUpdate.category = updateData.category;
    if (updateData.status) sbUpdate.status = updateData.status;
    if (updateData.fromAccount !== undefined) sbUpdate.from_account = updateData.fromAccount;
    if (updateData.toAccount !== undefined) sbUpdate.to_account = updateData.toAccount;
    
    const { data: updatedTx, error } = await supabase
      .from('transactions')
      .update(sbUpdate)
      .eq('id', transactionId)
      .select()
      .maybeSingle();

    if (error || !updatedTx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: mapTx(updatedTx)
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const { data: deletedTx, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .select()
      .maybeSingle();
    
    if (error || !deletedTx) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
      deletedTransaction: mapTx(deletedTx)
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}