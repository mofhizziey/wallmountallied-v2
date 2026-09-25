import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// GET - Get transactions by user ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase error fetching transactions:', error);
      throw new Error(error.message);
    }

    const mappedTransactions = transactions.map(tx => ({
      id: tx.id,
      userId: tx.user_id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date,
      category: tx.category,
      status: tx.status,
      fromAccount: tx.from_account,
      toAccount: tx.to_account
    }));

    return NextResponse.json({
      success: true,
      transactions: mappedTransactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const transactionData = await request.json();
    const { userId, type, amount, description, category } = transactionData;

    if (!userId || !type || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required transaction data' },
        { status: 400 }
      );
    }

    if (!['deposit', 'withdrawal', 'transfer', 'payment'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Get user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('checking_balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let newBalance = Number(user.checking_balance);
    const txAmount = parseFloat(amount);

    if (type === 'deposit') {
      newBalance += txAmount;
    } else if (type === 'withdrawal' || type === 'payment') {
      if (newBalance < txAmount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds' },
          { status: 400 }
        );
      }
      newBalance -= txAmount;
    }

    // Insert transaction
    const newTxId = generateId();
    const { data: newTx, error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          id: newTxId,
          user_id: userId,
          type: type,
          amount: txAmount,
          description: description || '',
          category: category || 'general',
          status: 'completed',
          date: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      throw new Error(txError.message);
    }

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ checking_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: newTx.id,
        userId: newTx.user_id,
        type: newTx.type,
        amount: newTx.amount,
        description: newTx.description,
        category: newTx.category,
        date: newTx.date,
        status: newTx.status
      },
      newBalance
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}