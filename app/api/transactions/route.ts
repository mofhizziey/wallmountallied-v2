// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TRANSACTIONS_FILE = path.join(process.cwd(), 'data', 'transactions.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

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

// Read users from JSON file
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write users to JSON file
async function writeUsers(users: any[]) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

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

    const transactions = await readTransactions();
    const userTransactions = transactions.filter((txn: any) => txn.userId === userId);

    // Sort by date (newest first)
    userTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      transactions: userTransactions
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

    // Validate transaction type
    if (!['deposit', 'withdrawal', 'transfer', 'payment'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Read current data
    const transactions = await readTransactions();
    const users = await readUsers();

    // Find user
    const userIndex = users.findIndex((user: any) => user.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[userIndex];

    // Create new transaction
    const newTransaction = {
      id: generateId(),
      userId,
      type,
      amount: parseFloat(amount),
      description: description || '',
      category: category || 'general',
      date: new Date().toISOString(),
      status: 'completed'
    };

    // Update user balance based on transaction type
    if (type === 'deposit') {
      user.checkingBalance += newTransaction.amount;
    } else if (type === 'withdrawal' || type === 'payment') {
      if (user.checkingBalance < newTransaction.amount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient funds' },
          { status: 400 }
        );
      }
      user.checkingBalance -= newTransaction.amount;
    }

    // Add transaction and update user
    transactions.push(newTransaction);
    users[userIndex] = user;

    // Save to files
    await writeTransactions(transactions);
    await writeUsers(users);

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      newBalance: user.checkingBalance
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}