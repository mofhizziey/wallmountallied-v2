// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TRANSACTIONS_FILE = path.join(process.cwd(), 'data', 'transactions.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(TRANSACTIONS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read transactions from JSON file
async function readTransactions() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(TRANSACTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Write transactions to JSON file
async function writeTransactions(transactions: any[]) {
  await ensureDataDirectory();
  await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// GET - Get all transactions for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    let transactions = await readTransactions();

    // Filter by user if specified
    if (userId) {
      transactions = transactions.filter((t: any) => t.userId === userId);
    }

    // Filter by status if specified
    if (status && status !== 'all') {
      transactions = transactions.filter((t: any) => t.status === status);
    }

    // Filter by type if specified
    if (type && type !== 'all') {
      transactions = transactions.filter((t: any) => t.type === type);
    }

    // Sort by date (newest first)
    transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        transactions = transactions.slice(0, limitNum);
      }
    }

    return NextResponse.json({
      success: true,
      transactions: transactions
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
    const transactions = await readTransactions();

    // Create new transaction
    const newTransaction = {
      id: generateId(),
      userId: transactionData.userId,
      type: transactionData.type,
      amount: parseFloat(transactionData.amount),
      description: transactionData.description || '',
      date: new Date().toISOString(),
      category: transactionData.category || 'General',
      status: transactionData.status || 'completed',
      fromAccount: transactionData.fromAccount,
      toAccount: transactionData.toAccount,
      createdBy: 'admin', // Mark as admin-created
      ...transactionData // Allow any additional fields
    };

    transactions.push(newTransaction);
    await writeTransactions(transactions);

    return NextResponse.json({
      success: true,
      transaction: newTransaction
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
    const transactions = await readTransactions();
    
    const transactionIndex = transactions.findIndex((t: any) => t.id === transactionId);
    if (transactionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction data
    transactions[transactionIndex] = { 
      ...transactions[transactionIndex], 
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    };
    
    await writeTransactions(transactions);

    return NextResponse.json({
      success: true,
      transaction: transactions[transactionIndex]
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

    const transactions = await readTransactions();
    const transactionIndex = transactions.findIndex((t: any) => t.id === transactionId);
    
    if (transactionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Remove the transaction
    const deletedTransaction = transactions.splice(transactionIndex, 1)[0];
    await writeTransactions(transactions);

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
      deletedTransaction: deletedTransaction
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}